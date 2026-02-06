"use client";

import React from "react";
import dynamic from "next/dynamic";

// Dynamically import ChatLayout to avoid SSR issues with browser-only libraries
const ChatLayout = dynamic(() => import("@/components/chat/chat-layout"), {
  ssr: false,
});

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <ChatLayout id={id} />
    </main>
  );
}
