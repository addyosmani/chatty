import React from "react";
import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import { Message } from "ai/react";
import { ChatRequestOptions } from "ai";
import { ChatProps } from "@/lib/types";

export default function Chat({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
  setSelectedModel,
  chatId,
  loadingSubmit,
  isMobile,
}: ChatProps) {
  return (
    <div className="flex flex-col justify-between w-full max-w-2xl h-full  ">
      <ChatTopbar
        setSelectedModel={setSelectedModel}
        isLoading={isLoading}
        chatId={chatId}
        messages={messages}
      />

      <ChatList
        setSelectedModel={setSelectedModel}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        loadingSubmit={loadingSubmit}
        error={error}
        stop={stop}
        isMobile={isMobile}
      />

      <ChatBottombar
        setSelectedModel={setSelectedModel}
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        stop={stop}
      />
    </div>
  );
}
