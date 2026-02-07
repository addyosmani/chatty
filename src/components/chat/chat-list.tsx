import React, { useCallback, useState } from "react";
import { WebLLMUIMessage } from "@browser-ai/web-llm";
import type { RetrievalResult } from "@/lib/rag";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  CheckIcon,
  CopyIcon,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";

/**
 * Strips [n] citation markers from text so Streamdown can render clean markdown,
 * then we render citations separately below.
 */
function stripCitations(text: string): string {
  return text.replace(/\[(\d+)\]/g, "");
}


interface ChatListProps {
  messages: WebLLMUIMessage[];
  chatId: string;
  status: string;
  onRegenerate: () => void;
  isRetrieving?: boolean;
  retrievalResultsMap?: Record<string, RetrievalResult[]>;
}

export default function ChatList({
  messages,
  status,
  onRegenerate,
  isRetrieving,
  retrievalResultsMap = {},
}: ChatListProps) {
  const [isCopied, setIsCopied] = React.useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = React.useState<Record<number, boolean>>(
    {},
  );
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);
  const [textToSpeech, setTextToSpeech] =
    useState<SpeechSynthesisUtterance | null>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const utterance = new SpeechSynthesisUtterance();
      utterance.volume = 0.2;

      const setVoice = () => {
        const voices = speechSynthesis.getVoices();
        utterance.voice = voices[6];
        setTextToSpeech(utterance);
      };

      setVoice();
      speechSynthesis.addEventListener("voiceschanged", setVoice);

      return () => {
        speechSynthesis.cancel();
        speechSynthesis.removeEventListener("voiceschanged", setVoice);
      };
    }
  }, []);

  const getTextContent = useCallback((message: WebLLMUIMessage) => {
    return (
      message.parts
        ?.filter(
          (part): part is { type: "text"; text: string } =>
            part.type === "text",
        )
        .map((part) => part.text)
        .join("\n") || ""
    );
  }, []);

  const copyMessageToClipboard = useCallback(
    (message: WebLLMUIMessage, index: number) => {
      navigator.clipboard.writeText(getTextContent(message));
      setIsCopied((prev) => ({ ...prev, [index]: true }));
      setTimeout(() => {
        setIsCopied((prev) => ({ ...prev, [index]: false }));
      }, 1500);
    },
    [getTextContent],
  );

  const handleTextToSpeech = useCallback(
    (message: WebLLMUIMessage, index: number) => {
      const text = getTextContent(message);
      if (!textToSpeech || !text) return;

      if (currentSpeakingIndex !== null) {
        speechSynthesis.cancel();
        setIsSpeaking((prev) => ({ ...prev, [currentSpeakingIndex]: false }));
      }

      if (isSpeaking[index]) {
        speechSynthesis.cancel();
        setIsSpeaking((prev) => ({ ...prev, [index]: false }));
        setCurrentSpeakingIndex(null);
      } else {
        textToSpeech.text = text;
        speechSynthesis.speak(textToSpeech);
        setIsSpeaking((prev) => ({ ...prev, [index]: true }));
        setCurrentSpeakingIndex(index);

        textToSpeech.onend = () => {
          setIsSpeaking((prev) => ({ ...prev, [index]: false }));
          setCurrentSpeakingIndex(null);
        };
      }
    },
    [getTextContent, textToSpeech, currentSpeakingIndex, isSpeaking],
  );

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message, index) => {
          const isLastMessage = index === messages.length - 1;
          const messageResults = message.id
            ? retrievalResultsMap[message.id]
            : undefined;
          const hasCitations =
            message.role === "assistant" && !!messageResults?.length;

          return (
            <Message
              key={message.id || index}
              from={message.role as "user" | "assistant"}
            >
              <div>
                {hasCitations && (
                  <Sources>
                    <SourcesTrigger count={messageResults!.length} />
                    <SourcesContent>
                      {messageResults!.map((result, i) => (
                        <HoverCard key={`${result.documentId}-${result.chunkIndex}`} openDelay={200}>
                          <HoverCardTrigger>
                            <Source title={`[${i + 1}] ${result.fileName}`} />
                          </HoverCardTrigger>
                          <HoverCardContent side="top" align="start" className="w-96 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {result.fileName} — Chunk {result.chunkIndex + 1} ({Math.round(result.similarity * 100)}% match)
                            </p>
                            <p className="text-xs leading-relaxed line-clamp-6 whitespace-pre-wrap">
                              {result.content}
                            </p>
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                    </SourcesContent>
                  </Sources>
                )}
                <MessageContent>
                  {message.parts?.map((part, partIndex) => {
                    // Handle download progress parts
                    if (part.type === "data-modelDownloadProgress") {
                      const data = (part as any).data as {
                        status: string;
                        progress: number;
                        message: string;
                      };
                      if (!data.message || status === "ready") return null;

                      return (
                        <div key={partIndex}>
                          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                            <Spinner />
                            <span>{data.message}</span>
                          </div>
                          {data.status === "downloading" &&
                            data.progress !== undefined && (
                              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all duration-300"
                                  style={{ width: `${data.progress}%` }}
                                />
                              </div>
                            )}
                        </div>
                      );
                    }

                    // Handle reasoning parts
                    if (part.type === "reasoning") {
                      const reasoningText = (part as any).text as string;
                      return (
                        <Reasoning
                          key={partIndex}
                          isStreaming={isLastMessage && status === "streaming"}
                        >
                          <ReasoningTrigger />
                          <ReasoningContent>{reasoningText}</ReasoningContent>
                        </Reasoning>
                      );
                    }

                    // Handle file/image parts
                    if (part.type === "file") {
                      const filePart = part as {
                        type: "file";
                        mediaType: string;
                        url: string;
                        filename?: string;
                      };
                      if (filePart.mediaType.startsWith("image/")) {
                        return (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={partIndex}
                            src={filePart.url}
                            alt={filePart.filename || "Attached image"}
                            className="max-w-xs rounded-lg"
                          />
                        );
                      }
                      return null;
                    }

                    // Handle text parts
                    if (part.type === "text") {
                      const text = (part as any).text as string;
                      if (!text) return null;

                      return (
                        <MessageResponse key={partIndex}>
                          {hasCitations ? stripCitations(text) : text}
                        </MessageResponse>
                      );
                    }

                    return null;
                  })}
                </MessageContent>
              </div>

              {/* Action buttons for last assistant message when ready */}
              {message.role === "assistant" &&
                isLastMessage &&
                status === "ready" && (
                  <MessageActions>
                    <MessageAction
                      tooltip="Copy"
                      onClick={() => copyMessageToClipboard(message, index)}
                    >
                      {isCopied[index] ? (
                        <CheckIcon className="w-3.5 h-3.5" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </MessageAction>
                    <MessageAction tooltip="Regenerate" onClick={onRegenerate}>
                      <RefreshCcw className="w-3.5 h-3.5" />
                    </MessageAction>
                    <MessageAction
                      tooltip={isSpeaking[index] ? "Stop" : "Listen"}
                      onClick={() => handleTextToSpeech(message, index)}
                    >
                      {isSpeaking[index] ? (
                        <VolumeX className="w-4 h-4" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </MessageAction>
                  </MessageActions>
                )}
            </Message>
          );
        })}

        {/* Thinking / Searching indicator when waiting for assistant response */}
        {status === "submitted" &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <Message from="assistant">
              <MessageContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner />
                  <span>
                    {isRetrieving ? "Searching documents..." : "Thinking..."}
                  </span>
                </div>
              </MessageContent>
            </Message>
          )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
