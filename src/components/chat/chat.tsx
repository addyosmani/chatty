"use client";

import React from "react";
import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import { Message } from "ai/react";
import { ChatRequestOptions } from "ai";
import { ChatProps } from "@/lib/types";

export default function Chat({
  handleSubmit,
  stop,
  chatId,
  loadingSubmit,
  isMobile,
  messages,
  onRegenerate,
}: ChatProps) {
  return (
    <div className="flex flex-col justify-between w-full max-w-3xl h-full  ">
      <ChatTopbar chatId={chatId} />

      <ChatList
        messages={messages}
        handleSubmit={handleSubmit}
        loadingSubmit={loadingSubmit}
        stop={stop}
        isMobile={isMobile}
        onRegenerate={onRegenerate}
      />

      <ChatBottombar
        handleSubmit={handleSubmit}
        stop={stop}
        messages={messages}
      />
    </div>
  );
}
