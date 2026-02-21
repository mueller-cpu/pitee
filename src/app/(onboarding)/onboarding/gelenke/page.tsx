"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "onboarding-data";

const GELENKE = [
  { id: "schulter", label: "Schulter", icon: "🦴" },
  { id: "ellbogen", label: "Ellbogen", icon: "💪" },
  { id: "handgelenk", label: "Handgelenk", icon: "✋" },
  { id: "ruecken", label: "Rücken (Unterer Rücken)", icon: "🔙" },
  { id: "huefte", label: "Hüfte", icon: "🦿" },
  { id: "knie", label: "Knie", icon: "🦵" },
] as const;

type Seite = "links" | "rechts" | "beide";
type Schwere = 1 | 2 | 3;

interface GelenkProblem {
  gelenk: string;
  seite: Seite;
  schwere: Schwere;
}

interface ToggleGroupProps {
  options: { value: string; label: string }[];
  selected: string;
  onChange: (value: string) => void;
}

function ToggleGroup({ options, selected, onChange }: ToggleGroupProps) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-xl py-3 px-2 text-sm font-medium transition-all border",
            "min-h-[48px]",
            selected === opt.value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:bg-accent/50 text-foreground"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function GelenkePage() {
  const router = useRouter();
  const [probleme, setProbleme] = useState<Map<string, GelenkProblem>>(
    new Map()
  );
  const [keineProbleme, setKeineProbleme] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.gelenkProbleme && Array.isArray(data.gelenkProbleme)) {
          const map = new Map<string, GelenkProblem>();
          data.gelenkProbleme.forEach((p: GelenkProblem) => {
            map.set(p.gelenk, p);
          });
          setProbleme(map);
          setKeineProbleme(false);
        } else if (
          data.gelenkProbleme !== undefined &&
          data.gelenkProbleme.length === 0
        ) {
          setKeineProbleme(true);
        }
      }
    } catch {}
  }, []);

  const toggleGelenk = (gelenkId: string) => {
    setKeineProbleme(false);
    setProbleme((prev) => {
      const next = new Map(prev);
      if (next.has(gelenkId)) {
        next.delete(gelenkId);
      } else {
        next.set(gelenkId, {
          gelenk: gelenkId,
          seite: "beide",
          schwere: 1,
        });
      }
      return next;
    });
  };

  const updateSeite = (gelenkId: string, seite: Seite) => {
    setProbleme((prev) => {
      const next = new Map(prev);
      const current = next.get(gelenkId);
      if (current) {
        next.set(gelenkId, { ...current, seite });
      }
      return next;
    });
  };

  const updateSchwere = (gelenkId: string, schwere: Schwere) => {
    setProbleme((prev) => {
      const next = new Map(prev);
      const current = next.get(gelenkId);
      if (current) {
        next.set(gelenkId, { ...current, schwere });
      }
      return next;
    });
  };

  const handleKeineProbleme = () => {
    setKeineProbleme(true);
    setProbleme(new Map());
  };

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.gelenkProbleme = keineProbleme ? [] : Array.from(probleme.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/erfahrung");
  };

  return (
    <OnboardingLayout
      schritt={4}
      titel="Gelenkprobleme"
      beschreibung="Markiere Gelenke, die Probleme bereiten. Wir passen dein Training entsprechend an."
      zurueckUrl="/onboarding/gesundheit"
      onWeiter={handleWeiter}
    >
      <div className="grid grid-cols-2 gap-3">
        {GELENKE.map((gelenk) => {
          const isSelected = probleme.has(gelenk.id);
          const problem = probleme.get(gelenk.id);

          return (
            <div key={gelenk.id} className="space-y-2">
              <button
                type="button"
                onClick={() => toggleGelenk(gelenk.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 transition-all",
                  "min-h-[80px] flex flex-col items-center justify-center gap-2",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary"
                    : "border-border bg-background hover:bg-accent/50"
                )}
              >
                <span className="text-2xl">{gelenk.icon}</span>
                <span
                  className={cn(
                    "text-sm font-medium text-center leading-tight",
                    isSelected ? "text-primary" : "text-foreground"
                  )}
                >
                  {gelenk.label}
                </span>
              </button>

              {isSelected && problem && (
                <div className="space-y-2 px-1">
                  <ToggleGroup
                    options={[
                      { value: "links", label: "Links" },
                      { value: "rechts", label: "Rechts" },
                      { value: "beide", label: "Beide" },
                    ]}
                    selected={problem.seite}
                    onChange={(v) => updateSeite(gelenk.id, v as Seite)}
                  />
                  <ToggleGroup
                    options={[
                      { value: "1", label: "1 Leicht" },
                      { value: "2", label: "2 Mittel" },
                      { value: "3", label: "3 Schwer" },
                    ]}
                    selected={String(problem.schwere)}
                    onChange={(v) =>
                      updateSchwere(gelenk.id, parseInt(v) as Schwere)
                    }
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleKeineProbleme}
        className={cn(
          "w-full rounded-2xl border p-5 transition-all text-base font-medium",
          "min-h-[60px]",
          keineProbleme
            ? "border-primary bg-primary/5 ring-2 ring-primary text-primary"
            : "border-border bg-background hover:bg-accent/50 text-foreground"
        )}
      >
        Keine Probleme
      </button>
    </OnboardingLayout>
  );
}
