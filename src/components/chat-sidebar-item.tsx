"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/lib/store";

type ChatSidebarItemProps = {
  id: string;
  chat: ChatSession;
  isActive: boolean;
  onRename: (chatId: string, title: string) => void;
  onDelete: (chatId: string) => void;
};

/** First line of the first user message, used when a chat has no title yet. */
function deriveTitle(chat: ChatSession): string {
  const firstUserMessage = chat.messages.find(
    (message) => message.role === "user"
  );
  const text = firstUserMessage?.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();

  return text || "New chat";
}

export function ChatSidebarItem({
  id,
  chat,
  isActive,
  onRename,
  onDelete,
}: ChatSidebarItemProps) {
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const title = chat.title || deriveTitle(chat);

  const openRename = () => {
    setDraftTitle(title);
    setRenameOpen(true);
  };

  const submitRename = () => {
    const next = draftTitle.trim();
    if (next) {
      onRename(id, next);
    }
    setRenameOpen(false);
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-1 rounded-lg pr-1 hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <Link
        className="flex-1 truncate px-3 py-2 text-sm"
        href={`/c/${id}`}
        title={title}
      >
        {title}
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={`Options for ${title}`}
            className="size-7 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100"
            size="icon"
            variant="ghost"
          >
            <MoreHorizontalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openRename}>
            <PencilIcon className="size-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            variant="destructive"
          >
            <Trash2Icon className="size-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog onOpenChange={setRenameOpen} open={renameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            onChange={(event) => setDraftTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitRename();
              }
            }}
            value={draftTitle}
          />
          <DialogFooter>
            <Button onClick={() => setRenameOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={submitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setDeleteOpen} open={deleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              &quot;{title}&quot; will be permanently removed from this browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDeleteOpen(false);
                onDelete(id);
              }}
              variant="destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
