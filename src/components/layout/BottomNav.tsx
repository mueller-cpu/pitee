"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  TrendingUp,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Training", icon: Dumbbell, path: "/training" },
  { label: "Ernährung", icon: UtensilsCrossed, path: "/ernaehrung" },
  { label: "Fortschritt", icon: TrendingUp, path: "/fortschritt" },
  { label: "Profil", icon: User, path: "/profil" },
] as const;

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-background/80 backdrop-blur-xl border-t border-border/50",
        "pb-[max(env(safe-area-inset-bottom),24px)] pt-2"
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
                "min-h-[48px] min-w-[48px] px-2 py-1",
                "text-muted-foreground transition-all duration-200",
                isActive && "text-primary"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                  isActive && "bg-primary/15"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-tight tracking-wide",
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

