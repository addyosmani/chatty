import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { MessageWithFiles } from "./types";
import { customAlphabet } from 'nanoid';

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

// Function to create an ID generator
const createIdGenerator = ({
  prefix = "",
  size: defaultSize = 7,
  alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
} = {}) => {
  const generator = customAlphabet(alphabet, defaultSize);
  return (size = defaultSize) => `${prefix}${generator(size)}`; // Provide a default size
};

// Create a default generateId function
export const generateMessageId = createIdGenerator();

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}