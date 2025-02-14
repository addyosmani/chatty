"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Sidebar } from "../sidebar";
import useChatStore from "@/hooks/useChatStore";
import { Models, Model, modelDetailsList } from "@/lib/models";
import { Badge } from "../ui/badge";
import Image from "next/image";

interface ChatTopbarProps {
  chatId?: string;
  stop: () => void;
}

export default function ChatTopbar({ chatId, stop }: ChatTopbarProps) {
  const [open, setOpen] = React.useState(false);

  // Zustand store
  const selectedModel = useChatStore((state) => state.selectedModel);
  const setSelectedModel = useChatStore((state) => state.setSelectedModel);
  const isLoading = useChatStore((state) => state.isLoading);

  const groupedModels = React.useMemo(() => {
    return Models.reduce((acc, model) => {
      if (!acc[model.group]) {
        acc[model.group] = [];
      }
      acc[model.group].push(model);
      return acc;
    }, {} as Record<string, Model[]>);
  }, []);

  const getGroupIcon = (group: string) => {
    const details = modelDetailsList.find((m) => m.group === group);
    return details?.icon;
  };

  return (
    <div className="w-full flex px-4 py-6  items-center justify-between lg:justify-center ">
      <Sheet>
        <SheetTrigger role="presentation" aria-label="Sidebar chat menu">
          <HamburgerMenuIcon className="md:hidden w-5 h-5" />
        </SheetTrigger>
        <SheetContent side="left">
          <Sidebar chatId={chatId || ""} isCollapsed={false} stop={stop} />
        </SheetContent>
      </Sheet>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            disabled={isLoading}
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className="w-[180px] md:w-[300px] justify-between bg-accent dark:bg-card"
            aria-label="Open model dropdown"
          >
            <div className="flex gap-2 items-center truncate">
              <p className="truncate">{selectedModel.displayName}</p>
              {selectedModel.badge && <Badge>{selectedModel.badge}</Badge>}
              {selectedModel.vision && <Badge>Vision</Badge>}
            </div>
            <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] md:w-[300px] max-h-96 overflow-y-scroll p-1">
          {Object.entries(groupedModels).map(([group, models]) => (
            <div key={group}>
              <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground flex items-center gap-2">
                {getGroupIcon(group) && (
                  <Image
                    src={getGroupIcon(group)!}
                    alt={`${group} Logo`}
                    width={16}
                    height={16}
                    className="object-contain shrink-0"
                  />
                )}
                {group}
              </div>
              {models.map((model) => (
                <Button
                  key={model.name}
                  variant="ghost"
                  className="w-full justify-start flex gap-2 items-center truncate"
                  aria-label="Open popup"
                  role="button"
                  onClick={() => {
                    setSelectedModel(model);
                    setOpen(false);
                  }}
                >
                  {model.displayName}
                  {model.badge && <Badge>{model.badge}</Badge>}
                  {model.vision && <Badge>Vision</Badge>}
                </Button>
              ))}
            </div>
          ))}
        </PopoverContent>
      </Popover>
      <div></div>
    </div>
  );
}
