import type { ChatCompletionMessageParam, ChatCompletionAssistantMessageParam, ChatCompletionUserMessageParam } from "@mlc-ai/web-llm";

// Base interface for all messages
interface BaseMessage {
  id: string;
  chatTitle?: string;
  fileName?: string;
}

export interface UserMessage extends BaseMessage, ChatCompletionUserMessageParam {
  role: 'user';
}

export interface AssistantMessage extends BaseMessage, ChatCompletionAssistantMessageParam {
  role: 'assistant';
}

export type MessageWithFiles = UserMessage | AssistantMessage;

export interface ChatLayoutProps {
  chatId: string;
}

export interface ChatProps {
  chatId?: string;
  messages: MessageWithFiles[];
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  loadingSubmit?: boolean;
  stop: () => void;
  isMobile?: boolean;
  onRegenerate?: () => void;
}

export type MergedProps = ChatLayoutProps & ChatProps;