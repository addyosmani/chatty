"use client";

import React, { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sidebar } from "../sidebar";
import { Message } from "ai/react";
import { getSelectedModel } from "@/lib/model-helper";

interface ChatTopbarProps {
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  chatId?: string;
  messages: Message[];
}

export default function ChatTopbar({
  setSelectedModel,
  isLoading,
  chatId,
  messages,
}: ChatTopbarProps) {
  const [models, setModels] = React.useState<string[]>(["Browser Model", "REST API", "gemma:2b"]);
  const [open, setOpen] = React.useState(false);
  const [currentModel, setCurrentModel] = React.useState<string>();

  useEffect(() => {
    setCurrentModel(getSelectedModel());

    const env = process.env.NODE_ENV;

    const fetchModels = async () => {
      if (env === "production") {
        const fetchedModels = await fetch("http://localhost:11434/api/tags");
        const json = await fetchedModels.json();
        const apiModels = json.models.map((model) => model.name);
        setModels(["Browser Model", "REST API", ...apiModels]);
      } 
      else {
        const fetchedModels = await fetch("/api/tags") 
        const json = await fetchedModels.json();
        console.log(json);
        const apiModels = json.models.map(model => model.name); // Extracting only the "name" property from each model object
        setModels(["Browser Model", "REST API", ...apiModels]);
    }
    }
    fetchModels();
  }, []);

  const handleModelChange = (model: string) => {
    setCurrentModel(model);
    setSelectedModel(model);
    if (typeof window !== 'undefined') {
      localStorage.setItem("selectedModel", model);
    }
    setOpen(false);
  };

  return (
    <div className="w-full flex px-4 py-6 items-center justify-between lg:justify-center ">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[170px] justify-between"
          >
            {currentModel || "Select model"}
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[170px] p-1">
          {models.map((model) => (
            <Button
              key={model}
              variant="ghost"
              className="w-full"
              onClick={() => handleModelChange(model)}
            >
              {model}
            </Button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
