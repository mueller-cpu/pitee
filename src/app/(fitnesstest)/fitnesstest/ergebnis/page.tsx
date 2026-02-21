"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { berechne1RM, bestimmeFitnessLevel } from "@/lib/calculations";
import { toast } from "sonner";
import { ChevronLeft, Trophy } from "lucide-react";

const STORAGE_KEY = "fitnesstest-daten";
const ONBOARDING_KEY = "onboarding-data";

interface TestErgebnis {
  testNr: number;
  name: string;
  typ: "kraft" | "dauer";
  gewicht?: number;
  wiederholungen?: number;
  dauer?: number;
  rpe?: number;
  uebersprungen: boolean;
}

const UEBUNG_KEY_MAP: Record<string, string> = {
  "Bankdrücken": "bankdruecken",
  "Kniebeuge": "kniebeuge",
  "Rudern / Latzug": "rudern",
};

const LEVEL_CONFIG: Record<string, { label: string; farbe: string }> = {
  einsteiger: { label: "Einsteiger", farbe: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  grundlagen: { label: "Grundlagen", farbe: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" },
  mittel: { label: "Mittel", farbe: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" },
  fortgeschritten: { label: "Fortgeschritten", farbe: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" },
};

const LEVEL_ORDER = ["einsteiger", "grundlagen", "mittel", "fortgeschritten"];

function getMedianLevel(levels: string[]): string {
  if (levels.length === 0) return "einsteiger";
  const indices = levels.map((l) => LEVEL_ORDER.indexOf(l)).sort((a, b) => a - b);
  const mid = Math.floor(indices.length / 2);
  return LEVEL_ORDER[indices[mid]] || "einsteiger";
}

export default function FitnesstestErgebnisPage() {
  const router = useRouter();
  const [ergebnisse, setErgebnisse] = useState<TestErgebnis[]>([]);
  const [koerpergewicht, setKoerpergewicht] = useState<number>(80);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setErgebnisse(JSON.parse(stored));
      }
    } catch {}

    try {
      const onboarding = localStorage.getItem(ONBOARDING_KEY);
      if (onboarding) {
        const data = JSON.parse(onboarding);
        if (data.gewicht) setKoerpergewicht(data.gewicht);
      }
    } catch {}
  }, []);

  const auswertungen = useMemo(() => {
    return ergebnisse.map((e) => {
      if (e.uebersprungen) {
        return { ...e, geschaetztes1RM: null, fitnessLevel: null };
      }

      if (e.typ === "kraft" && e.gewicht && e.wiederholungen) {
        const erm = berechne1RM(e.gewicht, e.wiederholungen);
        const uebungKey = UEBUNG_KEY_MAP[e.name] || "rudern";
        const level = bestimmeFitnessLevel(erm, koerpergewicht, uebungKey);
        return { ...e, geschaetztes1RM: erm, fitnessLevel: level };
      }

      return { ...e, geschaetztes1RM: null, fitnessLevel: null };
    });
  }, [ergebnisse, koerpergewicht]);

  const kraftLevels = auswertungen
    .filter((a) => a.typ === "kraft" && a.fitnessLevel)
    .map((a) => a.fitnessLevel as string);

  const gesamtLevel = getMedianLevel(kraftLevels);
  const gesamtConfig = LEVEL_CONFIG[gesamtLevel];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fitnesstest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ergebnisse: ergebnisse.filter((e) => !e.uebersprungen),
          gesamtLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Fehler beim Speichern der Ergebnisse."
        );
      }

      localStorage.removeItem(STORAGE_KEY);
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Fehler beim Speichern. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  if (ergebnisse.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">
          Keine Testergebnisse gefunden.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/fitnesstest/intro")}
          className="h-12 rounded-xl"
        >
          Zum Fitnesstest
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => router.push("/fitnesstest/test/5")}
              className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-muted-foreground">
                Ergebnis
              </span>
            </div>
            <div className="w-10" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dein Ergebnis</h1>
        </div>

        {/* Gesamt-Level */}
        {kraftLevels.length > 0 && (
          <div className="rounded-2xl bg-card border p-6 text-center space-y-3 mb-8">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-7 w-7 text-primary" />
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Dein Gesamt-Fitnesslevel
              </p>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold",
                  gesamtConfig.farbe
                )}
              >
                {gesamtConfig.label}
              </span>
            </div>
          </div>
        )}

        {/* Einzelne Tests */}
        <div className="space-y-4">
          {auswertungen.map((a) => (
            <Card key={a.testNr}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{a.name}</CardTitle>
                  {a.uebersprungen && (
                    <Badge variant="secondary" className="text-xs">
                      Übersprungen
                    </Badge>
                  )}
                  {a.fitnessLevel && LEVEL_CONFIG[a.fitnessLevel] && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        LEVEL_CONFIG[a.fitnessLevel].farbe
                      )}
                    >
                      {LEVEL_CONFIG[a.fitnessLevel].label}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {a.uebersprungen ? (
                  <p className="text-sm text-muted-foreground">
                    Dieser Test wurde übersprungen.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {a.typ === "kraft" && a.gewicht && a.wiederholungen && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Gewicht × Wiederholungen
                          </span>
                          <span className="font-medium">
                            {a.gewicht} kg × {a.wiederholungen}
                          </span>
                        </div>
                        {a.geschaetztes1RM && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                              Geschätztes 1RM
                            </span>
                            <span className="font-semibold text-primary">
                              {a.geschaetztes1RM} kg
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    {a.typ === "dauer" && a.dauer && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {a.testNr === 4 ? "Dauer" : "Distanz"}
                        </span>
                        <span className="font-medium">
                          {a.dauer} {a.testNr === 4 ? "sek" : "m"}
                        </span>
                      </div>
                    )}
                    {a.rpe && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">RPE</span>
                        <span className="font-medium">{a.rpe}/10</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            size="lg"
          >
            {loading ? "Wird gespeichert..." : "Trainingsplan erstellen"}
          </Button>
        </div>
      </div>
    </div>
  );
}
