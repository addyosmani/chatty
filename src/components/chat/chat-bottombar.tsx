"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { ChatProps } from "@/lib/types";
import { PaperclipIcon, RemoveFormatting } from "lucide-react";
import useChatStore from "@/hooks/useChatStore";
import FileLoader from "../file-loader";

interface MergedProps extends ChatProps {
  files: File[] | undefined;
  setFiles: React.Dispatch<React.SetStateAction<File[] | undefined>>;
}

export default function ChatBottombar({
  handleSubmit,
  stop,
  files,
  setFiles,
}: MergedProps) {
  const input = useChatStore((state) => state.input);
  const handleInputChange = useChatStore((state) => state.handleInputChange);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const isLoading = useChatStore((state) => state.isLoading);
  const fileText = useChatStore((state) => state.fileText);
  const setFileText = useChatStore((state) => state.setFileText);

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
        <div className="w-full relative mb-2 items-center">
          <div className="w-full items-center flex relative gap-2">
            <div className="absolute left-3 z-10">
              <FileLoader
                setFileText={setFileText}
                files={files}
                setFiles={setFiles}
              />
            </div>
            <form
              onSubmit={handleSubmit}
              className="w-full items-center flex relative gap-2"
            >
              <TextareaAutosize
                autoComplete="off"
                value={input}
                ref={inputRef}
                onKeyDown={handleKeyPress}
                onChange={handleInputChange}
                name="message"
                placeholder={"Enter a prompt here"}
                className=" max-h-24 px-14 bg-accent py-[22px] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full  rounded-full flex items-center h-16 resize-none overflow-hidden dark:bg-card"
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
          </div>
          <div className="w-full flex justify-center text-center px-10 md:px-0">
            <p className="text-xs pt-2 text-muted-foreground">
              The first response might take a little longer to process as the
              model is being downloaded.
            </p>
          </div>
        </div>
      </AnimatePresence>
    </div>
  );
}
