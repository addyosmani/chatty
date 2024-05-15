"use client";

import useChatStore from "@/hooks/useChatStore";
import useMemoryStore from "@/hooks/useMemoryStore";
import WebLLMHelper from "@/lib/web-llm-helper";
import React, { useEffect } from "react";

// Create a context
const WebLLMContext = React.createContext<WebLLMHelper | null>(null);

// Create a custom hook to consume the context
export const useWebLLM = () => {
  const webLLMHelper = React.useContext(WebLLMContext);
  if (!webLLMHelper) {
    throw new Error("useWebLLM must be used within a WebLLMProvider");
  }
  return webLLMHelper;
};

// WebLLMProvider component
export const WebLLMProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const engine = useChatStore((state) => state.engine);
  const selectedModel = useChatStore((state) => state.selectedModel);
  const modelHasChanged = useChatStore((state) => state.modelHasChanged);
  const setEngine = useChatStore((state) => state.setEngine);

  const [webLLMHelper] = React.useState(new WebLLMHelper(engine));

  useEffect(() => {
    // If model has changed, reset engine to use new model
    if (modelHasChanged) {
      setEngine(null);
    }
  }, [selectedModel]);

  useEffect(() => {
    useChatStore.persist.rehydrate();
    useMemoryStore.persist.rehydrate();
  }, []);

  return (
    <WebLLMContext.Provider value={webLLMHelper}>
      {children}
    </WebLLMContext.Provider>
  );
};
