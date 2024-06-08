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
import { MessageWithFiles } from "@/lib/types";

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
  const setFileText = useChatStore((state) => state.setFileText);
  const setFiles = useChatStore((state) => state.setFiles);
  const customizedInstructions = useMemoryStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.isCustomizedInstructionsEnabled
  );
  const setChatId = useMemoryStore((state) => state.setChatId);

  // Global provider
  const webLLMHelper = useWebLLM();

  useEffect(() => {
    if (params.id) {
      const item = localStorage.getItem(`chat_${params.id}`);
      setChatId(params.id);
      if (item) {
        setStoredMessages((message) => [...JSON.parse(item)]);
      }
    }
  }, [setStoredMessages]);

  useEffect(() => {
    if (fileText && files) {
      const fileStore = {
        fileName: files[0].name,
        fileType: files[0].type,
        fileText: fileText,
      };

      localStorage.setItem(`chatFile_${params.id}`, JSON.stringify(fileStore));
      window.dispatchEvent(new Event("storage"));
    }
  }, [fileText, storedMessages]);

  const generateCompletion = async (
    loadedEngine: webllm.MLCEngineInterface,
    prompt: string,
    regenerate: boolean = false
  ) => {
    const completion = webLLMHelper.generateCompletion(
      loadedEngine,
      prompt,
      customizedInstructions,
      isCustomizedInstructionsEnabled
    );

    const userMessage: MessageWithFiles = {
      fileName: files ? files[0].name : undefined,
      role: "user",
      content: input,
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

    // If regenerate is true, we only update the last assistant message
    if (regenerate) {
      localStorage.setItem(
        `chat_${params.id}`,
        JSON.stringify([
          ...storedMessages.slice(0, -1),
          { role: "assistant", content: assistantMessage },
        ])
      );

      window.dispatchEvent(new Event("storage"));

      setIsLoading(false);
      setLoadingSubmit(false);

      return;
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
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    let loadedEngine = engine;

    e.preventDefault();
    setIsLoading(true);

    const userMessage: MessageWithFiles = {
      fileName: files ? files[0].name : "",
      role: "user",
      content: input,
    };

    setFileText(null);
    setFiles(undefined);

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
      // Load engine
      try {
        loadedEngine = await webLLMHelper.initialize(selectedModel);
      } catch (e) {
        setIsLoading(false);

        setStoredMessages((message) => [
          ...message.slice(0, -1),
          {
            role: "assistant",
            content: "Failed to load model. " + e,
          },
        ]);
        return;
      }
    }

    // After engine is loaded, generate completion
    try {
      setLoadingSubmit(true);

      const existingFile = localStorage.getItem(`chatFile_${params.id}`);
      if (existingFile) {
        const { fileText, fileType, fileName } = JSON.parse(existingFile);

        const qaPrompt = await webLLMHelper.processDocuments(
          fileText,
          fileType,
          fileName,
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
    engine.interruptGenerate();
    setIsLoading(false);
    setLoadingSubmit(false);
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

    const existingFile = localStorage.getItem(`chatFile_${params.id}`);
    if (existingFile) {
      const { fileText, fileType, fileName } = JSON.parse(existingFile);

      const qaPrompt = await webLLMHelper.processDocuments(
        fileText,
        fileType,
        fileName,
        lastMsg.toString()
      );
      if (!qaPrompt) {
        return;
      }

      await generateCompletion(engine, qaPrompt, true);
    } else {
      await generateCompletion(engine, lastMsg.toString(), true);
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
