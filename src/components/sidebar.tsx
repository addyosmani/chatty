"use client";

import Link from "next/link";
import { SquarePen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import UserSettings from "./user-settings";
import useChatStore from "@/hooks/useChatStore";
import { ChatItem } from "./sidebar-chat-item";

interface SidebarProps {
  isCollapsed: boolean;
  chatId: string;
  handleNewChat: () => void;
  handleDeleteChat: (chatId: string) => void;
}
export function Sidebar({ isCollapsed, chatId, handleNewChat, handleDeleteChat }: SidebarProps) {
  const chats = useChatStore((state) => state.chats);
  const setChatTitle = useChatStore((state) => state.setChatTitle);

  const handleRenameChat = (chatId: string, newTitle: string) => {
    if (newTitle) {
      setChatTitle(chatId, newTitle);
    }
  };

  return (
    <div className="relative overflow-hidden justify-between group md:bg-accent md:dark:bg-card flex flex-col h-full gap-4">
      <div className="flex flex-col justify-between p-2 max-h-fit overflow-y-auto">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="flex justify-between w-full h-16 text-sm font-normal items-center shrink-0 rounded-full"
        >
          <div className="flex gap-3 items-center">
            <Image
              src="/logo.svg"
              alt="AI"
              width={34}
              height={34}
              className="dark:invert"
            />
            New chat
          </div>
          <SquarePen size={18} className="shrink-0 w-5 h-5" />
        </Button>

        <div className="flex flex-col pt-10 gap-2">
          <p className="pl-4 text-xs text-muted-foreground">Your chats</p>
          {chats && (
            <div>
              {Object.entries(chats)
                .sort(
                  ([, a], [, b]) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .map(([id, chat]) => (
                  <ChatItem
                    key={id}
                    id={id}
                    chat={chat}
                    isActive={id === chatId}
                    onRename={handleRenameChat}
                    onDelete={handleDeleteChat}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="justify-end p-2 border-t">
        <UserSettings />
      </div>
    </div>
  );
}