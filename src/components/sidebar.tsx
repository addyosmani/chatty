"use client";

import { useEffect, useState, useCallback } from "react";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import UserSettings from "./user-settings";
import useChatStore, { ChatSession } from "@/hooks/useChatStore";
import { ChatItem } from "./sidebar-chat-item";

interface SidebarProps {
  isCollapsed: boolean;
  chatId: string;
  handleNewChat: () => void;
  handleDeleteChat: (chatId: string) => void;
}
export function Sidebar({
  isCollapsed,
  chatId,
  handleNewChat,
  handleDeleteChat,
}: SidebarProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const getAllChats = useChatStore((state) => state.getAllChats);
  const setChatTitle = useChatStore((state) => state.setChatTitle);
  const chatListVersion = useChatStore((state) => state.chatListVersion);

  // Load chats on mount, when chatId changes, or when chat list is updated
  useEffect(() => {
    const loadChats = async () => {
      const allChats = await getAllChats();
      setChats(allChats);
    };
    loadChats();
  }, [getAllChats, chatId, chatListVersion]);

  const handleRenameChat = useCallback(async (chatId: string, newTitle: string) => {
    if (newTitle) {
      await setChatTitle(chatId, newTitle);
      // Refresh chats list
      const allChats = await getAllChats();
      setChats(allChats);
    }
  }, [setChatTitle, getAllChats]);

  return (
    <div className="relative overflow-hidden justify-between group md:bg-accent md:dark:bg-card flex flex-col h-full gap-4">
      <div className="flex flex-col justify-between p-2 max-h-fit overflow-y-auto">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="flex justify-between w-full h-16 text-sm font-normal items-center shrink-0 rounded-full"
          aria-label="New chat"
          role="button"
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
          {chats.length > 0 && (
            <div>
              {chats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  id={chat.id}
                  chat={chat}
                  isActive={chat.id === chatId}
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
