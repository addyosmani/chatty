"use client";

import { useParams } from "next/navigation";

import { ChatLayout } from "@/components/chat-layout";

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const chatId = params.id;

  if (!chatId) {
    return null;
  }

  return <ChatLayout chatId={chatId} />;
}
