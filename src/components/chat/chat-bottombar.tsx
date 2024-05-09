"use client";

import React, { useState, useEffect } from "react";
import { ChatProps } from "./chat";
import { Button } from "../ui/button";
import TextareaAutosize from "react-textarea-autosize";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { v4 as uuidv4 } from "uuid";

// Assume Gamma is properly imported, adjust path as necessary
import Gamma from '../../lib/gamma';

export default function ChatBottombar({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  error,
  stop,
}: ChatProps ) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="p-4 flex justify-between w-full items-center gap-2">
      <form
        onSubmit={handleSubmit}
        className="w-full items-center flex relative gap-2"
      >
        <TextareaAutosize
          autoComplete="off"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="border-input max-h-20 px-5 py-4 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 w-full border rounded-full flex items-center h-14 resize-none overflow-hidden dark:bg-card/35"
        />
        <Button
          variant="ghost"
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
        >
          <PaperPlaneIcon />
        </Button>
      </form>
    </div>
  );
}
