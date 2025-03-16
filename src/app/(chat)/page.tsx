"use client";

import ChatLayout from "@/components/chat/chat-layout";
import { generateUUID } from "@/lib/utils";
import React from "react";

export default function Home() {
  const id = generateUUID();

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <ChatLayout key={id} initialMessages={[]} id={id} />
    </main>
  );
}
