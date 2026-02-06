"use client";

import React from "react";
import dynamic from "next/dynamic";

const Chat = dynamic(() => import("@/components/chat/chat"), {
  ssr: false,
});

export default function Page({ params }: { params: { id: string } }) {
  const id = params.id;

  return <Chat id={id} />;
}
