import { useEffect, useState } from 'react';
import useChatStore from './useChatStore';
import useMemoryStore from './useMemoryStore';
import { MessageWithFiles, UserMessage, AssistantMessage } from '@/lib/types';
import { useWebLLM } from '@/providers/web-llm-provider';
import { generateMessageId } from '@/lib/utils';
import { toast } from 'sonner';
import { ChatCallbacks } from '@/lib/web-llm-helper';
import * as webllm from "@mlc-ai/web-llm";
import { useRouter } from 'next/navigation';

interface UseChatOptions {
  id: string;
  initialMessages?: MessageWithFiles[];
}

export const useChat = ({ id, initialMessages }: UseChatOptions) => {
  // Zustand store
  const {
    messages: storedMessages,
    setMessages: setStoredMessages,
    input,
    setInput,
    isLoading,
    setIsLoading,
    engine,
    setEngine,
    selectedModel,
    files,
    setFiles,
    fileText,
    setFileText,
    base64Images,
    setBase64Images,
    saveMessages,
    saveFileToChat,
    getFileInfoById,
  } = useChatStore();

  const customizedInstructions = useMemoryStore((state) => state.customizedInstructions);
  const isCustomizedInstructionsEnabled = useMemoryStore((state) => state.isCustomizedInstructionsEnabled);
  const webLLMHelper = useWebLLM();
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Set initial messages
  useEffect(() => {
    if (initialMessages && initialMessages?.length > 0) {
      setStoredMessages(() => initialMessages);
      saveMessages(id, initialMessages);
    }
  }, [id, initialMessages]);

  const clearFileState = () => {
    setInput("");
    setBase64Images(null);
    setFileText(null);
    setFiles(undefined)
  };

  const appendUserMessage = () => {
    const userMessage: UserMessage = {
      id: generateMessageId(),
      fileName: files?.[0]?.name,
      role: 'user',
      content: base64Images
        ? [
          { type: "text", text: input },
          ...base64Images.map((image) => ({
            type: "image_url" as const,
            image_url: { url: image },
          })),
        ]
        : input,
    };

    setStoredMessages((messages) => {
      const updatedMessages = [
        ...messages,
        userMessage,
        {
          id: generateMessageId(),
          role: "assistant",
          content: ""
        } satisfies AssistantMessage,
      ];
      return updatedMessages;
    });

    // Save file information when sending a message
    if (fileText && files) {
      const fileInfo = {
        fileName: files[0].name,
        fileType: files[0].type,
        fileText: fileText,
      };
      saveFileToChat(id, fileInfo);
    }

    return userMessage;
  };

  const getOrInitializeEngine = async () => {
    if (engine) {
      return engine;
    }

    try {
      const newEngine = await webLLMHelper.initialize(selectedModel, handleChatCallbacks);
      setEngine(newEngine);
      return newEngine;
    } catch (error) {
      handleChatCallbacks.onError?.(error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const handleChatCompletion = async (
    loadedEngine: webllm.MLCEngineInterface,
    userInput: string
  ) => {
    const existingFile = getFileInfoById(id);

    if (existingFile) {
      console.log('here')
      const qaPrompt = await webLLMHelper.processDocuments(
        existingFile.fileText,
        existingFile.fileType,
        existingFile.fileName,
        userInput
      );

      if (qaPrompt) {
        const completion = webLLMHelper.generateCompletion(
          loadedEngine,
          qaPrompt,
          customizedInstructions,
          isCustomizedInstructionsEnabled,
          handleChatCallbacks
        );

        for await (const _ of completion) {
          // Callbacks handle message updates
          continue;
        }
      }
    } else {
      const completion = webLLMHelper.generateCompletion(
        loadedEngine,
        userInput,
        customizedInstructions,
        isCustomizedInstructionsEnabled,
        handleChatCallbacks
      );

      for await (const _ of completion) {
        // Callbacks handle message updates
        continue;
      }
    }
  };

  const handleChatCallbacks: ChatCallbacks = {
    onStart: () => {
      setIsLoading(true);
      setLoadingSubmit(true);
    },
    onResponse: (message) => {
      setLoadingSubmit(false);
      setStoredMessages((messages) => [
        ...messages.slice(0, -1),
        {
          id: generateMessageId(),
          role: 'assistant',
          content: message,
        } as AssistantMessage
      ]);
    },
    onFinish: (finalMessage) => {
      setIsLoading(false);
      setLoadingSubmit(false);

      setStoredMessages((messages) => {
        const updatedMessages = [
          ...messages.slice(0, -1),
          {
            id: generateMessageId(),
            role: 'assistant',
            content: finalMessage,
          } as AssistantMessage
        ];

        saveMessages(id, updatedMessages);
        return updatedMessages;
      });

      router.replace(`/c/${id}`)
    },
    onError: (error) => {
      setIsLoading(false);
      setLoadingSubmit(false);
      toast.error(`Error: ${error}`);

      setStoredMessages((messages) => {
        const updatedMessages = [
          ...messages.slice(0, -1),
          {
            id: generateMessageId(),
            role: 'assistant',
            content: `Error: ${error}`,
          } as AssistantMessage
        ];
        saveMessages(id, updatedMessages);
        return updatedMessages;
      });
    },
    onProgress: (report) => {
      setLoadingSubmit(false)
      setStoredMessages((messages) => [
        ...messages.slice(0, -1),
        {
          id: generateMessageId(),
          role: 'assistant',
          content: report.text,
        } as AssistantMessage
      ]);

      // Clear assistant msg when the model loading is done
      if (report.text.includes('Finish loading')) {
        setStoredMessages((messages) => [
          ...messages.slice(0, -1),
          {
            id: generateMessageId(),
            role: 'assistant',
            content: '',
          } as AssistantMessage
        ]);
      }
    },
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (isLoading) return;
    e.preventDefault();

    try {
      window.history.replaceState({}, "", `/c/${id}`);

      const userMessage = appendUserMessage();
      clearFileState();

      const loadedEngine = await getOrInitializeEngine();
      if (!loadedEngine) return;

      await handleChatCompletion(loadedEngine, userMessage.content.toString());
    } catch (error) {
      handleChatCallbacks.onError?.(error instanceof Error ? error.message : String(error));
    }
  };

  const stop = () => {
    if (!engine) return;
    engine.interruptGenerate();
  };

  const regenerate = async () => {
    if (!engine) return;

    const lastUserMessage = storedMessages[storedMessages.length - 2]?.content;
    if (!lastUserMessage) return;

    try {
      handleChatCallbacks.onStart?.();

      setStoredMessages((messages) => [
        ...messages.slice(0, -1),
        { id: generateMessageId(), role: "assistant", content: "" } as AssistantMessage,
      ]);

      const loadedEngine = await getOrInitializeEngine();
      if (!loadedEngine) return;

      await handleChatCompletion(loadedEngine, lastUserMessage.toString());
    } catch (error) {
      handleChatCallbacks.onError?.(error instanceof Error ? error.message : String(error));
    }
  };

  return {
    messages: storedMessages,
    input,
    setInput,
    isLoading,
    loadingSubmit,
    handleSubmit,
    stop,
    regenerate,
    files,
    setFiles,
    fileText,
    setFileText,
    open,
    setOpen,
    setStoredMessages
  };
};