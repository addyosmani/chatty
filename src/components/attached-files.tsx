import { Cross2Icon, FileTextIcon } from "@radix-ui/react-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Document } from "@langchain/core/documents";

interface AttachedFileProps {
  files: File[];
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setFiles: (files: File[] | undefined) => void
  setFileText: (text: Document<Record<string, any>>[] | null) => void;
}

export default function AttachedFiles({ files, open, setOpen, setFiles, setFileText }: AttachedFileProps) {
  return (
    <div className="ml-6 -mt-2 relative w-fit max-w-full top-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <div className="px-2 py-1.5 h-11 bg-muted-foreground/20 flex w-fit flex-col truncate gap-2 p-1 border-t border-x rounded-tl-md rounded-tr-md">
          <div className="flex text-sm">
            {files.map((file) => (
              <div key={file.name} className="flex items-center gap-1.5">
                <FileTextIcon className="w-4 h-4" />
                <span>{file.name}</span>
              </div>
            ))}
          </div>
        </div>
        <DialogTrigger className="absolute -top-1.5 -right-1.5 text-white cursor-pointer bg-red-500 hover:bg-red-600 w-4 h-4 rounded-full flex items-center justify-center">
          <Cross2Icon className="w-3 h-3" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            This will remove the file from the context and you will no
            longer be able to ask questions about it.
          </DialogDescription>
          <div className="flex w-full gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                setFiles(undefined);
                setFileText(null);
                setOpen(false);
              }}
            >
              Remove
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}