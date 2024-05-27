"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "../sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { DividerVerticalIcon } from "@radix-ui/react-icons";
import { ChevronRightIcon, SquarePen } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Chat from "./chat";
import { MergedProps } from "@/lib/types";
import { Button } from "../ui/button";
import useChatStore from "@/hooks/useChatStore";
import { useRouter } from "next/navigation";
import useMemoryStore from "@/hooks/useMemoryStore";

export default function ChatLayout({
  messages,
  stop,
  chatId,
  loadingSubmit,
  handleSubmit,
  onRegenerate,
}: MergedProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const setStoredMessages = useChatStore((state) => state.setMessages);
  const setFiles = useChatStore((state) => state.setFiles);
  const setFileText = useChatStore((state) => state.setFileText);
  const setChatId = useMemoryStore((state) => state.setChatId);
  const router = useRouter();

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

  const handleNewChat = () => {
    // Clear messages
    setStoredMessages(() => []);
    setChatId("");
    setFiles(undefined);
    setFileText(null);
    router.push("/");
  };

  return (
    <div className="flex relative h-[calc(100dvh)] w-full ">
      <AnimatePresence>
        <motion.div
          key="sidebar"
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
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isCollapsed ? 1 : 0 }}
            transition={{
              duration: isCollapsed ? 0.2 : 0,
              ease: "easeInOut",
              delay: isCollapsed ? 0.2 : 0,
            }}
          >
            <Button
              variant="ghost"
              className="absolute gap-3 left-4 top-2 rounded-full"
              size="icon"
              disabled={!isCollapsed}
              onClick={() => {
                handleNewChat();
              }}
            >
              <SquarePen size={18} className="shrink-0 w-5 h-5" />
            </Button>
          </motion.div>
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
