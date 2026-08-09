"use client";

import { useState } from "react";
import { SettingsIcon, UserIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";

export function UserSettings() {
  const [open, setOpen] = useState(false);
  const userName = useAppStore((state) => state.userName);
  const setUserName = useAppStore((state) => state.setUserName);
  const customizedInstructions = useAppStore(
    (state) => state.customizedInstructions
  );
  const setCustomizedInstructions = useAppStore(
    (state) => state.setCustomizedInstructions
  );
  const isEnabled = useAppStore((state) => state.isCustomizedInstructionsEnabled);
  const setIsEnabled = useAppStore(
    (state) => state.setIsCustomizedInstructionsEnabled
  );

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button
          className="flex w-full justify-start gap-3"
          variant="ghost"
          aria-label="Open settings"
        >
          <UserIcon className="size-4 shrink-0" />
          <span className="truncate">{userName}</span>
          <SettingsIcon className="ml-auto size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Your name and instructions are stored locally in this browser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="user-name">Name</Label>
          <Input
            id="user-name"
            onChange={(event) => setUserName(event.target.value)}
            placeholder="Your name"
            value={userName}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="custom-instructions">Custom instructions</Label>
            <Switch
              aria-label="Enable custom instructions"
              checked={isEnabled}
              id="custom-instructions-enabled"
              onCheckedChange={setIsEnabled}
            />
          </div>
          <Textarea
            disabled={!isEnabled}
            id="custom-instructions"
            onChange={(event) => setCustomizedInstructions(event.target.value)}
            placeholder="What would you like the assistant to know about you?"
            rows={5}
            value={customizedInstructions}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
