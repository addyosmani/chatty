"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { ChatProps } from "@/lib/types";
import { PaperclipIcon } from "lucide-react";
import useChatStore from "@/hooks/useChatStore";

export default function ChatBottombar({ handleSubmit, stop }: ChatProps) {
  const input = useChatStore((state) => state.input);
  const handleInputChange = useChatStore((state) => state.handleInputChange);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const isLoading = useChatStore((state) => state.isLoading);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="p-1 flex justify-between w-full items-center gap-2">
      <AnimatePresence initial={false}>
        <motion.div
          key="input"
          className="w-full relative mb-2 items-center"
          layout
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1 }}
          transition={{
            opacity: { duration: 0.05 },
            layout: {
              type: "spring",
              bounce: 0.15,
            },
          }}
        >
          <form
            onSubmit={handleSubmit}
            className="w-full items-center flex relative gap-2"
          >
            <Link
              href="#"
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "shrink-0 absolute left-3 rounded-full"
              )}
            >
              <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
            </Link>

            <TextareaAutosize
              autoComplete="off"
              value={input}
              ref={inputRef}
              onKeyDown={handleKeyPress}
              onChange={handleInputChange}
              name="message"
              placeholder="Ask Ollama anything..."
              className=" max-h-24 px-14 bg-accent/70 py-[22px] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full  rounded-full flex items-center h-16 resize-none overflow-hidden dark:bg-card/70"
            />
            {!isLoading ? (
              <Button
                className="shrink-0 absolute right-3 rounded-full"
                variant="ghost"
                size="icon"
                type="submit"
                disabled={isLoading || !input.trim()}
              >
                <PaperPlaneIcon className=" w-5 h-5 " />
              </Button>
            ) : (
              <Button
                className="shrink-0 absolute right-3 rounded-full"
                variant="ghost"
                size="icon"
                type="submit"
                onClick={(e) => {
                  e.preventDefault();
                  stop();
                }}
              >
                <StopIcon className="w-5 h-5  " />
              </Button>
            )}
          </form>
          <div className="w-full flex justify-center text-center px-10 md:px-0">
            <p className="text-xs pt-2 text-muted-foreground">
              The first response might take a little longer to process as the
              model is being downloaded.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
