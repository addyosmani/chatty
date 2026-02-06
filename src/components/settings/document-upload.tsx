"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useDocumentStore } from "@/hooks/useDocumentStore";
import { Upload } from "lucide-react";
import { toast } from "sonner";

export default function DocumentUpload() {
  const { uploadDocument, isLoading } = useDocumentStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        try {
          await uploadDocument(file);
          toast.success(`Uploaded ${file.name}`);
        } catch (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
        }
      }
    },
    [uploadDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"}
        ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      {isDragActive ? (
        <p>Drop files here...</p>
      ) : (
        <div>
          <p className="mb-1">Drag & drop files here, or click to select</p>
          <p className="text-sm text-muted-foreground">
            Supports: PDF, TXT, MD, CSV (max 10MB)
          </p>
        </div>
      )}
    </div>
  );
}
