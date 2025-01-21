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
import { Input } from "./ui/input";

interface ChatItemProps {
  id: string;
  chat: any;
  isActive: boolean;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}

interface ContentItem {
  type: "text" | "image_url";
  text?: string;
  image_url?: {
    url: string;
  };
}

export const ChatItem: React.FC<ChatItemProps> = ({
  id,
  chat,
  isActive,
  onRename,
  onDelete,
}) => {
  const [renameOpen, setRenameOpen] = useState(false);
  const [chatTitleInternal, setChatTitleInternal] = useState<string>(
    chat.title
  );

  const handleRename = () => {
    onRename(id, chatTitleInternal);
    setRenameOpen(false);
  };

  return (
    <div className="relative flex items-center">
      <Link
        href={`/c/${id}`}
        className={cn(
          {
            [buttonVariants({ variant: "secondaryLink" })]: isActive,
            [buttonVariants({ variant: "ghost" })]: !isActive,
          },
          "flex justify-between w-full h-14 text-base font-normal items-center rounded-full relative"
        )}
      >
        <div className="flex gap-3 items-center truncate max-w-48">
          <div className="flex flex-col">
            <span className="text-xs font-normal ">
              {chat.title
                ? chat.title
                : (chat.messages &&
                    chat.messages[0]?.content &&
                    (typeof chat.messages[0].content === "string"
                      ? chat.messages[0].content
                      : Array.isArray(chat.messages[0].content)
                      ? chat.messages[0].content.find(
                          (item: ContentItem) => item.type === "text"
                        )?.text
                      : "")) ||
                  ""}
            </span>
          </div>
        </div>
      </Link>

      <div className="absolute right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex justify-end items-center rounded-full"
            >
              <MoreHorizontal size={15} className="shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
              <DialogTrigger>
                <Button
                  variant="ghost"
                  className="w-full flex gap-2 hover:text-black text-black dark:text-white justify-start items-center"
                >
                  <Pencil className="shrink-0 w-4 h-4" />
                  Rename chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="space-y-4">
                  <DialogTitle>Rename this chat</DialogTitle>
                  <div className="flex justify-end gap-2">
                    <Input
                      defaultValue={chat.title}
                      placeholder="Enter your chat name"
                      onChange={(e) => setChatTitleInternal(e.target.value)}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setRenameOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRename}>Rename</Button>
                  </div>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <Dialog>
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
                    Are you sure you want to delete this chat? This action
                    cannot be undone.
                  </DialogDescription>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setRenameOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(id)}>
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
  );
};
