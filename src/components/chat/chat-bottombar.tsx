"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { motion, AnimatePresence } from "framer-motion";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { ChatProps } from "@/lib/types";
import useChatStore from "@/hooks/useChatStore";
import FileLoader from "../file-loader";
import { Mic, Send, SendHorizonal } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechRecognition";

interface MergedProps extends ChatProps {
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
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
  const setInput = useChatStore((state) => state.setInput);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText({ continuous: true });

  const listen = () => {
    isListening ? stopVoiceInput() : startListening();
  };

  const stopVoiceInput = () => {
    setInput(transcript.length ? transcript : "");
    stopListening();
  };

  const handleListenClick = () => {
    listen();
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      stopVoiceInput();
    }
  }, [isLoading]);

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
                value={
                  isListening ? (transcript.length ? transcript : "") : input
                }
                ref={inputRef}
                onKeyDown={handleKeyPress}
                onChange={handleInputChange}
                name="message"
                placeholder={
                  !isListening ? "Enter your prompt here" : "Listening"
                }
                className=" max-h-24 px-14 bg-accent py-[22px] text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full  rounded-full flex items-center h-16 resize-none overflow-hidden dark:bg-card"
              />
              {!isLoading ? (
                <div className="flex absolute right-3 items-center">
                  {isListening ? (
                    <div className="flex">
                      <Button
                        className="shrink-0 relative rounded-full bg-blue-500/30 hover:bg-blue-400/30 "
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={handleListenClick}
                        disabled={isLoading}
                      >
                        <Mic className="w-5 h-5 " />
                        <span className="animate-pulse absolute h-[120%] w-[120%] rounded-full bg-blue-500/30" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="shrink-0 rounded-full"
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={handleListenClick}
                      disabled={isLoading}
                    >
                      <Mic className="w-5 h-5 " />
                    </Button>
                  )}
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    disabled={isLoading || !input.trim() || isListening}
                  >
                    <SendHorizonal className="w-5 h-5 " />
                  </Button>
                </div>
              ) : (
                <div className="flex absolute right-3 items-center">
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="button"
                    disabled={true}
                  >
                    <Mic className="w-5 h-5 " />
                  </Button>
                  <Button
                    className="shrink-0 rounded-full"
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
                </div>
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
