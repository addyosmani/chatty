"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../sidebar";
import { Message } from "ai/react";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { DividerVerticalIcon } from "@radix-ui/react-icons";
import { ChevronRightIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chat from "./chat";
import { MergedProps } from "@/lib/types";

export default function ChatLayout({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
  chatId,
  setSelectedModel,
  loadingSubmit,
  setMessages,
}: MergedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const collapsed = localStorage.getItem("chat-collapsed");
      if (collapsed === "true") {
        setIsCollapsed(true);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("chat-collapsed", isCollapsed.toString());
    }
  }, [isCollapsed]);

  return (
    <div className="flex relative h-[calc(100dvh)] w-full ">
      <AnimatePresence>
        <motion.div
          key="sidebar"
          animate={{ width: isCollapsed ? 0 : 288 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="w-72 hidden md:block shrink-0"
        >
          <Sidebar
            isCollapsed={isCollapsed}
            messages={messages}
            chatId={chatId}
            setMessages={setMessages}
          />
        </motion.div>
        <div
          key="divider"
          className=" items-center relative left-1 hidden md:flex"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                {isCollapsed ? (
                  <ChevronRightIcon className="h-6 w-6 cursor-pointer hover:text-muted-foreground" />
                ) : (
                  <DividerVerticalIcon className="h-6 w-6 cursor-pointer" />
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                {isCollapsed ? "Expand" : "Collapse"} sidebar
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="h-full w-full flex flex-col items-center justify-center">
          <Chat
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
            stop={stop}
            chatId={chatId}
            setSelectedModel={setSelectedModel}
            loadingSubmit={loadingSubmit}
          />
        </div>
      </AnimatePresence>
    </div>
  );
}
