"use client";

import { ReactNode, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface WissenschaftSnippetProps {
  titel: string;
  children: ReactNode;
}

export default function WissenschaftSnippet({
  titel,
  children,
}: WissenschaftSnippetProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-secondary/50 rounded-xl p-3">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-2 w-full text-left",
          "min-h-[48px] text-muted-foreground"
        )}
        aria-expanded={open}
      >
        <Info className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">{titel}</span>
      </button>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-2 text-sm text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
