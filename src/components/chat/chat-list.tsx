import React, { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import CodeDisplayBlock from "../code-display-block";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import {
  CheckIcon,
  CopyIcon,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import ButtonWithTooltip from "../button-with-tooltip";
import { ChatMessageList } from "../ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "../ui/chat/chat-bubble";
import { WebLLMUIMessage } from "@browser-ai/web-llm";
import type { RetrievalResult } from "@/lib/rag";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationTrigger,
  InlineCitationBody,
  InlineCitationSource,
} from "../inline-citation";

/**
 * Parses text and replaces [1], [2], etc. with InlineCitation hover cards.
 */
function parseCitationsInText(
  text: string,
  retrievalResults: RetrievalResult[]
): ReactNode {
  const citationRegex = /\[(\d+)\]/g;
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let hasCitations = false;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const citationNumber = parseInt(match[1], 10);
    const result = retrievalResults[citationNumber - 1];

    if (result) {
      hasCitations = true;
      parts.push(
        <InlineCitation key={`citation-${match.index}`}>
          <InlineCitationCard>
            <InlineCitationTrigger citationNumber={citationNumber} />
            <InlineCitationBody>
              <InlineCitationSource result={result} />
            </InlineCitationBody>
          </InlineCitationCard>
        </InlineCitation>
      );
    } else {
      // Unknown citation number — render as plain text
      parts.push(match[0]);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (!hasCitations) return text;
  return <>{parts}</>;
}

function processChildren(
  children: ReactNode,
  retrievalResults: RetrievalResult[]
): ReactNode {
  if (typeof children === "string") {
    return parseCitationsInText(children, retrievalResults);
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        const result = parseCitationsInText(child, retrievalResults);
        if (result === child) return child;
        return <span key={i}>{result}</span>;
      }
      return child;
    });
  }
  return children;
}

/**
 * Creates react-markdown component overrides that parse [n] citations.
 */
