"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dumbbell, Timer, Heart, ArrowDown, RotateCcw } from "lucide-react";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";

const TESTS = [
  {
    nr: 1,
    name: "Bankdrücken",
    kategorie: "Oberkörper Push",
    icon: Dumbbell,
  },
  {
    nr: 2,
    name: "Kniebeuge",
    kategorie: "Unterkörper",
    icon: ArrowDown,
  },
  {
    nr: 3,
    name: "Rudern / Latzug",
    kategorie: "Oberkörper Pull",
    icon: RotateCcw,
  },
  {
    nr: 4,
    name: "Plank",
    kategorie: "Core – Dauer",
    icon: Timer,
  },
  {
    nr: 5,
    name: "Cardio",
    kategorie: "Ruderergometer / Laufband",
    icon: Heart,
  },
];

export default function FitnesstestIntroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center justify-center h-14">
            <span className="text-sm font-medium text-muted-foreground">
              Fitnesstest
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Initialer Fitnesstest
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Mit 5 einfachen Tests ermitteln wir dein aktuelles Fitnesslevel. So
            können wir deinen Trainingsplan optimal anpassen.
          </p>
        </div>

        {/* Test-Liste */}
        <div className="space-y-3 mb-8">
          {TESTS.map((test) => {
            const Icon = test.icon;
            return (
              <div
                key={test.nr}
                className="flex items-center gap-4 rounded-2xl border bg-card p-4 min-h-[64px]"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold leading-tight">
                    {test.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {test.kategorie}
                  </p>
                </div>
                <span className="text-sm font-medium text-muted-foreground tabular-nums">
                  {test.nr}/5
                </span>
              </div>
            );
          })}
        </div>

        {/* Hinweis */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          Du kannst Tests überspringen, die nicht möglich sind.
        </p>

        {/* Wissenschaft-Snippet */}
        <WissenschaftSnippet titel="Wie berechnen wir dein Kraftniveau?">
          Der geschätzte 1RM (One-Rep-Max) wird mit der Epley-Formel berechnet:
          1RM = Gewicht × (1 + Reps ÷ 30). So können wir dein Kraftniveau
          einschätzen, ohne dass du maximale Gewichte bewegen musst.
        </WissenschaftSnippet>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Button
            onClick={() => router.push("/fitnesstest/test/1")}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            size="lg"
          >
            Test starten
          </Button>
        </div>
      </div>
    </div>
  );
}
