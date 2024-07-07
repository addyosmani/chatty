"use client";

import Link from "next/link";
import { MoreHorizontal, SquarePen, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Message } from "ai/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import UserSettings from "./user-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useRouter } from "next/navigation";
import SidebarSkeleton from "./ui/sidebar-skeleton";
import useChatStore from "@/hooks/useChatStore";
import useMemoryStore from "@/hooks/useMemoryStore";
import { Input } from "./ui/input";

interface MessageWithTitle extends Message {
  chatTitle: string; //used only for the first message
}

interface SidebarProps {
  isCollapsed: boolean;
  chatId: string;
  stop: () => void;
}

export function Sidebar({ isCollapsed, chatId, stop }: SidebarProps) {
  const [localChats, setLocalChats] = useState<
    { chatId: string; messages: MessageWithTitle[] }[]
  >([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setMessages = useChatStore((state) => state.setMessages);
  const setChatId = useMemoryStore((state) => state.setChatId);
  const setFiles = useChatStore((state) => state.setFiles);
  const setFileText = useChatStore((state) => state.setFileText);
  const [chatTitle, setChatTitle] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (chatId) {
      setSelectedChatId(chatId);
    }

    setLocalChats(getLocalstorageChats());
    const handleStorageChange = () => {
      setLocalChats(getLocalstorageChats());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const getLocalstorageChats = (): {
    chatId: string;
    messages: MessageWithTitle[];
  }[] => {
    const chats = Object.keys(localStorage).filter((key) =>
      key.startsWith("chat_")
    );

    if (chats.length === 0) {
      setIsLoading(false);
    }

    // Map through the chats and return an object with chatId and messages
    const chatObjects = chats.map((chat) => {
      const item = localStorage.getItem(chat);
      return item
        ? { chatId: chat, messages: JSON.parse(item) }
        : { chatId: "", messages: [] };
    });

    // Sort chats by the createdAt date of the first message of each chat
    chatObjects.sort((a, b) => {
      const aDate = new Date(a.messages[0].createdAt);
      const bDate = new Date(b.messages[0].createdAt);
      return bDate.getTime() - aDate.getTime();
    });

    setIsLoading(false);
    return chatObjects;
  };

  const getChatTitle = (chatId: string): string => {
    const data = JSON.parse(localStorage.getItem(chatId) as string);

    if (!data[0].chatTitle) {
      return data[0].content;
    }
    return data[0].chatTitle;
  }

  const handleNewChat = () => {
    stop();
    setTimeout(() => {
      setChatId("");
      setFiles(undefined);
      setFileText(null);
      router.push("/");
      setMessages(() => []);
    }, 50);
  };

  const handleDeleteChat = (chatId: string) => {
    router.push("/");
    const id = chatId.substring(5);
    localStorage.removeItem(chatId);
    localStorage.removeItem(`chatFile_${id}`);
    window.dispatchEvent(new Event("storage"));
    setLocalChats(getLocalstorageChats());
    setMessages(() => []);
  };

  const handleRenameFill = (chatId: string) => {
    if (chatId) {
      setChatTitle(getChatTitle(chatId));
    }
  }
  const handleRenameChat = (chatId: string) => {
    try {
      // Attempt to parse localStorage data as JSON, potentially throwing an error
      const data = JSON.parse(localStorage.getItem(chatId) as string || "");

      data[0]["chatTitle"] = chatTitle;
      const updatedDataString = JSON.stringify(data);
      localStorage.setItem(chatId, updatedDataString);
      window.dispatchEvent(new Event("storage")); // Update the UI
    } catch (error) {
      console.warn("Error parsing chat data:", error);
    }
  }

  return (
    <div className="relative overflow-hidden justify-between group md:bg-accent md:dark:bg-card flex flex-col h-full gap-4 ">
      <div className=" flex flex-col justify-between p-2 max-h-fit overflow-y-auto ">
        <Button
          onClick={handleNewChat}
          variant="ghost"
          className="flex justify-between w-full h-16 text-sm font-normal items-center shrink-0 rounded-full"
        >
          <div className="flex gap-3 items-center ">
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
          {localChats.length > 0 && (
            <div>
              {localChats.map(({ chatId, messages }, index) => (
                <div className="relative flex items-center" key={index}>
                  <Link
                    key={index}
                    href={`/${chatId.substr(5)}`}
                    className={cn(
                      {
                        [buttonVariants({ variant: "secondaryLink" })]:
                          chatId.substring(5) === selectedChatId,
                        [buttonVariants({ variant: "ghost" })]:
                          chatId.substring(5) !== selectedChatId,
                      },
                      "flex justify-between w-full h-14 text-base font-normal items-center rounded-full relative"
                    )}
                  >
                    <div className="flex gap-3 items-center truncate max-w-48">
                      <div className="flex flex-col">
                        <span className="text-xs font-normal ">
                          {messages[0].chatTitle ? messages[0].chatTitle : messages[0].content}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="absolute right-2" key="dropdown">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex justify-end items-center rounded-full"
                        >
                          <MoreHorizontal size={15} className="shrink-0" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className=" ">
                        <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                          <DialogTrigger>
                            <Button onClick={() => handleRenameFill(chatId)} variant="ghost" className="w-full flex gap-2 hover:text-black text-black dark:text-white justify-start items-center">
                              <div className="flex justify-end gap-2">
                                <Pencil className="shrink-0 w-4 h-4" />
                                Rename chat
                              </div>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader className="space-y-4">
                              <DialogTitle>Rename this chat</DialogTitle>
                              <div className="flex justify-end gap-2">
                                <Input
                                  defaultValue={chatTitle}
                                  placeholder="Enter your chat name"
                                  onChange={(e) => setChatTitle(e.target.value)}
                                />
                                <Button variant="outline" onClick={() => setRenameOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={() => { setRenameOpen(false); handleRenameChat(chatId) }}>
                                  Rename
                                </Button>
                              </div>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={open} onOpenChange={setOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full flex gap-2 hover:text-red-500 text-red-500 justify-start items-center"
                            >
                              <Trash2 className="shrink-0 w-4 h-4" />
                              Delete chat
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader className="space-y-4">
                              <DialogTitle>Delete chat?</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete this chat? This
                                action cannot be undone.
                              </DialogDescription>
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => {
                                    handleDeleteChat(chatId);
                                    setOpen(false);
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </DialogHeader>
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isLoading && <SidebarSkeleton />}
        </div>
      </div>

      <div className="justify-end p-2 border-t">
        <UserSettings />
      </div>
    </div >
  );
}
