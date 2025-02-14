"use client";

import React, { useEffect } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Image from "next/image";
import TextareaAutosize from "react-textarea-autosize";
import { AnimatePresence } from "framer-motion";
import { Cross2Icon, StopIcon } from "@radix-ui/react-icons";
import { ChatProps } from "@/lib/types";
import useChatStore from "@/hooks/useChatStore";
import FileLoader from "../file-loader";
import { Mic, Send, SendHorizonal } from "lucide-react";
import useSpeechToText from "@/hooks/useSpeechRecognition";
import MultiImagePicker from "../image-embedder";
import { Models } from "@/lib/models";
import { ChatInput } from "../ui/chat/chat-input";

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
  const [open, setOpen] = React.useState(false);

  const isLoading = useChatStore((state) => state.isLoading);
  const fileText = useChatStore((state) => state.fileText);
  const setFileText = useChatStore((state) => state.setFileText);
  const setInput = useChatStore((state) => state.setInput);
  const base64Images = useChatStore((state) => state.base64Images);
  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const selectedModel = useChatStore((state) => state.selectedModel);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isLoading) return;

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
    <div className="px-4 pb-7 flex justify-between w-full items-center relative ">
      <AnimatePresence initial={false}>
        <form
          onSubmit={handleSubmit}
          className="w-full items-center flex flex-col  bg-accent dark:bg-card rounded-lg "
        >
          <ChatInput
            autoComplete="off"
            value={isListening ? (transcript.length ? transcript : "") : input}
            ref={inputRef}
            onKeyDown={handleKeyPress}
            onChange={handleInputChange}
            name="message"
            placeholder={!isListening ? "Enter your prompt here" : "Listening"}
            className="max-h-40 px-6 pt-6 border-0 shadow-none bg-accent rounded-lg text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed dark:bg-card"
          />

          <div className="flex w-full items-center p-2">
            {isLoading ? (
              // Loading state
              <div className="flex w-full justify-between">
                <div className="flex">
                  <MultiImagePicker
                    disabled={!selectedModel.vision}
                    onImagesPick={setBase64Images}
                  />
                  <FileLoader
                    setFileText={setFileText}
                    files={files}
                    setFiles={setFiles}
                  />
                </div>
                <div>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="button"
                    role="presentation"
                    disabled
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    role="presentation"
                    onClick={(e) => {
                      e.preventDefault();
                      stop();
                    }}
                  >
                    <StopIcon className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              // Default state
              <div className="flex w-full justify-between">
                <div className="flex">
                  <MultiImagePicker
                    disabled={!selectedModel.vision}
                    onImagesPick={setBase64Images}
                  />
                  <FileLoader
                    setFileText={setFileText}
                    files={files}
                    setFiles={setFiles}
                  />
                </div>
                <div>
                  {/* Microphone button with animation when listening */}
                  <Button
                    className={`shrink-0 rounded-full ${
                      isListening
                        ? "relative bg-blue-500/30 hover:bg-blue-400/30"
                        : ""
                    }`}
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={handleListenClick}
                    disabled={isLoading}
                    aria-label="Activate voice input"
                  >
                    <Mic className="w-5 h-5" />
                    {isListening && (
                      <span className="animate-pulse absolute h-[120%] w-[120%] rounded-full bg-blue-500/30" />
                    )}
                  </Button>

                  {/* Send button */}
                  <Button
                    className="shrink-0 rounded-full"
                    variant="ghost"
                    size="icon"
                    type="submit"
                    aria-label="Submit prompt"
                    disabled={
                      isLoading ||
                      !input.trim() ||
                      isListening ||
                      !selectedModel
                    }
                  >
                    <SendHorizonal className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          {base64Images && (
            <div className="w-full flex px-2 pb-2 gap-2 ">
              {base64Images.map((image, index) => {
                return (
                  <div
                    key={index}
                    className="relative bg-muted-foreground/20 flex w-fit flex-col gap-2 p-1 border-t border-x rounded-md"
                  >
                    <div className="flex text-sm">
                      <Image
                        src={image}
                        width={20}
                        height={20}
                        className="h-auto rounded-md w-auto max-w-[100px] max-h-[100px]"
                        alt={""}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const updatedImages = (prevImages: string[]) =>
                          prevImages.filter((_, i) => i !== index);
                        setBase64Images(updatedImages(base64Images));
                      }}
                      size="icon"
                      className="absolute -top-1.5 -right-1.5 text-white cursor-pointer  bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      <Cross2Icon className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </form>
      </AnimatePresence>
    </div>
  );
}
