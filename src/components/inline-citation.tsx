"use client";

import React, { type ComponentProps } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import type { RetrievalResult } from "@/lib/rag";

export const InlineCitation = ({
  className,
  ...props
}: ComponentProps<"span">) => (
  <span
    className={cn("inline items-center gap-1", className)}
    {...props}
  />
);

export const InlineCitationCard = (props: ComponentProps<typeof HoverCard>) => (
  <HoverCard closeDelay={0} openDelay={0} {...props} />
);

export const InlineCitationTrigger = React.forwardRef<
  HTMLSpanElement,
  ComponentProps<"span"> & { citationNumber: number }
>(({ citationNumber, className, ...props }, ref) => (
  <HoverCardTrigger asChild>
    <span
      ref={ref}
      className={cn(
        "ml-0.5 cursor-pointer rounded-full border border-transparent bg-secondary px-1.5 py-0 text-xs font-normal text-secondary-foreground hover:bg-secondary/80 inline-flex items-center",
        className
      )}
      {...props}
    >
      [{citationNumber}]
    </span>
  </HoverCardTrigger>
));
InlineCitationTrigger.displayName = "InlineCitationTrigger";

export const InlineCitationBody = ({
  className,
  ...props
}: ComponentProps<"div">) => (
  <HoverCardContent className={cn("w-80 p-0", className)} {...props} />
);

export const InlineCitationSource = ({
  result,
  className,
  ...props
}: ComponentProps<"div"> & { result: RetrievalResult }) => {
  return (
    <div className={cn("space-y-2 p-3", className)} {...props}>
      <div className="space-y-0.5">
        <h4 className="truncate font-medium text-sm leading-tight">
          {result.fileName}
        </h4>
      </div>
      <div className="max-h-[150px] overflow-y-auto rounded border bg-muted/50 p-2">
        <p className="whitespace-pre-wrap text-xs leading-relaxed">
          {result.content}
        </p>
      </div>
      <div className="text-muted-foreground text-xs">
        <span>Similarity: {(result.similarity * 100).toFixed(1)}%</span>
      </div>
    </div>
  );
};
