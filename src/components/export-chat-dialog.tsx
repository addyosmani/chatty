"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ButtonWithTooltip from "./button-with-tooltip";
import { Button } from "./ui/button";
import { Download, DownloadIcon } from "lucide-react";
import useMemoryStore from "@/hooks/useMemoryStore";
import { useEffect, useState } from "react";
import CodeDisplayBlock from "./code-display-block";
import useChatStore from "@/hooks/useChatStore";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExportChatDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ExportChatDialog({
  open,
  setOpen,
}: ExportChatDialogProps) {
  const chatId = useMemoryStore((state) => state.chatId);
  const messages = useChatStore((state) => state.messages);
  const [fileType, setFileType] = useState<"json" | "md">("json");

  const markdownMessages = messages.map((message) => {
    return `## **${message.role}**: 
    ${message.content}\n`;
  });

  const handleExport = (fileType: "json" | "md") => {
    const filename = `chat_${chatId}.${fileType}`;
    let content = "";
    let mimeType = "";

    if (fileType === "json") {
      content = JSON.stringify(messages, null, 2);
      mimeType = "application/json";
    } else if (fileType === "md") {
      content = markdownMessages.join("\n");
      mimeType = "text/markdown";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ButtonWithTooltip side="left" toolTipText="Export Chat">
          <Button
            onClick={() => setOpen(true)}
            variant="ghost"
            size="icon"
            className="absolute top-5 right-2 sm:right-5 rounded-full"
          >
            <Download className="w-5 h-5" />
          </Button>
        </ButtonWithTooltip>
      </DialogTrigger>
      <DialogContent className="w-full space-y-4">
        <DialogTitle className="mb-5">Export Chat</DialogTitle>

        <div>
          <DialogDescription className="pb-2">Filetype</DialogDescription>
          <Select onValueChange={(value) => setFileType(value as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={fileType === "json" ? "JSON" : "Markdown"}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="md">Markdown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-hidden max-h-80 w-full">
          <DialogDescription>Preview</DialogDescription>
          <pre className="whitespace-pre-wrap overflow-scroll max-h-80 pt-2 text-xs">
            {fileType === "json" ? (
              <CodeDisplayBlock
                code={JSON.stringify(messages, null, 2)}
                lang={""}
              />
            ) : (
              <div className="bg-accent p-2 overflow-scroll">
                <Markdown remarkPlugins={[remarkGfm]}>
                  {markdownMessages.join("\n")}
                </Markdown>
              </div>
            )}
          </pre>
        </div>
        <Button
          variant="default"
          onClick={() => {
            handleExport(fileType);
            setOpen(false);
          }}
          className="w-full flex gap-2 items-center"
        >
          <DownloadIcon className="w-4 h-4" />
          Download
        </Button>
      </DialogContent>
    </Dialog>
  );
}
