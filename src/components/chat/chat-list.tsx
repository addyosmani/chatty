import { Message, useChat } from "ai/react";
import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Image from "next/image";
import CodeDisplayBlock from "../code-display-block";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../ui/button";
import { ChatProps } from "@/lib/types";
import MessageLoading from "../ui/message-loading";
import { CheckIcon, CopyIcon, RefreshCcw } from "lucide-react";
import useChatStore from "@/hooks/useChatStore";

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

  // Zustand
  const isLoading = useChatStore((state) => state.isLoading);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const username = localStorage.getItem("ollama_user");
    if (username) {
      setName(username);
      setLocalStorageIsLoading(false);
    }
  }, []);

  const copyToClipboard = (response: string, index: number) => () => {
    navigator.clipboard.writeText(response);
    setisCopied((prevState) => ({ ...prevState, [index]: true }));
    setTimeout(() => {
      setisCopied((prevState) => ({ ...prevState, [index]: false }));
    }, 1500);
  };

  if (messages.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="relative flex flex-col gap-4 items-center justify-center w-full h-full">
          <div></div>
          <div className="flex flex-col gap-4 items-center">
            <Image
              src="/ollama.png"
              alt="AI"
              width={60}
              height={60}
              className="h-20 w-14 object-contain dark:invert"
            />
            <div className="flex flex-col gap-2">
              <p className="text-center text-lg text-muted-foreground">
                How can I help you today?
              </p>
            </div>
          </div>

          <div className="absolute bottom-0 w-full px-4 sm:max-w-3xl grid gap-2 sm:grid-cols-2 sm:gap-4 text-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="scroller"
      className="w-full overflow-y-scroll overflow-x-hidden h-full justify-end"
    >
      <div className="w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end">
        {messages.map((message, index) => (
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
                duration: messages.indexOf(message) * 0.05 + 0.2,
              },
            }}
            className={cn(
              "flex flex-col gap-2 p-4 whitespace-pre-wrap",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className="flex gap-3 items-center">
              {message.role === "user" && (
                <div className="flex items-end gap-3">
                  <span className="bg-accent p-3 rounded-l-md rounded-tr-md max-w-xs sm:max-w-xl overflow-x-auto">
                    {message.content}
                  </span>
                  <Avatar className="flex justify-start items-center overflow-hidden">
                    <AvatarImage
                      src="/"
                      alt="user"
                      width={6}
                      height={6}
                      className="object-contain"
                    />
                    <AvatarFallback>
                      {name && name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {message.role === "assistant" && (
                <div className="flex items-end gap-2">
                  <Avatar className="flex justify-start items-center">
                    <AvatarImage
                      src="/ollama.png"
                      alt="AI"
                      width={6}
                      height={6}
                      className="object-contain dark:invert"
                    />
                  </Avatar>
                  <span className="bg-accent p-3 rounded-r-md rounded-tl-md max-w-xs sm:max-w-xl overflow-x-auto">
                    {/* Check if the message content contains a code block */}
                    {message.content
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
                            <pre className="whitespace-pre-wrap" key={index}>
                              <CodeDisplayBlock code={part} lang="" />
                            </pre>
                          );
                        }
                      })}
                    <div className="pt-2 flex gap-1 text-muted-foreground">
                      {(!isLoading ||
                        messages.indexOf(message) !== messages.length - 1) && (
                        <Button
                          onClick={copyToClipboard(message.content, index)}
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
                      )}

                      {/* Only show regenerate button on the last ai message */}
                      {!isLoading &&
                        messages.indexOf(message) === messages.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={onRegenerate}
                          >
                            <RefreshCcw className="w-3.5 h-3.5 scale-100 transition-all" />
                          </Button>
                        )}
                    </div>

                    {/* Loading dots */}
                    {loadingSubmit &&
                      messages.indexOf(message) === messages.length - 1 && (
                        <MessageLoading />
                      )}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      <div id="anchor" ref={bottomRef}></div>
    </div>
  );
}
