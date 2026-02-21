"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VorherSatzData {
  gewicht: number | null;
  wiederholungen: number | null;
  rir: number | null;
}

export interface SatzErgebnis {
  satzNummer: number;
  gewicht: number;
  wiederholungen: number;
  rir: number;
}

interface SatzLoggerProps {
  satzNummer: number;
  zielGewicht: number | null;
  zielReps: string;
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
  einheit,
  vorherWert,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  schritt: number;
  min: number;
  max: number;
  einheit?: string;
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
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        {vorherWert != null && (
          <span className="text-xs text-muted-foreground">
            Letztes Mal: {vorherWert}{einheit ? ` ${einheit}` : ""}
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
          <Minus className="h-5 w-5" />
        </button>

        <div className="flex-1 flex items-center justify-center h-12 rounded-xl border border-border bg-background">
          <span className="text-xl font-semibold tabular-nums">
            {schritt < 1 ? value.toFixed(1) : value}
          </span>
          {einheit && (
            <span className="text-sm text-muted-foreground ml-1">
              {einheit}
            </span>
          )}
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
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function SatzLogger({
  satzNummer,
  zielGewicht,
  zielReps,
  zielRIR,
  vorherSatz,
  onSave,
}: SatzLoggerProps) {
  // Parse target reps (could be "8-12" or "10")
  const targetReps = parseInt(zielReps.split("-").pop() || "10", 10);

  const [gewicht, setGewicht] = useState<number>(
    vorherSatz?.gewicht ?? zielGewicht ?? 20
  );
  const [wiederholungen, setWiederholungen] = useState<number>(
    vorherSatz?.wiederholungen ?? targetReps
  );
  const [rir, setRir] = useState<number>(
    zielRIR
  );

  const handleSave = useCallback(() => {
    onSave({
      satzNummer,
      gewicht,
      wiederholungen,
      rir,
    });
  }, [satzNummer, gewicht, wiederholungen, rir, onSave]);

  // Progressive overload hint
  const showOverloadHint =
    vorherSatz?.gewicht != null &&
    vorherSatz?.wiederholungen != null &&
    vorherSatz.rir != null &&
    vorherSatz.rir <= 1;

  const suggestedWeight =
    vorherSatz?.gewicht != null
      ? Math.round((vorherSatz.gewicht + 2.5) * 2) / 2 // round to 2.5 increments
      : null;

  return (
    <Card className="py-0 overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Satz {satzNummer}
          </h3>
          <span className="text-sm text-muted-foreground">
            Ziel: {zielReps} Wdh &middot; RIR {zielRIR}
          </span>
        </div>

        {/* Progressive overload hint */}
        {showOverloadHint && suggestedWeight && (
          <div className="flex items-start gap-2.5 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 p-3">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">
              Letztes Mal: {vorherSatz!.gewicht}kg x {vorherSatz!.wiederholungen}.
              Versuch {suggestedWeight}kg!
            </p>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <StepperInput
            label="Gewicht"
            value={gewicht}
            onChange={setGewicht}
            schritt={2.5}
            min={0}
            max={500}
            einheit="kg"
            vorherWert={vorherSatz?.gewicht}
          />
          <StepperInput
            label="Wiederholungen"
            value={wiederholungen}
            onChange={setWiederholungen}
            schritt={1}
            min={0}
            max={100}
            vorherWert={vorherSatz?.wiederholungen}
          />
          <StepperInput
            label="RIR"
            value={rir}
            onChange={setRir}
            schritt={1}
            min={0}
            max={10}
            vorherWert={vorherSatz?.rir}
          />
        </div>

        {/* Save button */}
        <Button
          size="lg"
          className="w-full rounded-xl h-14 text-base font-semibold"
          onClick={handleSave}
        >
          Satz speichern
        </Button>
      </CardContent>
    </Card>
  );
}
