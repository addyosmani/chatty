import { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { MessageWithFiles } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTextContentFromMessage(message: MessageWithFiles) {
  if (typeof message.content === "string") {
    return message.content;
  }
  for (const c of message.content!) {
    if (c.type === "text") {
      return c.text ?? "";
    }
  }
  return "";
}

export interface ChatImage {
  url: string;
}

export function getImagesFromMessage(message: MessageWithFiles): ChatImage[] {
  if (!message.content) return [];

  if (typeof message.content === "string") {
    return [];
  }
  const urls: ChatImage[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push({
        url: c.image_url?.url ?? "",
      });
    }
  }
  return urls;
}