"use client";

import { useState } from "react";

import { ChatLayout } from "@/components/chat-layout";
import { generateUUID } from "@/lib/utils";

export default function Home() {
  // One id per mount; the chat adopts /c/<id> once the first message is sent.
  const [chatId] = useState(generateUUID);

  return <ChatLayout chatId={chatId} />;
}
