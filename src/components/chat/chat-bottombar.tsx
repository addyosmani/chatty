"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { ChatProps } from "@/lib/types";
import { PaperclipIcon } from "lucide-react";

export default function ChatBottombar({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
}: ChatProps) {
  const [message, setMessage] = React.useState(input);
  const [isMobile, setIsMobile] = React.useState(false);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const checkScreenWidth = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkScreenWidth();

    // Event listener for screen width changes
    window.addEventListener("resize", checkScreenWidth);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

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
              className=" max-h-24 px-14 bg-accent/20 py-[21px] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full border border-opacity-50 rounded-full flex items-center h-16 resize-none overflow-hidden dark:bg-card/35"
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
