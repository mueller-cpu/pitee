"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: ReactNode;
}

export default function Header({ title, showBack, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-40",
        "flex items-center justify-between",
        "h-14 px-4",
        "bg-background border-b border-border"
      )}
    >
      <div className="flex items-center gap-2 min-w-[48px]">
        {showBack && (
          <button
            onClick={() => router.back()}
            className={cn(
              "flex items-center justify-center",
              "h-12 w-12 -ml-2",
              "rounded-full",
              "text-primary",
              "active:bg-muted transition-colors"
            )}
            aria-label="Zurück"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
      </div>

      <h1 className="text-[17px] font-semibold tracking-tight text-foreground absolute left-1/2 -translate-x-1/2">
        {title}
      </h1>

      <div className="flex items-center min-w-[48px] justify-end">
        {rightAction}
      </div>
    </header>
  );
}
