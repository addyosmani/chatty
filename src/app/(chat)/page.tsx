"use client";

import dynamic from "next/dynamic";
import { generateUUID } from "@/lib/utils";
import React, { useEffect, useRef } from "react";
import useChatStore from "@/hooks/useChatStore";

const Chat = dynamic(() => import("@/components/chat/chat"), {
  ssr: false,
});

export default function Home() {
  const [id, setId] = React.useState(() => generateUUID());
  const currentChatId = useChatStore((state) => state.currentChatId);
  const prevChatIdRef = useRef(currentChatId);

  useEffect(() => {
    // When currentChatId transitions to null (new chat requested), generate a fresh ID
    if (prevChatIdRef.current !== null && currentChatId === null) {
      setId(generateUUID());
    }
    prevChatIdRef.current = currentChatId;
  }, [currentChatId]);

  return <Chat id={id} />;
}
