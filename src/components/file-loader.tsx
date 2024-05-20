import React, { useState } from "react";
import FileEmbedder from "./file-embedder";
import { WebPDFLoader } from "langchain/document_loaders/web/pdf";
import { Button } from "./ui/button";
import { Cross2Icon } from "@radix-ui/react-icons";
import { PaperclipIcon } from "lucide-react";
import { toast } from "sonner";
import { Document } from "@langchain/core/documents";

export default function FileLoader({
  setFileText,
  files,
  setFiles,
}: {
  setFileText: any;
  files: File[] | undefined;
  setFiles: (files: File[] | undefined) => void;
}) {
  const readFileContent = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Resolve with the text content
        // Save as a document
        const document = new Document({
          pageContent: reader.result as string,
          metadata: {
            title: file.name,
            fileType: file.type,
          },
        });
        resolve([document]);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleEmbed = async (files: File[]) => {
    if (files && files.length) {
      switch (files[0].type) {
        case "application/pdf":
          setFiles(files);
          let text;
          const blob = new Blob([files[0]]);

          const pdfLoader = new WebPDFLoader(blob);
          text = await pdfLoader.load();

          setFileText(text);
          toast.success(
            "File embedded successfully. Start asking questions about it."
          );
          break;
        case "text/plain":
          setFiles(files);
          const fileText = await readFileContent(files[0]);
          setFileText(fileText as string);
          toast.success(
            "File embedded successfully. Start asking questions about it."
          );
          break;
        case "text/csv":
          setFiles(files);
          const fileContent = await readFileContent(files[0]);
          setFileText(fileContent as string);
          toast.success(
            "File embedded successfully. Start asking questions about it."
          );
          break;
        default:
          toast.error(
            "Unsupported file type. Please upload a PDF or a text file."
          );
          return;
      }
    }
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
