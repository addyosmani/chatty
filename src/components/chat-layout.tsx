"use client";

import { useState } from "react";
import { MenuIcon, PanelLeftIcon } from "lucide-react";

import { Chat } from "@/components/chat";
import { ChatSidebar } from "@/components/chat-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ChatLayoutProps = {
  chatId: string;
};

export function ChatLayout({ chatId }: ChatLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full">
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out md:block",
          isCollapsed ? "w-0" : "w-72"
        )}
      >
        <div className="h-full w-72">
          <ChatSidebar currentChatId={chatId} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-2 p-2">
          <div className="flex items-center gap-1">
            <Sheet onOpenChange={setIsMobileOpen} open={isMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  aria-label="Open chat menu"
                  className="md:hidden"
                  size="icon"
                  variant="ghost"
                >
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="w-72 p-0" side="left">
                <SheetTitle className="sr-only">Chats</SheetTitle>
                <ChatSidebar
                  currentChatId={chatId}
                  onNavigate={() => setIsMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <Button
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden md:inline-flex"
              onClick={() => setIsCollapsed((collapsed) => !collapsed)}
              size="icon"
              variant="ghost"
            >
              <PanelLeftIcon className="size-5" />
            </Button>
          </div>

          <ModeToggle />
        </header>

        <main className="flex min-h-0 flex-1 justify-center">
          <Chat chatId={chatId} key={chatId} />
        </main>
      </div>
    </div>
  );
}
