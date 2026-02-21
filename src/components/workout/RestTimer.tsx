"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  dauer: number; // seconds
  onComplete: () => void;
}

export default function RestTimer({ dauer, onComplete }: RestTimerProps) {
  const [verbleibend, setVerbleibend] = useState(dauer);
  const [fertig, setFertig] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (fertig) return;

    const interval = setInterval(() => {
      setVerbleibend((prev) => {
        if (prev <= 1) {
          setFertig(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [fertig]);

  const handleSkip = useCallback(() => {
    onCompleteRef.current();
  }, []);

  const handleWeiter = useCallback(() => {
    onCompleteRef.current();
  }, []);

  // Circle SVG values
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = dauer > 0 ? verbleibend / dauer : 0;
  const strokeOffset = circumference * (1 - progress);

  const minuten = Math.floor(verbleibend / 60);
  const sekunden = verbleibend % 60;
  const zeitAnzeige = `${minuten}:${sekunden.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-8">
      {/* Title */}
      <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {fertig ? "Pause vorbei" : "Pause"}
      </p>

      {/* Circular timer */}
      <div className="relative w-56 h-56">
        <svg
          className="w-full h-full -rotate-90"
          viewBox="0 0 200 200"
        >
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-linear",
              fertig ? "text-green-500" : "text-primary"
            )}
          />
        </svg>

        {/* Time display */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center",
            fertig && "animate-pulse"
          )}
        >
          <span
            className={cn(
              "text-5xl font-light tabular-nums tracking-tight",
              fertig && "text-green-500"
            )}
          >
            {zeitAnzeige}
          </span>
          {!fertig && (
            <span className="text-sm text-muted-foreground mt-1">
              verbleibend
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      {fertig ? (
        <Button
          size="lg"
          className="w-full max-w-xs rounded-xl h-14 text-base font-semibold"
          onClick={handleWeiter}
        >
          Weiter
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          className="h-12 text-base text-muted-foreground"
          onClick={handleSkip}
        >
          Überspringen
        </Button>
      )}
    </div>
  );
}
