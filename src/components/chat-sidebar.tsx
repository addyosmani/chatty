"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { SquarePenIcon } from "lucide-react";

import { ChatSidebarItem } from "@/components/chat-sidebar-item";
import { UserSettings } from "@/components/user-settings";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { clearDocumentIndex } from "@/lib/rag";
import { useAppStore } from "@/lib/store";

type ChatSidebarProps = {
  currentChatId: string;
  onNavigate?: () => void;
};

export function ChatSidebar({ currentChatId, onNavigate }: ChatSidebarProps) {
  const router = useRouter();
  const chats = useAppStore((state) => state.chats);
  const setChatTitle = useAppStore((state) => state.setChatTitle);
  const deleteChat = useAppStore((state) => state.deleteChat);

  const visibleChats = Object.entries(chats)
    .filter(([, chat]) => chat.messages.length > 0)
    .sort(
      ([, a], [, b]) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const handleDelete = (chatId: string) => {
    deleteChat(chatId);
    clearDocumentIndex(chatId);
    if (chatId === currentChatId) {
      router.push("/");
    }
  };

  return (
    <div className="flex h-full flex-col justify-between gap-4 bg-accent dark:bg-card">
      <div className="flex min-h-0 flex-col gap-4 p-2">
        <Button
          aria-label="New chat"
          className="h-14 w-full shrink-0 justify-between rounded-full text-sm font-normal"
          onClick={() => {
            onNavigate?.();
            router.push("/");
          }}
          variant="ghost"
        >
          <span className="flex items-center gap-3">
            <Image
              alt="Chatty"
              className="dark:invert"
              height={30}
              src="/logo.svg"
              width={30}
            />
            New chat
          </span>
          <SquarePenIcon className="size-5 shrink-0" />
        </Button>

        <div className="flex min-h-0 flex-col gap-2">
          <p className="px-4 text-xs text-muted-foreground">Your chats</p>
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-1 pr-1">
              {visibleChats.length === 0 ? (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  No chats yet.
                </p>
              ) : (
                visibleChats.map(([id, chat]) => (
                  <ChatSidebarItem
                    chat={chat}
                    id={id}
                    isActive={id === currentChatId}
                    key={id}
                    onDelete={handleDelete}
                    onRename={setChatTitle}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="border-t p-2">
        <UserSettings />
      </div>
    </div>
  );
}
