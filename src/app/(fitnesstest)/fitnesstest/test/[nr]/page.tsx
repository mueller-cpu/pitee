"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { berechne1RM } from "@/lib/calculations";

const STORAGE_KEY = "fitnesstest-daten";

interface TestConfig {
  name: string;
  kategorie: string;
  typ: "kraft" | "dauer";
  anleitung: string;
  dauerLabel?: string;
  dauerEinheit?: string;
}

const TEST_CONFIGS: TestConfig[] = [
  {
    name: "Bankdrücken",
    kategorie: "Oberkörper Push",
    typ: "kraft",
    anleitung:
      "Wähle ein Gewicht, das du ca. 5-10 Mal heben kannst. Führe so viele saubere Wiederholungen wie möglich durch.",
  },
  {
    name: "Kniebeuge",
    kategorie: "Unterkörper",
    typ: "kraft",
    anleitung:
      "Kniebeuge mit Langhantel oder Goblet Squat. Gehe so tief wie möglich mit sauberer Technik.",
  },
  {
    name: "Rudern / Latzug",
    kategorie: "Oberkörper Pull",
    typ: "kraft",
    anleitung:
      "Latzug oder Rudern an der Maschine. Kontrollierte Bewegung, voller Bewegungsumfang.",
  },
  {
    name: "Plank",
    kategorie: "Core",
    typ: "dauer",
    anleitung:
      "Halte die Plank-Position so lange wie möglich. Stoppe wenn die Form nachlässt.",
    dauerLabel: "Dauer (Sekunden)",
    dauerEinheit: "sek",
  },
  {
    name: "Cardio",
    kategorie: "Ausdauer",
    typ: "dauer",
    anleitung:
      "10 Minuten Ruderergometer oder Laufband. Notiere die zurückgelegte Distanz.",
    dauerLabel: "Distanz (Meter)",
    dauerEinheit: "m",
  },
];

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

