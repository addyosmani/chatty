"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { CardStackPlusIcon, GearIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { set } from "zod";
import UsernameForm from "./username-form";
import EditUsernameForm from "./edit-username-form";
import UserSettingsDialog from "./user-settings-dialog";
import CustomMemoryDialog from "./custom-memory-dialog";

export default function UserSettings() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openCustomMemoryDialog, setOpenCustomMemoryDialog] = useState(false);
  const [openUserSettingsDialog, setOpenUserSettingsDialog] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const username = localStorage.getItem("ollama_user");
      if (username) {
        setName(username);
        setIsLoading(false);
      }
    };

    const fetchData = () => {
      const username = localStorage.getItem("ollama_user");
      if (username) {
        setName(username);
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchData();

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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
            {isLoading ? (
              <Skeleton className="w-20 h-4" />
            ) : (
              name || "Anonymous"
            )}
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
