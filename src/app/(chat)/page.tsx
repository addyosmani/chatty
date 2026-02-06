"use client";

import dynamic from "next/dynamic";
import { generateUUID } from "@/lib/utils";
import React from "react";

// Dynamically import ChatLayout to avoid SSR issues with browser-only libraries
const ChatLayout = dynamic(() => import("@/components/chat/chat-layout"), {
  ssr: false,
});

export default function Home() {
  const [id] = React.useState(() => generateUUID());

  return (
    <main className="flex h-[calc(100dvh)] flex-col items-center ">
      <ChatLayout id={id} />
    </main>
  );
}
