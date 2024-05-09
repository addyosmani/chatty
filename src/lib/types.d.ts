export interface ChatLayoutProps {
  chatId: string;
  setMessages: (
    fn: (
      messages: webllm.ChatCompletionMessageParam[]
    ) => webllm.ChatCompletionMessageParam[]
  ) => void;
}

export interface ChatProps {
  chatId?: string;
  setSelectedModel: (model: Model) => void;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    chatRequestOptions?: ChatRequestOptions
  ) => void;
  isLoading: boolean;
  loadingSubmit?: boolean;
  error: undefined | Error;
  stop: () => void;
  isMobile?: boolean;
}

export type MergedProps = ChatLayoutProps & ChatProps;
