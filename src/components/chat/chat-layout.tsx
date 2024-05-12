"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../sidebar";
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
import useChatStore from "@/hooks/useChatStore";

export default function ChatLayout({
  messages,
  stop,
  chatId,
  loadingSubmit,
  handleSubmit,
  onRegenerate,
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
          initial={{ width: 0 }}
          animate={{ width: isCollapsed ? 0 : 288 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="w-72 hidden md:block shrink-0"
        >
          <Sidebar isCollapsed={isCollapsed} chatId={chatId} />
        </motion.div>
        <div
          key="divider"
          className=" items-center relative left-1 hidden md:flex"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                {isCollapsed ? (
                  <ChevronRightIcon className="h-6 w-6 cursor-pointer hover:text-muted-foreground" />
                ) : (
                  <DividerVerticalIcon className="h-6 w-6 cursor-pointer hover:text-muted-foreground" />
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
            handleSubmit={handleSubmit}
            stop={stop}
            chatId={chatId}
            loadingSubmit={loadingSubmit}
            onRegenerate={onRegenerate}
          />
        </div>
      </AnimatePresence>
    </div>
  );
}
