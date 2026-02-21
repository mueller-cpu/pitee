"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { cn } from "@/lib/utils";
import { Dumbbell, TrendingDown, Heart, Zap } from "lucide-react";

const STORAGE_KEY = "onboarding-data";

const ERFAHRUNG_OPTIONS = [
  {
    value: "anfaenger",
    label: "Anfänger",
    description: "Weniger als 6 Monate Krafttraining",
  },
  {
    value: "fortgeschritten",
    label: "Fortgeschritten",
    description: "6 Monate bis 2 Jahre regelmäßig",
  },
  {
    value: "erfahren",
    label: "Erfahren",
    description: "Über 2 Jahre regelmäßiges Krafttraining",
  },
] as const;

const ZIEL_OPTIONS = [
  {
    value: "muskelaufbau",
    label: "Muskelaufbau",
    icon: Dumbbell,
  },
  {
    value: "fettabbau",
    label: "Fettabbau",
    icon: TrendingDown,
  },
  {
    value: "gesundheit",
    label: "Gesundheit",
    icon: Heart,
  },
  {
    value: "kraft",
    label: "Kraft steigern",
    icon: Zap,
  },
] as const;

export default function ErfahrungPage() {
  const router = useRouter();
  const [erfahrung, setErfahrung] = useState<string>("");
  const [hauptziel, setHauptziel] = useState<string>("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.erfahrung) setErfahrung(data.erfahrung);
        if (data.hauptziel) setHauptziel(data.hauptziel);
      }
    } catch {}
  }, []);

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.erfahrung = erfahrung;
    data.hauptziel = hauptziel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/verfuegbarkeit");
  };

  return (
    <OnboardingLayout
      schritt={5}
      titel="Trainingserfahrung"
      beschreibung="Hilft uns, die richtige Intensität für dich zu finden."
      zurueckUrl="/onboarding/gelenke"
      onWeiter={handleWeiter}
      weiterDisabled={!erfahrung || !hauptziel}
    >
      {/* Erfahrungslevel */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Erfahrungslevel</h2>
        <div className="space-y-3">
          {ERFAHRUNG_OPTIONS.map((option) => {
            const isSelected = erfahrung === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setErfahrung(option.value)}
                className={cn(
                  "w-full rounded-2xl border p-5 text-left transition-all",
                  "min-h-[72px]",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-background hover:bg-accent/50"
                )}
              >
                <span
                  className={cn(
                    "block text-base font-semibold",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {option.label}
                </span>
                <span className="block text-sm text-muted-foreground mt-1">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hauptziel */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Hauptziel</h2>
        <div className="grid grid-cols-2 gap-3">
          {ZIEL_OPTIONS.map((option) => {
            const isSelected = hauptziel === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setHauptziel(option.value)}
                className={cn(
                  "rounded-2xl border p-5 transition-all",
                  "min-h-[100px] flex flex-col items-center justify-center gap-3",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-background hover:bg-accent/50"
                )}
              >
                <Icon
                  className={cn(
                    "h-7 w-7",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-semibold text-center",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </OnboardingLayout>
  );
}
