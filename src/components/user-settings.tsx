"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import UserSettingsDialog from "./user-settings-dialog";
import CustomMemoryDialog from "./custom-memory-dialog";
import useChatStore from "@/hooks/useChatStore";

export default function UserSettings() {
  const [openCustomMemoryDialog, setOpenCustomMemoryDialog] = useState(false);
  const [openUserSettingsDialog, setOpenUserSettingsDialog] = useState(false);

  const name = useChatStore((state) => state.userName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex justify-start gap-3 w-full h-14 text-base font-normal items-center  rounded-full"
        >
          <Avatar className="flex justify-start items-center overflow-hidden">
            <AvatarImage
              src=""
              alt="AI"
              width={4}
              height={4}
              className="object-contain"
            />
            <AvatarFallback>
              {name && name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="text-xs truncate">
            {name}
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2">
        <CustomMemoryDialog
          setOpen={setOpenCustomMemoryDialog}
          open={openCustomMemoryDialog}
        />
        <UserSettingsDialog
          setOpen={setOpenUserSettingsDialog}
          open={openUserSettingsDialog}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
