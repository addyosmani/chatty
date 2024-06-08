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
import UsernameForm from "@/components/username-form";
import useMemoryStore from "@/hooks/useMemoryStore";
import { MessageWithFiles } from "@/lib/types";

export default function Home() {
  const [open, setOpen] = useState(false);
  const chatId = useMemoryStore((state) => state.chatId);
  const setChatId = useMemoryStore((state) => state.setChatId);
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

  // Global provider
  const webLLMHelper = useWebLLM();

  useEffect(() => {
    if (storedMessages.length < 1) {
      // Generate a random id for the chat
      const id = uuidv4();
      setChatId(id);
    }
  }, [storedMessages]);

  useEffect(() => {
    if (fileText && files) {
      const fileStore = {
        fileName: files[0].name,
        fileType: files[0].type,
        fileText: fileText,
      };

      localStorage.setItem(`chatFile_${chatId}`, JSON.stringify(fileStore));
      window.dispatchEvent(new Event("storage"));
    }
  }, [fileText, storedMessages]);

  useEffect(() => {
    if (!isLoading && chatId && storedMessages.length > 0) {
      // Save messages to local storage
      localStorage.setItem(`chat_${chatId}`, JSON.stringify(storedMessages));
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event("storage"));
    }
  }, [storedMessages, chatId, isLoading]);

  useEffect(() => {
    if (window !== undefined) {
      if (!localStorage.getItem("chatty_user")) {
        setOpen(true);
      }
    }
  }, []);

  const generateCompletion = async (
    loadedEngine: webllm.MLCEngineInterface,
    prompt: string
  ) => {
    const completion = webLLMHelper.generateCompletion(
      loadedEngine,
      prompt,
      customizedInstructions,
      isCustomizedInstructionsEnabled
    );

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
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isLoading) return;

    let loadedEngine = engine;

    e.preventDefault();
    setIsLoading(true);

    const userMessage: MessageWithFiles = {
      fileName: files ? files[0].name : undefined,
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

      // If file is uploaded and text is extracted, process the documents
      const existingFile = localStorage.getItem(`chatFile_${chatId}`);
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
          content: "Failed to load model. " + e,
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

    const existingFile = localStorage.getItem(`chatFile_${chatId}`);
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

      await generateCompletion(engine, qaPrompt);
    } else {
      await generateCompletion(engine, lastMsg.toString());
    }

    setIsLoading(false);
    setLoadingSubmit(false);
  };

  const onOpenChange = (isOpen: boolean) => {
    const username = localStorage.getItem("chatty_user");
    if (username) return setOpen(isOpen);

    localStorage.setItem("chatty_user", "Anonymous");
    window.dispatchEvent(new Event("storage"));
    setOpen(isOpen);
  };

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Dialog open={open} onOpenChange={onOpenChange}>
        <ChatLayout
          messages={storedMessages}
          handleSubmit={onSubmit}
          stop={onStop}
          chatId={chatId}
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
            <UsernameForm setOpen={setOpen} />
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </main>
  );
}
