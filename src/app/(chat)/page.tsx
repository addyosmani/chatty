"use client";

import dynamic from "next/dynamic";
import { generateUUID } from "@/lib/utils";
import React from "react";

const Chat = dynamic(() => import("@/components/chat/chat"), {
  ssr: false,
});

export default function Home() {
  const [id] = React.useState(() => generateUUID());

  return <Chat id={id} />;
}
