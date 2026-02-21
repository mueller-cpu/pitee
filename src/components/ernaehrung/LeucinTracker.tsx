"use client";

import { cn } from "@/lib/utils";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";

interface LeucinTrackerProps {
  leucinG: number;
  zielG?: number;
}

export default function LeucinTracker({ leucinG, zielG = 3.4 }: LeucinTrackerProps) {
  const prozent = zielG > 0 ? Math.min((leucinG / zielG) * 100, 100) : 0;
  const istAusreichend = leucinG >= 2.5;

  // SVG circle parameters
  const size = 96;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (prozent / 100) * circumference;

  const farbe = istAusreichend
    ? { ring: "stroke-green-500 dark:stroke-green-400", text: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-950/20" }
    : { ring: "stroke-amber-500 dark:stroke-amber-400", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20" };

  return (
    <div className="space-y-3">
      <div className={cn("rounded-xl p-4", farbe.bg)}>
        <div className="flex items-center gap-4">
          {/* Circular progress indicator */}
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={cn("transition-all duration-700 ease-out", farbe.ring)}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-lg font-bold tabular-nums leading-none", farbe.text)}>
                {leucinG.toFixed(1)}g
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                Leucin
              </span>
            </div>
          </div>

          {/* Label text */}
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-semibold", farbe.text)}>
              {istAusreichend
                ? "Leucin-Schwelle erreicht"
                : "Leucin-Schwelle nicht erreicht"}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {zielG}g = 110% maximale Muskelproteinsynthese
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ziel: {"\u2265"} 2.5g pro Mahlzeit
            </p>
          </div>
        </div>
      </div>

      <WissenschaftSnippet titel="Warum ist Leucin so wichtig?">
        Leucin ist die wichtigste Aminosäure für den Muskelaufbau. 3.4g Leucin
        pro Mahlzeit stimuliert die Muskelproteinsynthese um 110%. Gute Quellen:
        Whey (11%), Eier (8.5%), Huhn (7.5%), Rind (8%).
      </WissenschaftSnippet>
    </div>
  );
}
