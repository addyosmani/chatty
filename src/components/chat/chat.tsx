"use client";

import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { WebLLMUIMessage } from "@browser-ai/web-llm";
import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import Image from "next/image";
import useChatStore from "@/hooks/useChatStore";
import { useDocumentStore } from "@/hooks/useDocumentStore";
import useMemoryStore from "@/hooks/useMemoryStore";
import {
  WebLLMChatTransport,
  RetrievalStatus,
  RetrievalResult,
} from "@/lib/chat-transport";

interface ChatProps {
  id: string;
}

export default function Chat({ id }: ChatProps) {
  const router = useRouter();
  const setCurrentChatId = useChatStore((state) => state.setCurrentChatId);
  const setIsLoadingStore = useChatStore((state) => state.setIsLoading);
  const addMessage = useChatStore((state) => state.addMessage);
  const createChat = useChatStore((state) => state.createChat);
  const deleteChat = useChatStore((state) => state.deleteChat);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const getChat = useChatStore((state) => state.getChat);

  const searchInDocuments = useDocumentStore(
    (state) => state.searchInDocuments
  );
  const customizedInstructions = useMemoryStore(
    (state) => state.customizedInstructions
  );
  const isCustomizedInstructionsEnabled = useMemoryStore(
    (state) => state.isCustomizedInstructionsEnabled
  );

  // Track retrieval status streamed from the transport
  const [retrievalStatus, setRetrievalStatus] =
    useState<RetrievalStatus | null>(null);

  // Map of messageId -> RetrievalResult[] for per-message citations
  const [retrievalResultsMap, setRetrievalResultsMap] = useState<
    Record<string, RetrievalResult[]>
  >({});

  // Track latest retrieval results (before we know the message ID)
  const pendingRetrievalResults = React.useRef<RetrievalResult[]>([]);

  // Wrap the callback to capture results
  const handleRetrievalStatus = useCallback((status: RetrievalStatus) => {
    setRetrievalStatus(status);
    if (status.phase === "done" && status.results.length > 0) {
      pendingRetrievalResults.current = status.results;
    }
  }, []);

  // Create transport — model instance is fetched from the Zustand store
  // inside the transport, so it persists across navigations
  const transport = useMemo(
    () =>
      new WebLLMChatTransport({
        onRetrievalStatus: handleRetrievalStatus,
      }),
    [handleRetrievalStatus]
  );

  // Sync system prompt with custom instructions
  useEffect(() => {
    if (isCustomizedInstructionsEnabled && customizedInstructions) {
      transport.setSystemPrompt(
        `You are a helpful assistant. Keep the following user preferences in mind:\n${customizedInstructions}`
      );
    } else {
      transport.setSystemPrompt("You are a helpful assistant.");
    }
  }, [transport, customizedInstructions, isCustomizedInstructionsEnabled]);

  // Sync RAG enabled state to transport (transport handles retrieval internally)
  useEffect(() => {
    transport.setRAGEnabled(searchInDocuments);
  }, [transport, searchInDocuments]);

  // Use the AI SDK's useChat hook with our transport
  const {
    messages: uiMessages,
    status,
    sendMessage,
    stop,
    regenerate,
    setMessages: setUIMessages,
  } = useChat<WebLLMUIMessage>({
    id,
    transport,
    onFinish: async ({ message }) => {
      const parts = message.parts || [];
      const textContent = parts
        .filter(
          (part: { type: string }): part is { type: "text"; text: string } =>
            part.type === "text"
        )
        .map((part) => part.text)
        .join("");

      if (textContent) {
        const results = pendingRetrievalResults.current;

        // Save retrieval results in metadata so citations persist across reloads
        const metadata =
          results.length > 0
            ? JSON.stringify({ retrievalResults: results })
            : undefined;

        await addMessage(id, {
          role: "assistant",
          content: textContent,
          metadata,
        });

        // Add to the per-message map for current session display
        if (results.length > 0 && message.id) {
          setRetrievalResultsMap((prev) => ({
            ...prev,
            [message.id]: results,
          }));
        }
        pendingRetrievalResults.current = [];
      }

      // Clear retrieval status after response completes
      setRetrievalStatus(null);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setRetrievalStatus(null);
    },
  });

  // Track input locally
  const [input, setInput] = React.useState("");

  const isLoading = status === "streaming" || status === "submitted";
  const isRetrieving = retrievalStatus?.phase === "retrieving";

  // Sync loading state with store
  useEffect(() => {
    setIsLoadingStore(isLoading);
  }, [isLoading, setIsLoadingStore]);

  // Set current chat ID and load messages on mount
  useEffect(() => {
    setCurrentChatId(id);

    const loadMessages = async () => {
      const chat = await getChat(id);
      if (chat && chat.messages.length > 0) {
        // Build retrieval results map from saved metadata
        const resultsMap: Record<string, RetrievalResult[]> = {};
        for (const m of chat.messages) {
          if (m.metadata) {
            try {
              const parsed = JSON.parse(m.metadata);
              if (parsed.retrievalResults?.length > 0) {
                resultsMap[m.id] = parsed.retrievalResults;
              }
            } catch {
              // Ignore invalid metadata JSON
            }
          }
        }
        setRetrievalResultsMap(resultsMap);

        setUIMessages(
          chat.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            parts: [{ type: "text" as const, text: m.content }],
            createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
          }))
        );
      }
    };

    // Clear previous retrieval results when switching chats
    setRetrievalResultsMap({});
    pendingRetrievalResults.current = [];
    setRetrievalStatus(null);

    loadMessages();
  }, [id, setCurrentChatId, getChat, setUIMessages]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  // Submit handler: sends to transport immediately, saves to DB in background
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      const trimmedInput = input.trim();
      if (!trimmedInput || status !== "ready") return;

      // Clear pending retrieval results for new message
      pendingRetrievalResults.current = [];

      // Send message to AI immediately (no blocking on DB)
      setInput("");
      sendMessage({ text: trimmedInput });

      // Save to database in background (non-blocking)
      (async () => {
        try {
          const existingChat = await getChat(id);
          if (!existingChat) {
            await createChat(id);
            // Update URL to /c/{id} without full navigation
            window.history.replaceState(null, "", `/c/${id}`);
          }
          await addMessage(id, {
            role: "user",
            content: trimmedInput,
          });
        } catch (error) {
          console.error("[Chat Page] Error saving to DB:", error);
        }
      })();
    },
    [input, status, id, getChat, createChat, addMessage, sendMessage]
  );

  // Delete the old assistant message from DB before regenerating
  const handleRegenerate = useCallback(async () => {
    const chat = await getChat(id);
    if (chat) {
      const lastAssistant = [...chat.messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistant) {
        await deleteMessage(id, lastAssistant.id);
      }
    }
    regenerate();
  }, [id, getChat, deleteMessage, regenerate]);

  const handleNewChat = useCallback(async () => {
    const newChatId = await createChat();
    router.push(`/c/${newChatId}`);
  }, [createChat, router]);

  const handleDeleteChat = useCallback(
    async (chatId: string) => {
      await deleteChat(chatId);
      if (chatId === id) {
        router.push("/");
      }
    },
    [deleteChat, id, router]
  );

  return (
    <div className="flex flex-col justify-between w-full max-w-3xl h-full">
      <ChatTopbar
        chatId={id}
        handleNewChat={handleNewChat}
        handleDeleteChat={handleDeleteChat}
      />

      {uiMessages.length === 0 ? (
        <div className="flex flex-col h-full w-full items-center gap-4 justify-center">
          <div className="flex flex-col gap-1 items-center">
            <Image
              src="/logo.svg"
              alt="AI"
              width={70}
              height={70}
              className="dark:invert"
            />
            <p className="text-center text-2xl md:text-3xl font-semibold text-muted-foreground/75">
              How can I help you today?
            </p>
            <p className="text-center text-sm text-muted-foreground/75 max-w-lg">
              Models with <strong>(1k)</strong> suffix lowers VRAM requirements
              by ~2-3GB.
            </p>
          </div>

          <div className="flex flex-col w-full">
            <ChatBottombar
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              stop={stop}
              isLoading={isLoading}
            />
          </div>
        </div>
      ) : (
        <>
          <ChatList
            messages={uiMessages}
            chatId={id}
            status={status}
            onRegenerate={handleRegenerate}
            isRetrieving={isRetrieving}
            retrievalResultsMap={retrievalResultsMap}
          />
          <ChatBottombar
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            stop={stop}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
}