function createCitationComponents(retrievalResults: RetrievalResult[]) {
  return {
    p: ({ children, ...props }: any) => (
      <p {...props}>{processChildren(children, retrievalResults)}</p>
    ),
    li: ({ children, ...props }: any) => (
      <li {...props}>{processChildren(children, retrievalResults)}</li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong {...props}>{processChildren(children, retrievalResults)}</strong>
    ),
    em: ({ children, ...props }: any) => (
      <em {...props}>{processChildren(children, retrievalResults)}</em>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote {...props}>
        {processChildren(children, retrievalResults)}
      </blockquote>
    ),
  };
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
  const [name, setName] = React.useState<string>("");
  const [localStorageIsLoading, setLocalStorageIsLoading] =
    React.useState(true);
  const [isCopied, setisCopied] = React.useState<Record<number, boolean>>({});
  const [textToSpeech, setTextToSpeech] =
    useState<SpeechSynthesisUtterance | null>(null);
  const [isSpeaking, setIsSpeaking] = React.useState<Record<number, boolean>>(
    {}
  );
  const [currentSpeakingIndex, setCurrentSpeakingIndex] = useState<
    number | null
  >(null);

  useEffect(() => {
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("chatty_user");
      if (username) {
        setName(username);
        setLocalStorageIsLoading(false);
      }
    }
  }, []);

  const copyMessageToClipboard = (message: WebLLMUIMessage) => {
    const textContent = message.parts
      ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n") || "";

    navigator.clipboard.writeText(textContent);
    setisCopied((prevState) => ({ ...prevState, [messages.indexOf(message)]: true }));
    setTimeout(() => {
      setisCopied((prevState) => ({ ...prevState, [messages.indexOf(message)]: false }));
    }, 1500);
  };

  const handleTextToSpeech = (message: WebLLMUIMessage, index: number) => {
    const text = message.parts
      ?.filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join("\n") || "";

    if (!textToSpeech || !text) return;
    if (currentSpeakingIndex !== null) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({
        ...prevState,
        [currentSpeakingIndex]: false,
      }));
    }
    if (isSpeaking[index]) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({ ...prevState, [index]: false }));
      setCurrentSpeakingIndex(null);
    } else {
      textToSpeech.text = text;
      speechSynthesis.speak(textToSpeech);
      setIsSpeaking((prevState) => ({ ...prevState, [index]: true }));
      setCurrentSpeakingIndex(index);

      textToSpeech.onend = () => {
        setIsSpeaking((prevState) => ({ ...prevState, [index]: false }));
        setCurrentSpeakingIndex(null);
      };
    }
  };

  return (
    <div className="flex-1 w-full overflow-y-auto">
      <ChatMessageList>
        {messages.map((message, index) => {
          const variant = message.role === "user" ? "sent" : "received";
          const isLastMessage = index === messages.length - 1;

          return (
            <motion.div
              key={message.id || index}
              layout
              initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: index * 0.025,
                },
              }}
              className="flex flex-col gap-2 px-4 py-2"
            >
              <ChatBubble variant={variant}>
                <ChatBubbleAvatar
                  src={message.role === "assistant" ? "/logo.svg" : ""}
                  width={70}
                  height={70}
                  className="w-7 h-7 dark:invert aspect-square"
                  fallback={message.role == "user" ? "US" : ""}
                />
                <ChatBubbleMessage>
                  {/* Render parts in chronological order */}
                  {message.parts?.map((part, partIndex) => {
                    // Handle download progress parts
                    if (part.type === "data-modelDownloadProgress") {
                      const data = (part as any).data as {
                        status: string;
                        progress: number;
                        message: string;
                      };
                      if (!data.message) return null;
                      if (status === "ready") return null;

                      return (
                        <div key={partIndex}>
                          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
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
                      return (
                        <details key={partIndex} className="mb-1 text-sm" open>
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            Thought process
                          </summary>
                          <div className="mt-1 text-muted-foreground pl-3 border-l-2 border-foreground/10">
                            <Markdown remarkPlugins={[remarkGfm]}>
                              {(part as any).text}
                            </Markdown>
                          </div>
                        </details>
                      );
                    }

                    // Handle text parts
                    if (part.type === "text") {
                      const text = (part as any).text as string;
                      if (!text) return null;

                      const messageResults =
                        message.id ? retrievalResultsMap[message.id] : undefined;
                      const hasCitations =
                        message.role === "assistant" &&
                        !!messageResults?.length;
                      const citationComponents = hasCitations
                        ? createCitationComponents(messageResults)
                        : undefined;

                      return (
                        <div key={partIndex} className="flex flex-col gap-1">
                          {text
                            .split("```")
                            .map((segment: string, segIndex: number) => {
                              if (segIndex % 2 === 0) {
                                return (
                                  <Markdown
                                    key={segIndex}
                                    remarkPlugins={[remarkGfm]}
                                    components={citationComponents}
                                  >
                                    {segment}
                                  </Markdown>
                                );
                              } else {
                                return (
                                  <pre
                                    className="whitespace-pre-wrap pt-2"
                                    key={segIndex}
                                  >
                                    <CodeDisplayBlock code={segment} lang="" />
                                  </pre>
                                );
                              }
                            })}
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Action buttons for assistant messages */}
                  {message.role === "assistant" &&
                    isLastMessage &&
                    status === "ready" && (
                      <div className="pt-2 flex gap-1 items-center text-muted-foreground">
                        <ButtonWithTooltip side="bottom" toolTipText="Copy">
                          <Button
                            onClick={() => copyMessageToClipboard(message)}
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                          >
                            {isCopied[index] ? (
                              <CheckIcon className="w-3.5 h-3.5 transition-all" />
                            ) : (
                              <CopyIcon className="w-3.5 h-3.5 transition-all" />
                            )}
                          </Button>
                        </ButtonWithTooltip>

                        <ButtonWithTooltip
                          side="bottom"
                          toolTipText="Regenerate"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={onRegenerate}
                          >
                            <RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
                          </Button>
                        </ButtonWithTooltip>

                        <ButtonWithTooltip
                          side="bottom"
                          toolTipText={isSpeaking[index] ? "Stop" : "Listen"}
                        >
                          <Button
                            onClick={() => handleTextToSpeech(message, index)}
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                          >
                            {isSpeaking[index] ? (
                              <VolumeX className="w-4 h-4 transition-all" />
                            ) : (
                              <Volume2 className="w-4 h-4 transition-all" />
                            )}
                          </Button>
                        </ButtonWithTooltip>
                      </div>
                    )}

                </ChatBubbleMessage>
              </ChatBubble>
            </motion.div>
          );
        })}

        {/* Thinking indicator when waiting for assistant response */}
        {status === "submitted" &&
          messages.length > 0 &&
          messages[messages.length - 1].role === "user" && (
            <div className="px-4 py-2">
              <ChatBubble variant="received">
                <ChatBubbleAvatar
                  src="/logo.svg"
                  width={70}
                  height={70}
                  className="w-7 h-7 dark:invert aspect-square"
                  fallback=""
                />
                <ChatBubbleMessage isLoading />
              </ChatBubble>
            </div>
          )}

        {/* Show retrieval status when searching documents */}
        {isRetrieving && (
          <div className="flex justify-center py-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <p>Searching documents...</p>
            </div>
          </div>
        )}
      </ChatMessageList>
    </div>
  );
}
