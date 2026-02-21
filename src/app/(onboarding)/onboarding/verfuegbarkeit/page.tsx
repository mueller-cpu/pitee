"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "onboarding-data";

const TAGE_OPTIONS = [2, 3, 4, 5, 6] as const;

const EMPFEHLUNGEN: Record<number, string> = {
  2: "Ideal für den Einstieg. Ganzkörper-Training.",
  3: "Optimale Balance. Empfohlen für die meisten.",
  4: "Oberkörper/Unterkörper Split.",
  5: "Für Erfahrene. Push/Pull/Beine Split.",
  6: "Für Erfahrene. Push/Pull/Beine Split.",
};

export default function VerfuegbarkeitPage() {
  const router = useRouter();
  const [trainingstagePW, setTrainingstagePW] = useState<number>(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.trainingstagePW) setTrainingstagePW(data.trainingstagePW);
      }
    } catch {}
  }, []);

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.trainingstagePW = trainingstagePW;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/zusammenfassung");
  };

  return (
    <OnboardingLayout
      schritt={6}
      titel="Trainingstage"
      beschreibung="An wie vielen Tagen pro Woche möchtest du trainieren?"
      zurueckUrl="/onboarding/erfahrung"
      onWeiter={handleWeiter}
      weiterDisabled={trainingstagePW === 0}
    >
      {/* Day selector */}
      <div className="flex justify-center gap-3">
        {TAGE_OPTIONS.map((tage) => {
          const isSelected = trainingstagePW === tage;
          return (
            <button
              key={tage}
              type="button"
              onClick={() => setTrainingstagePW(tage)}
              className={cn(
                "flex items-center justify-center rounded-full transition-all",
                "w-16 h-16 text-lg font-bold",
                "min-w-[48px] min-h-[48px]",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : "border-2 border-border bg-background text-foreground hover:bg-accent/50"
              )}
            >
              {tage}
            </button>
          );
        })}
      </div>

      {/* Label */}
      <p className="text-center text-sm text-muted-foreground -mt-2">
        Tage pro Woche
      </p>

      {/* Recommendation */}
      {trainingstagePW > 0 && (
        <div className="bg-secondary/50 rounded-xl p-4 text-center">
          <p className="text-base font-medium text-foreground">
            {EMPFEHLUNGEN[trainingstagePW]}
          </p>
        </div>
      )}

      {/* Science snippet */}
      <WissenschaftSnippet titel="Was sagt die Forschung?">
        Die Forschung zeigt, dass 2-3 Trainingseinheiten pro Muskelgruppe pro
        Woche optimal für Muskelwachstum sind. Bei 3 Tagen pro Woche erreichst
        du das mit einem Ganzkörperplan.
      </WissenschaftSnippet>
    </OnboardingLayout>
  );
}
