"use client";

import { AlertTriangle, Settings, HelpCircle, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionsProps {
  onAction: (text: string) => void;
}

const actions = [
  {
    label: "Schmerzen melden",
    icon: AlertTriangle,
    text: "Ich habe Schmerzen in...",
  },
  {
    label: "Plan ändern",
    icon: Settings,
    text: "Ich möchte meinen Trainingsplan anpassen...",
  },
  {
    label: "Frage stellen",
    icon: HelpCircle,
    text: "",
  },
  {
    label: "Motivation",
    icon: Flame,
    text: "Ich brauche etwas Motivation...",
  },
];

export default function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 px-4 scrollbar-none">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => onAction(action.text)}
            className={cn(
              "flex items-center gap-1.5",
              "whitespace-nowrap",
              "min-h-[44px] px-4 py-2",
              "rounded-full",
              "bg-secondary text-secondary-foreground",
              "text-sm font-medium",
              "border border-border",
              "active:scale-95 transition-transform",
              "hover:bg-secondary/80"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
