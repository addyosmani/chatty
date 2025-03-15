import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getImagesFromMessage, getTextContentFromMessage } from "@/lib/utils";
import Image from "next/image";
import CodeDisplayBlock from "../code-display-block";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { ChatProps } from "@/lib/types";
import {
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  RefreshCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import useChatStore from "@/hooks/useChatStore";
import ButtonWithTooltip from "../button-with-tooltip";
import { ChatMessageList } from "../ui/chat/chat-message-list";
import {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "../ui/chat/chat-bubble";

export default function ChatList({
  messages,
  loadingSubmit,
  onRegenerate,
}: ChatProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
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

  // Zustand
  const isLoading = useChatStore((state) => state.isLoading);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("chatty_user");
      if (username) {
        setName(username);
        setLocalStorageIsLoading(false);
      }
    }
  }, []);

  const copyToClipboard = (response: string, index: number) => () => {
    navigator.clipboard.writeText(response);
    setisCopied((prevState) => ({ ...prevState, [index]: true }));
    setTimeout(() => {
      setisCopied((prevState) => ({ ...prevState, [index]: false }));
    }, 1500);
  };

  const handleTextToSpeech = (text: string, index: number) => {
    if (!textToSpeech) return;
    // Stop the currently speaking text if any
    if (currentSpeakingIndex !== null) {
      speechSynthesis.cancel();
      setIsSpeaking((prevState) => ({
        ...prevState,
        [currentSpeakingIndex]: false,
      }));
    }
    // Start the new text-to-speech
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

  const getThinkContent = (content: string) => {
    const match = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    return match ? match[1].trim() : null;
  };

  return (
    <div className="flex-1 w-full overflow-y-auto">
      <ChatMessageList>
        {messages.map((message, index) => {
          const variant = message.role === "user" ? "sent" : "received";

          const thinkContent =
            message.role === "assistant" && message.content
              ? getThinkContent(message.content.toString())
              : null;

          const cleanContent = message.content ? 
            message.content.toString().replace(/<think>[\s\S]*?(?:<\/think>|$)/g, "").trim() : "";

          return (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
              animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
              transition={{
                opacity: { duration: 0.1 },
                layout: {
                  type: "spring",
                  bounce: 0.3,
                  duration: messages.indexOf(message) * 0.025,
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
                <ChatBubbleMessage isLoading={loadingSubmit && messages.indexOf(message) === messages.length - 1}>
                  <div className="flex flex-col gap-1">
                    {thinkContent && message.role === "assistant" && (
                      <details className="mb-1 text-sm" open>
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Thought process
                        </summary>
                        <div className="mt-1 text-muted-foreground pl-3 border-l-2 border-foreground/10">
                          <Markdown remarkPlugins={[remarkGfm]}>
                            {thinkContent}
                          </Markdown>
                        </div>
                      </details>
                    )}

                    {message.fileName && (
                      <div className="flex items-center gap-2 border border-green-500 border-opacity-10 rounded-sm bg-green-500/20 p-2 text-sm">
                        <FileTextIcon className="w-4 h-4" />
                        {message.fileName}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {getImagesFromMessage(message).length > 0 &&
                        getImagesFromMessage(message).map((image, index) => (
                          <Image
                            key={index}
                            src={image.url}
                            width={200}
                            height={200}
                            className="rounded-md object-contain"
                            alt=""
                          />
                        ))}
                    </div>

                    {cleanContent &&
                      typeof cleanContent === "string" &&
                      cleanContent
                        .split("```")
                        .map((part: string, index: number) => {
                          if (index % 2 === 0) {
                            return (
                              <Markdown key={index} remarkPlugins={[remarkGfm]}>
                                {part}
                              </Markdown>
                            );
                          } else {
                            return (
                              <pre
                                className="whitespace-pre-wrap pt-2"
                                key={index}
                              >
                                <CodeDisplayBlock code={part} lang="" />
                              </pre>
                            );
                          }
                        })}

                    {message.content && typeof message.content !== "string" && (
                      <p>{getTextContentFromMessage(message)}</p>
                    )}
                  </div>

                  {message.role === "assistant" && (
                    <div>
                      {/* Action buttons */}
                      <div className="pt-2 flex gap-1 items-center text-muted-foreground">
                        {/* Copy button */}
                        {(!isLoading ||
                          messages.indexOf(message) !==
                            messages.length - 1) && (
                          <ButtonWithTooltip side="bottom" toolTipText="Copy">
                            <Button
                              onClick={copyToClipboard(
                                getTextContentFromMessage(message),
                                index
                              )}
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
                        )}

                        {/* Only show regenerate button on the last ai message */}
                        {!isLoading &&
                          messages.indexOf(message) === messages.length - 1 && (
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
                          )}

                        {/* Speaker icon */}
                        {(!isLoading ||
                          messages.indexOf(message) !==
                            messages.length - 1) && (
                          <ButtonWithTooltip
                            side="bottom"
                            toolTipText={isSpeaking[index] ? "Stop" : "Listen"}
                          >
                            <Button
                              onClick={() => {
                                handleTextToSpeech(
                                  getTextContentFromMessage(message),
                                  index
                                );
                              }}
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4"
                            >
                              {isSpeaking[index] ? (
                                <VolumeX className="w-4 h-4 transition-all " />
                              ) : (
                                <Volume2 className="w-4 h-4 transition-all" />
                              )}
                            </Button>
                          </ButtonWithTooltip>
                        )}
                      </div>
                    </div>
                  )}
                </ChatBubbleMessage>
              </ChatBubble>
            </motion.div>
          );
        })}
      </ChatMessageList>
    </div>
  );
}
