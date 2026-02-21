"use client";

import { cn } from "@/lib/utils";

interface MakroBalkenProps {
  label: string;
  aktuell: number;
  ziel: number;
  einheit: "g" | "kcal";
  farbe: "blue" | "amber" | "red" | "green";
}

const farbKlassen: Record<MakroBalkenProps["farbe"], { bar: string; bg: string; text: string }> = {
  blue: {
    bar: "bg-blue-500 dark:bg-blue-400",
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    bar: "bg-amber-500 dark:bg-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-600 dark:text-amber-400",
  },
  red: {
    bar: "bg-red-500 dark:bg-red-400",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-600 dark:text-red-400",
  },
  green: {
    bar: "bg-green-500 dark:bg-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-600 dark:text-green-400",
  },
};

export default function MakroBalken({
  label,
  aktuell,
  ziel,
  einheit,
  farbe,
}: MakroBalkenProps) {
  const prozent = ziel > 0 ? Math.min((aktuell / ziel) * 100, 100) : 0;
  const klassen = farbKlassen[farbe];

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={cn("text-sm font-semibold tabular-nums", klassen.text)}>
          {Math.round(aktuell)}{einheit}
          <span className="text-muted-foreground font-normal"> / {Math.round(ziel)}{einheit}</span>
        </span>
      </div>
      <div className={cn("h-2 w-full rounded-full overflow-hidden", klassen.bg)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500 ease-out", klassen.bar)}
          style={{ width: `${prozent}%` }}
        />
      </div>
    </div>
  );
}
