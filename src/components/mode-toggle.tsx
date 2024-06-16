"use client";

import * as React from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="justify-start">
          {theme === "light" && (
            <div className="flex justify-between w-full scale-100 dark:scale-0">
              <p>Light mode</p>
              <ChevronDownIcon className="w-5 h-5" />
            </div>
          )}
          {theme === "dark" && (
            <div className=" flex justify-between w-full scale-0 dark:scale-100">
              <p>Dark mode</p>
              <ChevronDownIcon className="w-5 h-5" />
            </div>
          )}
          {theme === "system" && (
            <div className="flex justify-between w-full">
              <p>System</p>
              <ChevronDownIcon className="w-5 h-5" />
            </div>
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark mode
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System Sync
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
