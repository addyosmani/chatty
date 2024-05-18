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
import useMemoryStore from "@/hooks/useMemoryStore";

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
  const selectedModel = useChatStore((state) => state.selectedModel);
  const fileText = useChatStore((state) => state.fileText);
  const files = useChatStore((state) => state.files);
  const customizedInstructions = useMemoryStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.isCustomizedInstructionsEnabled
  );

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

  const generateCompletion = async (
    loadedEngine: webllm.EngineInterface,
    prompt: string
  ) => {
    const completion = webLLMHelper.generateCompletion(
      loadedEngine,
      prompt,
      customizedInstructions,
      isCustomizedInstructionsEnabled
    );

    const userMessage: webllm.ChatCompletionMessageParam = {
      role: "user",
      content: prompt,
    };

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
    localStorage.setItem(
      `chat_${params.id}`,
      JSON.stringify([
        ...storedMessages,
        userMessage,
        { role: "assistant", content: assistantMessage },
      ])
    );

    window.dispatchEvent(new Event("storage"));

    setIsLoading(false);
    setLoadingSubmit(false);

    console.log(await loadedEngine.runtimeStatsText());
  };

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
        loadedEngine = await webLLMHelper.initialize(selectedModel);
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

      if (fileText && files) {
        console.log("Uploaded file exists");
        console.log({ fileText });
        const qaPrompt = await webLLMHelper.processDocuments(
          fileText,
          files[0].type,
          input
        );
        if (!qaPrompt) {
          return;
        }
        await generateCompletion(loadedEngine, qaPrompt);
      } else {
        await generateCompletion(loadedEngine, input);
      }
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

  const onRegenerate = async () => {
    if (!engine) {
      return;
    }

    // Set the input to the last user message
    const lastMsg = storedMessages[storedMessages.length - 2]?.content;

    if (!lastMsg) {
      return;
    }

    setIsLoading(true);
    setLoadingSubmit(true);

    // Set the input to the last user message
    setInput(lastMsg.toString());

    // Remove the last assistant message
    setStoredMessages((message) => [
      ...message.slice(0, -1),
      { role: "assistant", content: "" },
    ]);

    setInput("");

    if (fileText && files) {
      const qaPrompt = await webLLMHelper.processDocuments(
        fileText,
        files[0].type,
        lastMsg.toString()
      );
      if (!qaPrompt) {
        return;
      }

      await generateCompletion(engine, qaPrompt);
    } else {
      await generateCompletion(engine, lastMsg.toString());
    }

    setIsLoading(false);
    setLoadingSubmit(false);
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
          onRegenerate={onRegenerate}
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
