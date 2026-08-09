"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useChat } from "@ai-sdk/react";
import { webLLM, type WebLLMUIMessage } from "@browser-ai/web-llm";
import {
  CopyIcon,
  FileTextIcon,
  PaperclipIcon,
  RefreshCcwIcon,
  Volume2Icon,
  VolumeXIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Attachment,
  AttachmentInfo,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { WebLLMChatTransport } from "@/lib/chat-transport";
import { DOCUMENT_ACCEPT, extractDocument } from "@/lib/extract-text";
import { Models } from "@/lib/models";
import { clearDocumentIndex } from "@/lib/rag";
import { useAppStore } from "@/lib/store";

type ChatProps = {
  chatId: string;
};

export function Chat({ chatId }: ChatProps) {
  const selectedModelId = useAppStore((state) => state.selectedModelId);
  const setSelectedModelId = useAppStore((state) => state.setSelectedModelId);
  const customizedInstructions = useAppStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useAppStore(
    (state) => state.isCustomizedInstructionsEnabled
  );
  const document = useAppStore((state) => state.chats[chatId]?.document);
  const setChatDocument = useAppStore((state) => state.setChatDocument);
  const saveChat = useAppStore((state) => state.saveChat);

  // Read once: after this the AI SDK owns the live message list.
  const [initialMessages] = useState<WebLLMUIMessage[]>(
    () => useAppStore.getState().chats[chatId]?.messages ?? []
  );

  const documentInputRef = useRef<HTMLInputElement>(null);
  const [isReadingDocument, setIsReadingDocument] = useState(false);

  const handleDocumentSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    setIsReadingDocument(true);
    try {
      const nextDocument = await extractDocument(file);
      setChatDocument(chatId, nextDocument);
      clearDocumentIndex(chatId);
      toast.success(
        `Attached ${file.name}. Ask questions about it in this chat.`
      );
    } catch (readError) {
      toast.error(
        readError instanceof Error
          ? readError.message
          : "Could not read that file."
      );
    } finally {
      setIsReadingDocument(false);
    }
  };

  const selectedModel =
    Models.find((model) => model.name === selectedModelId) ?? Models[0];

  // Transport config is immutable, so rebuild whenever the model, the
  // instructions, or the attached document changes.
  const transport = useMemo(() => {
    const createModel = () =>
      webLLM(selectedModel.name, {
        worker: new Worker(new URL("@/lib/worker.ts", import.meta.url), {
          type: "module",
        }),
      });

    return new WebLLMChatTransport(createModel, {
      customizedInstructions: isCustomizedInstructionsEnabled
        ? customizedInstructions
        : undefined,
      document,
    });
  }, [
    selectedModel.name,
    customizedInstructions,
    isCustomizedInstructionsEnabled,
    document,
  ]);

  const { messages, sendMessage, regenerate, stop, status, error } =
    useChat<WebLLMUIMessage>({
      id: chatId,
      messages: initialMessages,
      transport,
      onError: (chatError) => toast.error(chatError.message),
    });

  // Persist whenever a turn settles, so a reload keeps the conversation.
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      saveChat(chatId, messages);
    }
  }, [status, messages, chatId, saveChat]);

  const handleSubmit = (message: PromptInputMessage) => {
    if (status !== "ready") {
      return;
    }
    const hasText = Boolean(message.text.trim());
    const hasFiles = message.files.length > 0;
    if (!(hasText || hasFiles)) {
      return;
    }

    // Move off "/" onto this chat's URL without a navigation.
    window.history.replaceState({}, "", `/c/${chatId}`);

    sendMessage({ text: message.text, files: message.files });
  };

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <div className="flex h-full w-full max-w-3xl flex-col">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <Image
            alt="Chatty"
            className="dark:invert"
            height={70}
            src="/logo.svg"
            width={70}
          />
          <p className="font-semibold text-2xl text-muted-foreground/75 md:text-3xl">
            How can I help you today?
          </p>
          <p className="max-w-lg text-muted-foreground/75 text-sm">
            Models run entirely in your browser. Models with <strong>(1k)</strong>{" "}
            suffix lower VRAM requirements by ~2-3GB.
          </p>
        </div>
      ) : (
        <Conversation>
          <ConversationContent>
            {messages.map((message, messageIndex) => {
              const isLastMessage = messageIndex === messages.length - 1;

              return (
                <Message from={message.role} key={message.id}>
                  <MessageContent>
                    {message.parts.map((part, partIndex) => {
                      const key = `${message.id}-${partIndex}`;

                      if (part.type === "text") {
                        return (
                          <MessageResponse key={key}>
                            {part.text}
                          </MessageResponse>
                        );
                      }

                      if (part.type === "reasoning") {
                        return (
                          <Reasoning
                            isStreaming={
                              status === "streaming" && isLastMessage
                            }
                            key={key}
                          >
                            <ReasoningTrigger />
                            <ReasoningContent>{part.text}</ReasoningContent>
                          </Reasoning>
                        );
                      }

                      if (part.type === "file") {
                        if (part.mediaType?.startsWith("image/")) {
                          return (
                            <Image
                              alt={part.filename ?? "Attached image"}
                              className="rounded-md object-contain"
                              height={200}
                              key={key}
                              src={part.url}
                              unoptimized
                              width={200}
                            />
                          );
                        }
                        return null;
                      }

                      if (part.type === "data-modelDownloadProgress") {
                        if (!part.data.message) {
                          return null;
                        }
                        return (
                          <div className="flex flex-col gap-2" key={key}>
                            <span className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Spinner className="size-4" />
                              {part.data.message}
                            </span>
                            {part.data.status === "downloading" &&
                              part.data.progress !== undefined && (
                                <Progress value={part.data.progress} />
                              )}
                          </div>
                        );
                      }

                      return null;
                    })}

                    {message.role === "assistant" && isLastMessage && isBusy &&
                      message.parts.length === 0 && (
                        <span className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Spinner className="size-4" />
                          Thinking...
                        </span>
                      )}

                    {message.role === "assistant" && !isBusy && (
                      <AssistantActions
                        canRegenerate={isLastMessage}
                        message={message}
                        onRegenerate={() => regenerate()}
                      />
                    )}
                  </MessageContent>
                </Message>
              );
            })}

            {status === "submitted" &&
              messages.at(-1)?.role === "user" && (
                <Message from="assistant">
                  <MessageContent>
                    <span className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Spinner className="size-4" />
                      Thinking...
                    </span>
                  </MessageContent>
                </Message>
              )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      {error && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <span className="text-destructive">{error.message}</span>
          <Button onClick={() => regenerate()} size="sm" variant="outline">
            Retry
          </Button>
        </div>
      )}

      <div className="p-4">
        {document && (
          <AttachedDocument
            name={document.name}
            onRemove={() => {
              setChatDocument(chatId, undefined);
              clearDocumentIndex(chatId);
            }}
          />
        )}

        <input
          accept={DOCUMENT_ACCEPT}
          className="hidden"
          onChange={handleDocumentSelected}
          ref={documentInputRef}
          type="file"
        />

        <PromptInput
          accept="image/*"
          className="rounded-lg bg-accent dark:bg-card"
          globalDrop
          multiple
          onSubmit={handleSubmit}
        >
          <PromptInputBody>
            <PendingAttachments />
            <PromptInputTextarea placeholder="Enter your prompt here" />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputTools>
              <PromptInputActionMenu>
                <PromptInputActionMenuTrigger />
                <PromptInputActionMenuContent>
                  <PromptInputActionAddAttachments
                    disabled={!selectedModel.vision}
                    label={
                      selectedModel.vision
                        ? "Add images"
                        : "Images need a vision model"
                    }
                  />
                  <PromptInputActionMenuItem
                    disabled={Boolean(document) || isReadingDocument}
                    onSelect={(event) => {
                      event.preventDefault();
                      documentInputRef.current?.click();
                    }}
                  >
                    {isReadingDocument ? (
                      <Spinner className="mr-2 size-4" />
                    ) : (
                      <PaperclipIcon className="mr-2 size-4" />
                    )}
                    {document ? "One document per chat" : "Attach a document"}
                  </PromptInputActionMenuItem>
                </PromptInputActionMenuContent>
              </PromptInputActionMenu>

              <PromptInputSelect
                onValueChange={setSelectedModelId}
                value={selectedModel.name}
              >
                <PromptInputSelectTrigger className="max-w-[220px]">
                  <PromptInputSelectValue />
                </PromptInputSelectTrigger>
                <PromptInputSelectContent>
                  {Models.map((model) => (
                    <PromptInputSelectItem key={model.name} value={model.name}>
                      {model.displayName}
                    </PromptInputSelectItem>
                  ))}
                </PromptInputSelectContent>
              </PromptInputSelect>
            </PromptInputTools>

            <div className="flex items-center gap-1">
              <SpeechInputField />
              <PromptInputSubmit onStop={stop} status={status} />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}

