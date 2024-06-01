"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { PaperclipIcon } from "lucide-react";

interface FileEmbedderProps {
  handleEmbed: (acceptedFiles: File[]) => void;
}

const FileEmbedder: React.FC<FileEmbedderProps> = ({ handleEmbed }) => {
  const excludedExtensions = [
    ".png", ".webp", ".jpg", ".jpeg", ".avif", ".jxl", ".tiff", ".gif", // Image formats
    ".mp4", ".mov", ".avi", ".mkv", ".flv", ".wmv", // Video formats
    ".exe", ".dll", ".so", ".app", ".dmg", // Executables
    ".zip", ".rar", ".7z", ".tar", ".gz", ".bz2", ".xz", // Archives
    ".mp3", ".wav", ".aac", ".flac", ".ogg", ".m4a", // Audio files
    ".gltf", ".glb", ".fbx", ".obj", ".3ds", ".blend", // 3D files
    ".DS_Store", ".git", ".svn", ".hg", // System files
    ".bin", ".iso", ".img", ".toast", ".vdi" // Disk images
  ];

  const fileValidator = (file: File) => {
    const extension = file.name.slice(file.name.lastIndexOf('.'));
    if (excludedExtensions.includes(extension.toLowerCase())) {
      return {
        code: "file-invalid-type",
        message: `Files of type ${extension} are not allowed.`
      };
    }
    return null;
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      handleEmbed(acceptedFiles);
    },
    [handleEmbed]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    validator: fileValidator,
    maxFiles: 1,
    maxSize: 10485760, // 10 MB
  });

  return (
    <>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <Button variant="ghost" size="icon" className="rounded-full shrink-0">
          <PaperclipIcon className="w-5 h-5" />
        </Button>
      </div>
    </>
  );
};

export default FileEmbedder;
