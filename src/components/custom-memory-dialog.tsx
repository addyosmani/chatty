"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import EditCustomMemoryForm from "./edit-custom-memory-form";
import { BookMarked } from "lucide-react";

interface CustomMemoryDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function CustomMemoryDialog({
  open,
  setOpen,
}: CustomMemoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="w-full">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            setOpen(true);
          }}
        >
          <div className="flex w-full gap-2 p-1 items-center cursor-pointer">
            <BookMarked className="w-4 h-4" />
            Customize Memory
          </div>
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader className="space-y-4">
          <DialogTitle className="mb-5">Customize Memory</DialogTitle>
          <EditCustomMemoryForm setOpen={setOpen} />
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