/** Copy, regenerate and read-aloud controls for an assistant message. */
function AssistantActions({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: WebLLMUIMessage;
  canRegenerate: boolean;
  onRegenerate: () => void;
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const isSpeakingRef = useRef(false);
  isSpeakingRef.current = isSpeaking;

  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  // Stop narration if this message unmounts mid-sentence, but leave another
  // message's narration alone.
  useEffect(
    () => () => {
      if (isSpeakingRef.current) {
        window.speechSynthesis?.cancel();
      }
    },
    []
  );

  const toggleSpeech = useCallback(() => {
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
      toast.error("This browser does not support speech synthesis.");
      return;
    }

    synthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 0.6;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthesis.speak(utterance);
    setIsSpeaking(true);
  }, [isSpeaking, text]);

  if (!text) {
    return null;
  }

  return (
    <MessageActions className="pt-1 text-muted-foreground">
      <MessageAction
        onClick={() => {
          navigator.clipboard.writeText(text);
          toast.success("Copied to clipboard");
        }}
        tooltip="Copy"
      >
        <CopyIcon className="size-3.5" />
      </MessageAction>

      {canRegenerate && (
        <MessageAction onClick={onRegenerate} tooltip="Regenerate">
          <RefreshCcwIcon className="size-3.5" />
        </MessageAction>
      )}

      <MessageAction
        onClick={toggleSpeech}
        tooltip={isSpeaking ? "Stop" : "Read aloud"}
      >
        {isSpeaking ? (
          <VolumeXIcon className="size-3.5" />
        ) : (
          <Volume2Icon className="size-3.5" />
        )}
      </MessageAction>
    </MessageActions>
  );
}

