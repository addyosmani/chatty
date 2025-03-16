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
import { MessageWithFiles } from "@/lib/types";
import { Button } from "../ui/button";
import useChatStore from "@/hooks/useChatStore";
import { useRouter } from "next/navigation";
import ButtonWithTooltip from "../button-with-tooltip";
import ExportChatDialog from "../export-chat-dialog";
import { useChat } from "@/hooks/useChat";

interface ChatLayoutProps {
  id: string;
  initialMessages: MessageWithFiles[];
}

export default function ChatLayout({ initialMessages, id }: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const handleDelete = useChatStore((state) => state.handleDelete);

  const router = useRouter();

  const { stop, setStoredMessages } = useChat({ id, initialMessages });

  const [open, setOpen] = React.useState(false);

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
    stop();
    setTimeout(() => {
      setStoredMessages(() => []);
      router.push("/");
    }, 150);
  };

  function handleDeleteChat(chatId: string) {
    stop();
    handleDelete(chatId);
    setStoredMessages(() => []);
    router.push("/");
  }

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
          <Sidebar isCollapsed={isCollapsed} chatId={id} handleNewChat={handleNewChat} handleDeleteChat={handleDeleteChat} />
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
            key="new-chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: isCollapsed ? 1 : 0 }}
            transition={{
              duration: isCollapsed ? 0.2 : 0,
              ease: "easeInOut",
              delay: isCollapsed ? 0.2 : 0,
            }}
            className="hidden md:flex"
          >
            <ButtonWithTooltip side="right" toolTipText="New chat">
              <Button
                variant="ghost"
                className="absolute gap-3 left-4 top-5 rounded-full"
                size="icon"
                disabled={!isCollapsed}
                onClick={() => {
                  handleNewChat();
                }}
                aria-label="New chat"
              >
                <SquarePen size={18} className="shrink-0 w-5 h-5" />
              </Button>
            </ButtonWithTooltip>
          </motion.div>
        </div>
      </AnimatePresence>
      <div className="h-full w-full flex flex-col items-center justify-center">
        <Chat id={id} initialMessages={initialMessages} />

        {/* Export chat button */}
        <ExportChatDialog open={open} setOpen={setOpen} />
      </div>
    </div>
  );
}
