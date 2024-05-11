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
}

export type MergedProps = ChatLayoutProps & ChatProps;
