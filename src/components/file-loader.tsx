import React, { useState } from "react";
import FileEmbedder from "./file-embedder";
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { Button } from "./ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { PaperclipIcon } from "lucide-react";
import { toast } from "sonner";

export default function FileLoader({
  setFileText,
  files,
  setFiles,
}: {
  setFileText: any;
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
}) {
  const handleEmbed = async (files: File[]) => {
    if (files && files.length) {
      setFiles(files);
      const file = files[0];
      let text;
      const blob = new Blob([file]);

      const pdfLoader = new WebPDFLoader(blob);
      text = await pdfLoader.load();

      setFileText(text);
      toast.success(
        "File embedded successfully. Start asking questions about it."
      );
    }
  };

  const readFileContent = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Resolve with the text content
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsText(file); // Read file as text
    });
  };

  return (
    <div>
      {!files ? (
        <FileEmbedder handleEmbed={handleEmbed} />
      ) : (
        <Button
          disabled={files.length > 0}
          variant="ghost"
          size="icon"
          className="rounded-full shrink-0"
        >
          <PaperclipIcon className="w-5 h-5 text-muted-foreground" />
        </Button>
      )}
    </div>
  );
}
