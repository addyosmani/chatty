"use client";

import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import useChatStore from "@/hooks/useChatStore";
import ChatLayout from "@/components/chat/chat-layout";

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;

  const getChatById = useChatStore((state) => state.getChatById);
  const chat = getChatById(id);

  if (!chat) {
    return notFound();
  }

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <Suspense fallback={<div>Loading</div>}>
        <ChatLayout key={id} id={id} initialMessages={chat.messages} />
      </Suspense>
    </main>
  );
}
