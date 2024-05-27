import { ChatCompletionMessageParam } from "@mlc-ai/web-llm";

export interface ChatLayoutProps {
  chatId: string;
}

export interface ChatProps {
  chatId?: string;
  messages: Message[];
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  loadingSubmit?: boolean;
  stop: () => void;
  isMobile?: boolean;
  onRegenerate?: () => void;
}

export interface MessageWithFile extends ChatCompletionMessageParam {
  fileName?: string;
}

export type MergedProps = ChatLayoutProps & ChatProps;

export type MessageWithFiles = MessageWithFile & ChatCompletionMessageParam;
