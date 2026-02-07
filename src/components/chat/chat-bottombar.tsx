"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import type { ChatStatus } from "ai";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import MultiImagePicker from "../image-embedder";
import { useModelStore } from "@/hooks/useModelStore";
import useChatStore from "@/hooks/useChatStore";
import { useDocumentStore, useHasDocuments } from "@/hooks/useDocumentStore";
import { Models, Model, modelDetailsList, ModelGroup } from "@/lib/models";
import { Badge } from "../ui/badge";
import { CheckIcon, FileSearch } from "lucide-react";
import Image from "next/image";

interface ChatBottombarProps {
  input: string;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (message: PromptInputMessage) => void;
  stop: () => void;
  status: ChatStatus;
}

// Map model groups to ModelSelectorLogo provider slugs
const groupToProvider: Record<string, string | null> = {
  [ModelGroup.QWEN]: "alibaba",
  [ModelGroup.LLAMA]: "llama",
  [ModelGroup.MISTRAL]: "mistral",
  [ModelGroup.DEEPSEEK]: "deepseek",
  [ModelGroup.PHI]: null,
  [ModelGroup.GEMMA]: "google",
  [ModelGroup.REDPAJAMA]: "togetherai",
};

export default function ChatBottombar({
  input,
  handleInputChange,
  handleSubmit,
  stop,
  status,
}: ChatBottombarProps) {
  const [modelSelectorOpen, setModelSelectorOpen] = React.useState(false);

  const setBase64Images = useChatStore((state) => state.setBase64Images);
  const selectedModel = useModelStore((state) => state.selectedModel);
  const setSelectedModel = useModelStore((state) => state.setSelectedModel);
  const isLoading = useChatStore((state) => state.isLoading);

  const hasDocuments = useHasDocuments();
  const loadDocuments = useDocumentStore((state) => state.loadDocuments);
  const searchInDocuments = useDocumentStore(
    (state) => state.searchInDocuments,
  );
  const setSearchInDocuments = useDocumentStore(
    (state) => state.setSearchInDocuments,
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const toggleRag = useCallback(() => {
    setSearchInDocuments(!searchInDocuments);
  }, [searchInDocuments, setSearchInDocuments]);

  const groupedModels = useMemo(() => {
    return Models.reduce(
      (acc, model) => {
        if (!acc[model.group]) {
          acc[model.group] = [];
        }
        acc[model.group].push(model);
        return acc;
      },
      {} as Record<string, Model[]>,
    );
  }, []);

  const getGroupIcon = (group: string) => {
    const details = modelDetailsList.find((m) => m.group === group);
    return details?.icon;
  };

  const handleModelSelect = useCallback(
    (model: Model) => {
      setSelectedModel(model);
      setModelSelectorOpen(false);
    },
    [setSelectedModel],
  );

  const handleTranscriptionChange = useCallback(
    (transcript: string) => {
      const syntheticEvent = {
        target: { value: input ? `${input} ${transcript}` : transcript },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(syntheticEvent);
    },
    [input, handleInputChange],
  );

  const onTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handleInputChange(e);
    },
    [handleInputChange],
  );

  return (
    <div className="px-4 pb-7 w-full">
      <PromptInput onSubmit={handleSubmit}>
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={onTextareaChange}
            placeholder="Enter your prompt here"
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <MultiImagePicker
              disabled={!selectedModel?.vision}
              onImagesPick={setBase64Images}
            />
            {hasDocuments && (
              <PromptInputButton
                onClick={toggleRag}
                variant={searchInDocuments ? "default" : "ghost"}
              >
                <FileSearch size={16} />
                <span>RAG</span>
              </PromptInputButton>
            )}
            <ModelSelector
              open={modelSelectorOpen}
              onOpenChange={setModelSelectorOpen}
            >
              <ModelSelectorTrigger asChild>
                <PromptInputButton disabled={isLoading}>
                  {(() => {
                    const provider = groupToProvider[selectedModel.group];
                    if (provider) {
                      return <ModelSelectorLogo provider={provider} />;
                    }
                    const icon = getGroupIcon(selectedModel.group);
                    if (icon) {
                      return (
                        <Image
                          src={icon}
                          alt=""
                          width={12}
                          height={12}
                          className="size-3 object-contain shrink-0"
                        />
                      );
                    }
                    return null;
                  })()}
                  <ModelSelectorName>
                    {selectedModel.displayName}
                  </ModelSelectorName>
                </PromptInputButton>
              </ModelSelectorTrigger>
              <ModelSelectorContent>
                <ModelSelectorInput placeholder="Search models..." />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  {Object.entries(groupedModels).map(([group, models]) => (
                    <ModelSelectorGroup heading={group} key={group}>
                      {models.map((model) => (
                        <ModelSelectorItem
                          key={model.name}
                          value={model.name}
                          onSelect={() => handleModelSelect(model)}
                        >
                          {groupToProvider[group] ? (
                            <ModelSelectorLogo
                              provider={groupToProvider[group]!}
                            />
                          ) : (
                            getGroupIcon(group) && (
                              <Image
                                src={getGroupIcon(group)!}
                                alt={`${group} Logo`}
                                width={12}
                                height={12}
                                className="size-3 object-contain shrink-0"
                              />
                            )
                          )}
                          <ModelSelectorName>
                            {model.displayName}
                          </ModelSelectorName>
                          {model.badge && (
                            <Badge className="ml-auto">{model.badge}</Badge>
                          )}
                          {model.vision && (
                            <Badge className="ml-1">Vision</Badge>
                          )}
                          {selectedModel.name === model.name && (
                            <CheckIcon className="ml-auto size-4" />
                          )}
                        </ModelSelectorItem>
                      ))}
                    </ModelSelectorGroup>
                  ))}
                </ModelSelectorList>
              </ModelSelectorContent>
            </ModelSelector>
          </PromptInputTools>
          <PromptInputSubmit
            status={status}
            onStop={stop}
            disabled={!input.trim() && status === "ready"}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
