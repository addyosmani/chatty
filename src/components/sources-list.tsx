"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import type { RetrievalResult } from "@/lib/rag";

interface SourcesListProps {
  results: RetrievalResult[];
}

export default function SourcesList({ results }: SourcesListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (results.length === 0) return null;

  // Deduplicate by documentId, keeping the highest similarity
  const uniqueDocs = results.reduce<
    Map<string, RetrievalResult>
  >((acc, r) => {
    const existing = acc.get(r.documentId);
    if (!existing || r.similarity > existing.similarity) {
      acc.set(r.documentId, r);
    }
    return acc;
  }, new Map());

  return (
    <div className="mt-2 text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        <span className="font-medium">
          Used {results.length} source{results.length !== 1 ? "s" : ""} from{" "}
          {uniqueDocs.size} document{uniqueDocs.size !== 1 ? "s" : ""}
        </span>
      </button>

      {isOpen && (
        <div className="mt-2 flex flex-col gap-1.5 pl-5">
          {results.map((result, index) => (
            <div key={`${result.documentId}-${result.chunkIndex}`}>
              <button
                onClick={() =>
                  setExpandedIndex(expandedIndex === index ? null : index)
                }
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors w-full text-left"
              >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{result.fileName}</span>
                <span className="ml-auto shrink-0 text-muted-foreground/70">
                  {(result.similarity * 100).toFixed(0)}% match
                </span>
              </button>

              {expandedIndex === index && (
                <div className="mt-1 ml-5 rounded border bg-muted/50 p-2">
                  <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed line-clamp-6">
                    {result.content}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
