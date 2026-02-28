"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VorherSatzData {
  dauer: number | null; // in seconds
}

export interface SatzErgebnis {
  satzNummer: number;
  dauer: number; // in seconds
  rir: number;
}

interface TimerLoggerProps {
  satzNummer: number;
  zielRIR: number;
  vorherSatz: VorherSatzData | null;
  onSave: (ergebnis: SatzErgebnis) => void;
}

function StepperInput({
  label,
  value,
  onChange,
  schritt,
  min,
  max,
  vorherWert,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  schritt: number;
  min: number;
  max: number;
  vorherWert?: number | null;
}) {
  const decrement = useCallback(() => {
    onChange(Math.max(min, value - schritt));
  }, [value, schritt, min, onChange]);

  const increment = useCallback(() => {
    onChange(Math.min(max, value + schritt));
  }, [value, schritt, max, onChange]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {vorherWert != null && (
          <span className="text-xs text-muted-foreground">
            Letztes Mal: {vorherWert}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={decrement}
          disabled={value <= min}
          className={cn(
            "flex items-center justify-center",
            "h-12 w-12 shrink-0",
            "rounded-xl border border-border bg-secondary/50",
            "text-foreground",
            "active:bg-secondary transition-colors",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
          aria-label={`${label} verringern`}
        >
          <span className="text-xl font-bold">−</span>
        </button>

        <div className="flex-1 flex items-center justify-center h-12 rounded-xl border border-border bg-background">
          <span className="text-xl font-semibold tabular-nums">{value}</span>
        </div>

        <button
          type="button"
          onClick={increment}
          disabled={value >= max}
          className={cn(
            "flex items-center justify-center",
            "h-12 w-12 shrink-0",
            "rounded-xl border border-border bg-secondary/50",
            "text-foreground",
            "active:bg-secondary transition-colors",
            "disabled:opacity-30 disabled:pointer-events-none"
          )}
          aria-label={`${label} erhöhen`}
        >
          <span className="text-xl font-bold">+</span>
        </button>
      </div>
    </div>
  );
}

export default function TimerLogger({
  satzNummer,
  zielRIR,
  vorherSatz,
  onSave,
}: TimerLoggerProps) {
  const [dauer, setDauer] = useState<number>(0); // seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [rir, setRir] = useState<number>(zielRIR);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setDauer((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleToggle = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setDauer(0);
  }, []);

  const handleSave = useCallback(() => {
    if (dauer === 0) return;
    onSave({
      satzNummer,
      dauer,
      rir,
    });
  }, [satzNummer, dauer, rir, onSave]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="py-0 overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Satz {satzNummer}</h3>
          <span className="text-sm text-muted-foreground">
            Ziel: Maximale Dauer &middot; RIR {zielRIR}
          </span>
        </div>

        {/* Previous time hint */}
        {vorherSatz?.dauer != null && (
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 p-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-xl shrink-0">schedule</span>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Letztes Mal: {formatTime(vorherSatz.dauer)}. Versuche länger zu halten!
            </p>
          </div>
        )}

        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center py-8 space-y-6">
          <div className="text-7xl font-bold tabular-nums text-primary">
            {formatTime(dauer)}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={handleReset}
              disabled={dauer === 0}
              className="rounded-xl h-12 w-12 p-0"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>

            <Button
              type="button"
              size="lg"
              onClick={handleToggle}
              className={cn(
                "rounded-xl h-14 px-8 text-base font-semibold",
                isRunning ? "bg-orange-500 hover:bg-orange-600" : "bg-green-600 hover:bg-green-700"
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  {dauer === 0 ? "Start" : "Fortsetzen"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* RIR Input */}
        <StepperInput
          label="RIR (Wie viel Reserve?)"
          value={rir}
          onChange={setRir}
          schritt={1}
          min={0}
          max={10}
          vorherWert={vorherSatz?.dauer != null ? zielRIR : null}
        />

        {/* Save button */}
        <Button
          size="lg"
          className="w-full rounded-xl h-14 text-base font-semibold"
          onClick={handleSave}
          disabled={dauer === 0}
        >
          Satz speichern
        </Button>
      </CardContent>
    </Card>
  );
}