/** Dictates into the prompt textarea using the browser's speech recognition. */
function SpeechInputField() {
  const appendTranscript = useCallback((transcript: string) => {
    if (!transcript.trim()) {
      return;
    }

    const textarea = window.document.querySelector<HTMLTextAreaElement>(
      "form textarea"
    );
    if (!textarea) {
      return;
    }

    const separator = textarea.value && !textarea.value.endsWith(" ") ? " " : "";
    // Use the native setter so React picks the change up as a real input event.
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value"
    )?.set;
    setter?.call(textarea, `${textarea.value}${separator}${transcript}`);
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  }, []);

  return <SpeechInput onTranscriptionChange={appendTranscript} />;
}

/** Previews the images staged in the prompt input before they are sent. */
function PendingAttachments() {
  const attachments = usePromptInputAttachments();

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments className="px-3 pt-3" variant="grid">
      {attachments.files.map((file) => (
        <Attachment
          data={file}
          key={file.id}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview />
          <AttachmentInfo />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function AttachedDocument({
  name,
  onRemove,
}: {
  name: string;
  onRemove: () => void;
}) {
  return (
    <div className="mb-2 flex w-fit items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5 text-sm">
      <FileTextIcon className="size-4 shrink-0" />
      <span className="truncate">{name}</span>
      <Button
        aria-label={`Remove ${name}`}
        className="size-5"
        onClick={onRemove}
        size="icon"
        variant="ghost"
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}
