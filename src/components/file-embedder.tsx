"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { PaperclipIcon } from "lucide-react";
interface FileEmbedderProps {
  handleEmbed: (acceptedFiles: File[]) => void;
}

const FileEmbedder: React.FC<FileEmbedderProps> = ({ handleEmbed }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleEmbed(acceptedFiles);
      setIsDragActive(false);
    },
    [handleEmbed]
  );

  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    // 10 mb - this might be too much.
    maxSize: 10485760,
  });

  const acceptedFileItems = acceptedFiles.map((file: any) => (
    <li key={file.name}>{file.name}</li>
  ));

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button variant="ghost" size="icon" className="rounded-full shrink-0">
          <PaperclipIcon className="w-5 h-5 " />
        </Button>
      </div>
    </>
  );
};

export default FileEmbedder;
