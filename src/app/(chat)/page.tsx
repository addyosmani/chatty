"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import useChatStore from "@/hooks/useChatStore";
import ChatLayout from "@/components/chat/chat-layout";
import { v4 as uuidv4 } from "uuid";
import UsernameForm from "@/components/username-form";
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