export default function FitnesstestTestPage({
  params,
}: {
  params: Promise<{ nr: string }>;
}) {
  const { nr } = use(params);
  const router = useRouter();
  const testNr = parseInt(nr, 10);
  const testIndex = testNr - 1;
  const config = TEST_CONFIGS[testIndex];

  const [gewicht, setGewicht] = useState("");
  const [wiederholungen, setWiederholungen] = useState("");
  const [dauer, setDauer] = useState("");
  const [rpe, setRpe] = useState<number | null>(null);

  // Load existing data for this test if user navigates back
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const daten: TestErgebnis[] = JSON.parse(stored);
        const existing = daten.find((d) => d.testNr === testNr);
        if (existing && !existing.uebersprungen) {
          if (existing.gewicht) setGewicht(String(existing.gewicht));
          if (existing.wiederholungen)
            setWiederholungen(String(existing.wiederholungen));
          if (existing.dauer) setDauer(String(existing.dauer));
          if (existing.rpe) setRpe(existing.rpe);
        }
      }
    } catch {}
  }, [testNr]);

  const geschaetztes1RM = useMemo(() => {
    if (config?.typ !== "kraft") return null;
    const g = parseFloat(gewicht);
    const w = parseFloat(wiederholungen);
    if (!g || !w || g <= 0 || w <= 0) return null;
    return berechne1RM(g, w);
  }, [gewicht, wiederholungen, config?.typ]);

  const isValid = useMemo(() => {
    if (!config) return false;
    if (config.typ === "kraft") {
      return (
        parseFloat(gewicht) > 0 &&
        parseFloat(wiederholungen) > 0 &&
        rpe !== null
      );
    }
    return parseFloat(dauer) > 0 && rpe !== null;
  }, [config, gewicht, wiederholungen, dauer, rpe]);

  if (!config || testNr < 1 || testNr > 5) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Test nicht gefunden.</p>
      </div>
    );
  }

  const speichereErgebnis = (uebersprungen: boolean) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const daten: TestErgebnis[] = stored ? JSON.parse(stored) : [];

    // Remove existing entry for this test
    const filtered = daten.filter((d) => d.testNr !== testNr);

    const ergebnis: TestErgebnis = {
      testNr,
      name: config.name,
      typ: config.typ,
      uebersprungen,
    };

    if (!uebersprungen) {
      if (config.typ === "kraft") {
        ergebnis.gewicht = parseFloat(gewicht);
        ergebnis.wiederholungen = parseInt(wiederholungen, 10);
      } else {
        ergebnis.dauer = parseFloat(dauer);
      }
      ergebnis.rpe = rpe ?? undefined;
    }

    filtered.push(ergebnis);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  };

  const handleWeiter = () => {
    speichereErgebnis(false);
    navigateNext();
  };

  const handleUeberspringen = () => {
    speichereErgebnis(true);
    navigateNext();
  };

  const navigateNext = () => {
    if (testNr < 5) {
      router.push(`/fitnesstest/test/${testNr + 1}`);
    } else {
      router.push("/fitnesstest/ergebnis");
    }
  };

  const fortschritt = (testNr / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center h-14">
            <button
              onClick={() => {
                if (testNr > 1) {
                  router.push(`/fitnesstest/test/${testNr - 1}`);
                } else {
                  router.push("/fitnesstest/intro");
                }
              }}
              className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex-1 text-center">
              <span className="text-sm text-muted-foreground">
                Test {testNr} von 5
              </span>
            </div>
            <div className="w-10" />
          </div>
          <Progress value={fortschritt} className="h-1 -mt-px" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="space-y-1 mb-2">
          <p className="text-sm font-medium text-primary">{config.kategorie}</p>
          <h1 className="text-2xl font-bold tracking-tight">{config.name}</h1>
        </div>

        <div className="rounded-2xl bg-muted/50 p-4 mb-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {config.anleitung}
          </p>
        </div>

        <div className="space-y-6">
          {config.typ === "kraft" ? (
            <>
              {/* Gewicht */}
              <div className="space-y-3">
                <Label htmlFor="gewicht" className="text-base">
                  Gewicht (kg)
                </Label>
                <Input
                  id="gewicht"
                  type="number"
                  inputMode="decimal"
                  placeholder="z.B. 60"
                  value={gewicht}
                  onChange={(e) => setGewicht(e.target.value)}
                  className="h-14 text-lg rounded-xl px-4"
                />
              </div>

              {/* Wiederholungen */}
              <div className="space-y-3">
                <Label htmlFor="wiederholungen" className="text-base">
                  Wiederholungen
                </Label>
                <Input
                  id="wiederholungen"
                  type="number"
                  inputMode="numeric"
                  placeholder="z.B. 8"
                  value={wiederholungen}
                  onChange={(e) => setWiederholungen(e.target.value)}
                  className="h-14 text-lg rounded-xl px-4"
                />
              </div>

              {/* 1RM Anzeige */}
              {geschaetztes1RM !== null && (
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Geschätztes 1RM
                  </p>
                  <p className="text-3xl font-bold tracking-tight text-primary">
                    {geschaetztes1RM} kg
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Dauer / Distanz */
            <div className="space-y-3">
              <Label htmlFor="dauer" className="text-base">
                {config.dauerLabel}
              </Label>
              <Input
                id="dauer"
                type="number"
                inputMode="numeric"
                placeholder={
                  config.dauerEinheit === "sek" ? "z.B. 60" : "z.B. 2000"
                }
                value={dauer}
                onChange={(e) => setDauer(e.target.value)}
                className="h-14 text-lg rounded-xl px-4"
              />
            </div>
          )}

          {/* RPE Selector */}
          <div className="space-y-3">
            <Label className="text-base">
              RPE – Anstrengung (1-10)
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRpe(value)}
                  className={cn(
                    "flex items-center justify-center rounded-xl h-12 w-full text-base font-semibold transition-all",
                    "border-2",
                    rpe === value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-accent/50 text-foreground"
                  )}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              1 = sehr leicht · 10 = maximale Anstrengung
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
          <Button
            onClick={handleWeiter}
            disabled={!isValid}
            className="w-full h-14 text-base font-semibold rounded-2xl"
            size="lg"
          >
            {testNr < 5 ? "Weiter" : "Ergebnis anzeigen"}
          </Button>
          <button
            onClick={handleUeberspringen}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[48px] flex items-center justify-center"
          >
            Überspringen
          </button>
        </div>
      </div>
    </div>
  );
}
