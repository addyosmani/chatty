import {
  type ChatRequestOptions,
  type ChatTransport,
  type ModelMessage,
  type UIMessageChunk,
  convertToModelMessages,
  createUIMessageStream,
  extractReasoningMiddleware,
  streamText,
  toUIMessageStream,
  wrapLanguageModel,
} from "ai";
import type { WebLLMLanguageModel, WebLLMUIMessage } from "@browser-ai/web-llm";
import { type ChatDocument, retrieveContext } from "./rag";

export type TransportConfig = {
  /** Extra user context appended to the system prompt, if enabled in settings. */
  customizedInstructions?: string;
  /** Document attached to this chat, used for retrieval-augmented answers. */
  document?: ChatDocument;
};

const BASE_SYSTEM_PROMPT =
  "You are a helpful assistant. Assist the user with their questions.";

function buildSystemPrompt(
  config: TransportConfig,
  retrievedContext: string | null
): string {
  const parts = [BASE_SYSTEM_PROMPT];

  if (config.customizedInstructions?.trim()) {
    parts.push(
      `The user has provided the following information about themselves. Keep it in mind when responding: ${config.customizedInstructions.trim()}`
    );
  }

  if (retrievedContext) {
    parts.push(retrievedContext);
  }

  return parts.join("\n\n");
}

/** Last piece of user-authored text, used as the retrieval query. */
function lastUserText(messages: ModelMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role !== "user") {
      continue;
    }
    if (typeof message.content === "string") {
      return message.content;
    }
    const text = message.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim();
    if (text) {
      return text;
    }
  }
  return "";
}

/**
 * Client-side chat transport that runs inference in the browser via WebLLM,
 * streaming model download progress as a data part so the UI can show it.
 *
 * Config is immutable — build a new transport when settings change.
 *
 * @implements {ChatTransport<WebLLMUIMessage>}
 */
export class WebLLMChatTransport implements ChatTransport<WebLLMUIMessage> {
  private readonly createModel: () => WebLLMLanguageModel;
  private readonly config: TransportConfig;
  private model?: WebLLMLanguageModel;

  /**
   * @param createModel Builds the model on first use. It is a factory rather
   *   than an instance because constructing one spawns a Web Worker, which
   *   does not exist while Next.js prerenders on the server.
   */
  constructor(
    createModel: () => WebLLMLanguageModel,
    config: TransportConfig = {}
  ) {
    this.createModel = createModel;
    this.config = config;
  }

  private getModel(): WebLLMLanguageModel {
    if (!this.model) {
      this.model = this.createModel();
    }
    return this.model;
  }

  async sendMessages(
    options: {
      chatId: string;
      messages: WebLLMUIMessage[];
      abortSignal: AbortSignal | undefined;
    } & {
      trigger: "submit-message" | "submit-tool-result" | "regenerate-message";
      messageId: string | undefined;
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { chatId, messages, abortSignal } = options;
    const prompt = await convertToModelMessages(messages);
    const model = this.getModel();
    const config = this.config;

    return createUIMessageStream<WebLLMUIMessage>({
      execute: async ({ writer }) => {
        let downloadProgressId: string | undefined;

        const availability = await model.availability();
        if (availability === "unavailable") {
          throw new Error(
            "This browser does not support WebGPU, which is required to run models locally."
          );
        }

        // Only track progress if the model still needs downloading.
        if (availability !== "available") {
          await model.createSessionWithProgress((progress) => {
            const percent = Math.round(progress * 100);

            if (progress >= 1) {
              if (downloadProgressId) {
                writer.write({
                  type: "data-modelDownloadProgress",
                  id: downloadProgressId,
                  data: {
                    status: "complete",
                    progress: 100,
                    message:
                      "Model finished downloading! Getting ready for inference...",
                  },
                });
              }
              return;
            }

            if (!downloadProgressId) {
              downloadProgressId = `download-${Date.now()}`;
            }

            writer.write({
              type: "data-modelDownloadProgress",
              id: downloadProgressId,
              data: {
                status: "downloading",
                progress: percent,
                message: `Downloading model... ${percent}%`,
              },
            });
          });
        }

        let retrievedContext: string | null = null;
        if (config.document) {
          const query = lastUserText(prompt);
          if (query) {
            try {
              retrievedContext = await retrieveContext(
                chatId,
                config.document,
                query
              );
            } catch (error) {
              writer.write({
                type: "data-notification",
                data: {
                  level: "warning",
                  message: `Could not search "${config.document.name}": ${
                    error instanceof Error ? error.message : String(error)
                  }`,
                },
                transient: true,
              });
            }
          }
        }

        const result = streamText({
          model: wrapLanguageModel({
            model,
            // Surfaces <think> blocks from reasoning models as reasoning parts.
            middleware: extractReasoningMiddleware({ tagName: "think" }),
          }),
          system: buildSystemPrompt(config, retrievedContext),
          messages: prompt,
          abortSignal,
          onChunk: (event) => {
            if (event.chunk.type === "text-delta" && downloadProgressId) {
              writer.write({
                type: "data-modelDownloadProgress",
                id: downloadProgressId,
                data: { status: "complete", progress: 100, message: "" },
              });
              downloadProgressId = undefined;
            }
          },
        });

        writer.merge(
          toUIMessageStream({ stream: result.stream, sendStart: false })
        );
      },
    });
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // Client-side inference has no stream to reconnect to.
    return null;
  }
}
