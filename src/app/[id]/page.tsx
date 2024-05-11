"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import * as webllm from "@mlc-ai/web-llm";
import useChatStore from "@/hooks/useChatStore";
import ChatLayout from "@/components/chat/chat-layout";
import { v4 as uuidv4 } from "uuid";
import { useWebLLM } from "@/providers/web-llm-provider";

export default function Page({ params }: { params: { id: string } }) {
  const [open, setOpen] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // zustand store
  const input = useChatStore((state) => state.input);
  const setInput = useChatStore((state) => state.setInput);
  const setIsLoading = useChatStore((state) => state.setIsLoading);
  const isLoading = useChatStore((state) => state.isLoading);
  const storedMessages = useChatStore((state) => state.messages);
  const setStoredMessages = useChatStore((state) => state.setMessages);
  const modelHasChanged = useChatStore((state) => state.modelHasChanged);
  const engine = useChatStore((state) => state.engine);
  const setEngine = useChatStore((state) => state.setEngine);

  // Global provider
  const webLLMHelper = useWebLLM();

  useEffect(() => {
    if (params.id) {
      const item = localStorage.getItem(`chat_${params.id}`);
      if (item) {
        setStoredMessages((message) => [...JSON.parse(item)]);
      }
    }
  }, [setStoredMessages]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    let loadedEngine = engine;
    console.log(storedMessages);

    e.preventDefault();
    setIsLoading(true);

    const userMessage: webllm.ChatCompletionMessageParam = {
      role: "user",
      content: input,
    };

    setStoredMessages((message) => [
      ...message,
      userMessage,
      { role: "assistant", content: "" },
    ]);
    localStorage.setItem(
      `chat_${params.id}`,
      JSON.stringify([
        ...storedMessages,
        userMessage,
        { role: "assistant", content: "" },
      ])
    );
    window.dispatchEvent(new Event("storage"));

    setInput("");

    if (!loadedEngine) {
      console.log("Engine not loaded");

      // Load engine
      try {
        loadedEngine = await webLLMHelper.initialize();
      } catch (e) {
        setIsLoading(false);

        setStoredMessages((message) => [
          ...message.slice(0, -1),
          {
            role: "assistant",
            content: "Failed to load model. Please try again.",
          },
        ]);
        return;
      }
    }

    // After engine is loaded, generate completion
    try {
      setLoadingSubmit(true);

      const completion = webLLMHelper.generateCompletion(loadedEngine, input);

      let assistantMessage = "";
      // Iterate over the AsyncGenerator completion to get the response
      for await (const chunk of completion) {
        assistantMessage += chunk;
        setLoadingSubmit(false);
        setStoredMessages((message) => [
          ...message.slice(0, -1),
          { role: "assistant", content: assistantMessage },
        ]);
      }

      setIsLoading(false);
      setLoadingSubmit(false);
      localStorage.setItem(
        `chat_${params.id}`,
        JSON.stringify([
          ...storedMessages,
          userMessage,
          { role: "assistant", content: assistantMessage },
        ])
      );

      window.dispatchEvent(new Event("storage"));

      console.log(await loadedEngine.runtimeStatsText());
    } catch (e) {
      setIsLoading(false);
      setLoadingSubmit(false);
      setStoredMessages((message) => [
        ...message.slice(0, -1),
        {
          role: "assistant",
          content: "Failed to get completion. Please try again.",
        },
      ]);
    }
  };

  const onStop = () => {
    if (!engine) {
      return;
    }
    setIsLoading(false);
    setLoadingSubmit(false);
    engine.interruptGenerate();
  };

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Dialog open={open} onOpenChange={setOpen}>
        <ChatLayout
          messages={storedMessages}
          handleSubmit={onSubmit}
          stop={onStop}
          chatId={params.id}
          loadingSubmit={loadingSubmit}
        />

        {/* This only shows first time using the app */}
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
