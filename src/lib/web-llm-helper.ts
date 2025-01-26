// https://github.com/mlc-ai/web-llm/blob/main/examples/get-started-web-worker

import useChatStore from "@/hooks/useChatStore";
import { Model } from "./models";
import { Document } from "@langchain/core/documents";
import { getEmbeddingsInstance } from "./embed";
import type { AppConfig, MLCEngineInterface, InitProgressReport, CreateWebWorkerMLCEngine} from "@mlc-ai/web-llm";

export interface ChatCallbacks {
  onStart?: () => void;
  onResponse?: (message: string) => void;
  onFinish?: (message: string) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: InitProgressReport) => void;
}

export default class WebLLMHelper {
  engine: MLCEngineInterface | null;
  appConfig: AppConfig | null = null;

  public constructor(engine: MLCEngineInterface | null) {
    this.engine = engine;
  }

  // Initialize the engine with callbacks
  public async initialize(
    selectedModel: Model,
    callbacks?: ChatCallbacks
  ): Promise<MLCEngineInterface> {
    if (!("gpu" in navigator)) {
      callbacks?.onError?.("This device does not support GPU acceleration.");
      return Promise.reject("This device does not support GPU acceleration.");
    }

    callbacks?.onStart?.();

    let engineCreator: typeof CreateWebWorkerMLCEngine | null = null;

    try {
      const { prebuiltAppConfig, CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      engineCreator = CreateWebWorkerMLCEngine;

      this.appConfig = prebuiltAppConfig;
      this.appConfig.useIndexedDBCache = true;
    } catch (error) {
      callbacks?.onError?.(`Failed to load MLC AI dependencies: ${error instanceof Error ? error.message : error}`);
      return Promise.reject("Failed to load MLC AI dependencies");
    }

    await getEmbeddingsInstance();

    const chatOpts = {
      context_window_size: 6144,
      initProgressCallback: (report: InitProgressReport) => {
        callbacks?.onProgress?.(report);
      },
      appConfig: this.appConfig,
    };

    try {
      const engine = await engineCreator(
        new Worker(new URL("./worker.ts", import.meta.url), { type: "module" }),
        selectedModel.name,
        chatOpts
      );
      this.engine = engine;
      return engine;
    } catch (error) {
      callbacks?.onError?.(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Generate streaming completion with callbacks
  public async *generateCompletion(
    engine: MLCEngineInterface,
    input: string,
    customizedInstructions: string,
    isCustomizedInstructionsEnabled: boolean,
    callbacks?: ChatCallbacks
  ): AsyncGenerator<string> {
    try {
      callbacks?.onStart?.();
      const storedMessages = useChatStore.getState().messages;

      const completion = await engine.chat.completions.create({
        stream: true,
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt(customizedInstructions, isCustomizedInstructionsEnabled),
          },
          ...storedMessages,
          { role: "user", content: input },
        ],
        temperature: 0.6,
        max_tokens: 6000
      });

      let fullResponse = "";
      for await (const chunk of completion) {
        const delta = chunk.choices[0].delta.content;
        if (delta) {
          fullResponse += delta;
          callbacks?.onResponse?.(fullResponse);
          yield delta;
        }
      }

      callbacks?.onFinish?.(fullResponse);
    } catch (error) {
      console.log('here')
      callbacks?.onError?.(error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private getSystemPrompt(instructions: string, enabled: boolean): string {
    return enabled
      ? `You are a helpful assistant. Assist the user with their questions. You are also provided with the following information from the user, keep them in mind for your responses: ${instructions}`
      : "You are a helpful assistant. Assist the user with their questions.";
  }

  // Handle document processing using WebWorker to avoid freezing the UI
  public async processDocuments(
    fileText: Document<Record<string, any>>[] | string,
    fileType: string,
    fileName: string,
    userInput: string
  ): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const worker = new Worker(
        new URL("./vector-store-worker.ts", import.meta.url),
        {
          type: "module",
        }
      );

      worker.onmessage = (e: MessageEvent) => {
        const results = e.data;
        if (results) {
          // Process results
          const qaPrompt = `\nText content from a file is provided between the <context> tags. The file name and type is also included in the <context> tag. Answer the user question based on the context provied. Also, always keep old messages in mind when answering questions.
          If the question cannot be answered using the context provided, answer with "I don't know".
          
          ==========
          <context  file=${fileName} fileType="type: ${fileType}">
          ${results.map((result: any) => result.pageContent).join("")}\n
          </context>
          ==========

          User question:
          "${userInput}"

          Answer:
          ""
          `;
          resolve(qaPrompt);
        } else {
          reject("Error processing documents");
        }
      };

      worker.onerror = (err) => {
        console.error("Vector search worker error:", err);
        reject(err);
      };

      worker.postMessage({
        fileText,
        fileType,
        userInput,
      });
    });
  }
}
