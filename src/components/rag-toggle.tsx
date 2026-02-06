"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useDocumentStore, useHasDocuments } from "@/hooks/useDocumentStore";
import { FileSearch } from "lucide-react";

export default function RagToggle() {
  const hasDocuments = useHasDocuments();
  const searchInDocuments = useDocumentStore((state) => state.searchInDocuments);
  const setSearchInDocuments = useDocumentStore(
    (state) => state.setSearchInDocuments
  );

  if (!hasDocuments) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 px-2">
      <Checkbox
        id="rag-toggle"
        checked={searchInDocuments}
        onCheckedChange={(checked) => setSearchInDocuments(!!checked)}
      />
      <label
        htmlFor="rag-toggle"
        className="text-sm text-muted-foreground cursor-pointer flex items-center gap-1"
      >
        <FileSearch className="w-4 h-4" />
        Search in documents
      </label>
    </div>
  );
}
