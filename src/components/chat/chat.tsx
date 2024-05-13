"use client";

import React from "react";
import ChatTopbar from "./chat-topbar";
import ChatList from "./chat-list";
import ChatBottombar from "./chat-bottombar";
import { Message } from "ai/react";
import { ChatRequestOptions } from "ai";
import { ChatProps } from "@/lib/types";
import { Cross2Icon } from "@radix-ui/react-icons";
import useChatStore from "@/hooks/useChatStore";

export default function Chat({
  handleSubmit,
  stop,
  chatId,
  loadingSubmit,
  isMobile,
  messages,
  onRegenerate,
}: ChatProps) {
  const [files, setFiles] = React.useState<File[] | undefined>(undefined);
  const setFileText = useChatStore((state) => state.setFileText);

  return (
    <div className="flex flex-col justify-between w-full max-w-3xl h-full  ">
      <ChatTopbar chatId={chatId} />

      <ChatList
        messages={messages}
        handleSubmit={handleSubmit}
        loadingSubmit={loadingSubmit}
        stop={stop}
        isMobile={isMobile}
        onRegenerate={onRegenerate}
      />

      {files && (
        <div className="ml-5 relative w-fit top-2">
          <div className=" px-2 py-1.5 bg-muted-foreground/20 flex w-fit flex-col truncate gap-2 p-1 border-t border-x rounded-tl-md rounded-tr-md">
            <div className="flex text-sm">
              {files.map((file) => (
                <div key={file.name} className="flex flex-col">
                  <span>{file.name}</span>
                </div>
              ))}
            </div>
          </div>
          <span className="absolute -top-1.5 -right-1.5 text-white cursor-pointer  bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center">
            <Cross2Icon
              className="w-3 h-3"
              onClick={() => {
                setFiles(undefined);
                setFileText(null);
              }}
            />
          </span>
        </div>
      )}

      <ChatBottombar
        files={files}
        setFiles={setFiles}
        handleSubmit={handleSubmit}
        stop={stop}
        messages={messages}
      />
    </div>
  );
}
