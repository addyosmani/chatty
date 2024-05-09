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

export default function ChatLayout() {
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
    <div className="flex relative h-screen w-full ">
      <AnimatePresence>
        <motion.div
          key="sidebar"
          animate={{ width: isCollapsed ? 0 : 288 }}
          exit={{ width: 0 }}
          transition={{ duration: 0.2 }}
          className="w-72 hidden md:block"
        >
          <Sidebar
            isCollapsed={isCollapsed}
            messages={[]}
            chatId={""}
            setMessages={() => {}}
          />
        </motion.div>
        <div
          key="divider"
          className={cn("flex items-center relative left-1")}
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
        <div className="h-full">GG</div>
      </AnimatePresence>
    </div>
  );
}
