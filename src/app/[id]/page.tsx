"use client";

import { ChatLayout } from "@/components/chat/chat-layout";
import Gamma from "@/lib/gamma";
import { getSelectedModel } from "@/lib/model-helper";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { BytesOutputParser } from "@langchain/core/output_parsers";
import { ChatRequestOptions } from "ai";
import { Message, useChat } from "ai/react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Page({ params }: { params: { id: string } }) {
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
  } = useChat({
    onResponse: (response) => {
      if (response) {
        setLoadingSubmit(false);
      }
    },
    onError: (error) => {
      setLoadingSubmit(false);
      toast.error("An error occurred. Please try again.");
    },
  });
  const [chatId, setChatId] = React.useState<string>("");
  const [selectedModel, setSelectedModel] = React.useState<string>(
    getSelectedModel()
  );
  const [gamma, setGamma] = React.useState<Gamma | null>(null);
  const [ollama, setOllama] = useState<ChatOllama>();
  const env = process.env.NODE_ENV;
  const [loadingSubmit, setLoadingSubmit] = React.useState(false);

  useEffect(() => {
    if (env === "production") {
      const newOllama = new ChatOllama({
        baseUrl: "http://localhost:11434",
        model: selectedModel,
      });
      setOllama(newOllama);
    }
  }, [selectedModel]);

  useEffect(() => {
    if (selectedModel === "Browser Model") {
      console.log("Selected model: Browser");
      const gammaInstance = Gamma.getInstance();
      setGamma(gammaInstance);
    }
  }, [setSelectedModel, selectedModel]);
  
  React.useEffect(() => {
    if (params.id) {
      const item = localStorage.getItem(`chat_${params.id}`);
      if (item) {
        setMessages(JSON.parse(item));
      }
    }
  }, [setMessages]);

  const addMessage = (Message: any) => {
    console.log("addMessage:", Message);
    messages.push(Message);
    window.dispatchEvent(new Event("storage"));
    setMessages([...messages]);
  };

  // Function to handle chatting with Ollama in production (client side)
  const handleSubmitProduction = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    addMessage({ role: "user", content: input, id: chatId });
    setInput("");

    if (ollama) {
      try {
        const parser = new BytesOutputParser();

      console.log(messages);
      const stream = await ollama
        .pipe(parser)
        .stream(
          (messages as Message[]).map((m) =>
            m.role == "user"
              ? new HumanMessage(m.content)
              : new AIMessage(m.content)
          )
        );

      const decoder = new TextDecoder();

      let responseMessage = "";
      for await (const chunk of stream) {
        const decodedChunk = decoder.decode(chunk);
        responseMessage += decodedChunk;
      }
      setMessages([
        ...messages,
        { role: "assistant", content: responseMessage, id: chatId },
      ]);
      setLoadingSubmit(false);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
      setLoadingSubmit(false);
    }
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingSubmit(true);

    if (selectedModel === "Browser Model") {
      try {
        // Add the user message to the chat
        addMessage({ role: "user", content: input, id: chatId });
        setInput("");

        if (gamma === null) {
          const gammaInstance = Gamma.getInstance();
          setGamma(gammaInstance);
        }

        // Generate a response
        const responseGenerator = gamma
          ? await gamma.summarize(input)
          : (async function* () {})();
        console.log("Response from Browser Model:", responseGenerator);

        let responseMessage = "";
        // Display response chunks as they arrive and append them to the message
        for await (const chunk of responseGenerator) {
          responseMessage += chunk;

          window.dispatchEvent(new Event("storage"));
          setMessages([
            ...messages,
            { role: "assistant", content: responseMessage, id: chatId },
          ]);
          setLoadingSubmit(false);
        }
      } catch (error) {
        console.error("Error processing message with Browser Model:", error);
      }
    } else {
      setMessages([...messages]);

      // Prepare the options object with additional body data, to pass the model.
      const requestOptions: ChatRequestOptions = {
        options: {
          body: {
            selectedModel: selectedModel,
          },
        },
      };

      if (env === "production" && selectedModel !== "REST API") {
        handleSubmitProduction(e);
      } else {
        // use the /api/chat route
        // Call the handleSubmit function with the options
        handleSubmit(e, requestOptions);
      }
    }
  };
  // When starting a new chat, append the messages to the local storage
  React.useEffect(() => {
    if (!isLoading && !error && messages.length > 0) {
      localStorage.setItem(`chat_${params.id}`, JSON.stringify(messages));
      // Trigger the storage event to update the sidebar component
      window.dispatchEvent(new Event("storage"));
    }
  }, [messages, chatId, isLoading, error]);

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center">
      <ChatLayout
        chatId={params.id}
        setSelectedModel={setSelectedModel}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        loadingSubmit={loadingSubmit}
        error={error}
        stop={stop}
        navCollapsedSize={10}
        defaultLayout={[30, 160]}
      />
    </main>
  );
}
