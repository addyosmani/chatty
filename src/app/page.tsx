"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import * as webllm from "@mlc-ai/web-llm";
import useChatStore from "@/hooks/useChatStore";
import { useChat } from "ai/react";
import ChatLayout from "@/components/chat/chat-layout";

const appConfig = webllm.prebuiltAppConfig;
appConfig.useIndexedDBCache = true;

if (appConfig.useIndexedDBCache) {
  console.log("Using IndexedDB Cache");
} else {
  console.log("Using Cache API");
}

export default function Home() {
  const [open, setOpen] = useState(false);
  const [engine, setEngine] = useState<webllm.EngineInterface | null>(null);
  const [progress, setProgress] = useState("Not loaded");

  // zustand store
  const userInput = useChatStore((state) => state.userInput);
  const setUserInput = useChatStore((state) => state.setUserInput);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setIsLoading = useChatStore((state) => state.setIsLoading);
  const storedMessages = useChatStore((state) => state.messages);
  const setStoredMessages = useChatStore((state) => state.setMessages);

  // Vercel ai chat hook
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    setMessages,
    setInput,
  } = useChat();

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Dialog open={open} onOpenChange={setOpen}>
        <ChatLayout />
        <DialogContent className="flex flex-col space-y-4">
          <DialogHeader className="space-y-2">
            <DialogTitle>Welcome to WebChat!</DialogTitle>
            <DialogDescription>
              Enter your name to get started. This is just to personalize your
              experience.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
