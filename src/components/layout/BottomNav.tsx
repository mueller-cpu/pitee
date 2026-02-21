"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Training", icon: Dumbbell, path: "/training" },
  { label: "Ernährung", icon: UtensilsCrossed, path: "/ernaehrung" },
  { label: "Fortschritt", icon: TrendingUp, path: "/fortschritt" },
  { label: "Coach", icon: MessageCircle, path: "/coach" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background border-t border-border",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map(({ label, icon: Icon, path }) => {
          const isActive =
            pathname === path || pathname?.startsWith(`${path}/`);

          return (
            <Link
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1",
                "min-h-[48px] min-w-[48px] px-2 py-2",
                "text-muted-foreground transition-colors",
                isActive && "text-primary"
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span
                className={cn(
                  "text-[11px] leading-tight",
                  isActive ? "font-semibold" : "font-medium"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
