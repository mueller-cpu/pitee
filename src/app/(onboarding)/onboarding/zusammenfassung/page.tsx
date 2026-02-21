"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";
import { toast } from "sonner";
import { berechneBMI } from "@/lib/calculations";

const STORAGE_KEY = "onboarding-data";

interface OnboardingData {
  name?: string;
  alter?: number;
  gewicht?: number;
  groesse?: number;
  herzKreislauf?: boolean;
  bluthochdruck?: boolean;
  diabetes?: boolean;
  medikamente?: string;
  vorerkrankungen?: string;
  gelenkProbleme?: Array<{
    gelenk: string;
    seite: string;
    schwere: number;
  }>;
  erfahrung?: string;
  hauptziel?: string;
  trainingstagePW?: number;
}

const ERFAHRUNG_LABELS: Record<string, string> = {
  anfaenger: "Anfänger",
  fortgeschritten: "Fortgeschritten",
  erfahren: "Erfahren",
};

const ZIEL_LABELS: Record<string, string> = {
  muskelaufbau: "Muskelaufbau",
  fettabbau: "Fettabbau",
  gesundheit: "Gesundheit",
  kraft: "Kraft steigern",
};

const GELENK_LABELS: Record<string, string> = {
  schulter: "Schulter",
  ellbogen: "Ellbogen",
  handgelenk: "Handgelenk",
  ruecken: "Rücken (Unterer Rücken)",
  huefte: "Hüfte",
  knie: "Knie",
};

const SEITE_LABELS: Record<string, string> = {
  links: "links",
  rechts: "rechts",
  beide: "beide Seiten",
};

const SCHWERE_LABELS: Record<number, string> = {
  1: "leicht",
  2: "mittel",
  3: "schwer",
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-baseline py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

export default function ZusammenfassungPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>({});
  const [bestaetigt, setBestaetigt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setData(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const bmi =
    data.gewicht && data.groesse
      ? berechneBMI(data.gewicht, data.groesse)
      : null;

  const gesundheitItems: string[] = [];
  if (data.herzKreislauf) gesundheitItems.push("Herz-Kreislauf-Erkrankung");
  if (data.bluthochdruck) gesundheitItems.push("Bluthochdruck");
  if (data.diabetes) gesundheitItems.push("Diabetes");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          aerztlicheFreigabe: bestaetigt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || "Fehler beim Speichern der Daten."
        );
      }

      localStorage.removeItem(STORAGE_KEY);
      router.push("/fitnesstest/intro");
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

  return (
    <OnboardingLayout
      schritt={7}
      titel="Zusammenfassung"
      beschreibung="Überprüfe deine Angaben bevor wir starten."
      zurueckUrl="/onboarding/verfuegbarkeit"
      onWeiter={handleSubmit}
      weiterLabel="Profil erstellen & starten"
      weiterDisabled={!bestaetigt}
      loading={loading}
    >
      {/* Persoenliche Daten */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Persönliche Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <DataRow label="Name" value={data.name || "–"} />
          <DataRow
            label="Alter"
            value={data.alter ? `${data.alter} Jahre` : "–"}
          />
          <DataRow
            label="Gewicht"
            value={data.gewicht ? `${data.gewicht} kg` : "–"}
          />
          <DataRow
            label="Größe"
            value={data.groesse ? `${data.groesse} cm` : "–"}
          />
          <DataRow label="BMI" value={bmi ? String(bmi) : "–"} />
        </CardContent>
      </Card>

      {/* Gesundheit */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gesundheit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <DataRow
            label="Erkrankungen"
            value={
              gesundheitItems.length > 0
                ? gesundheitItems.join(", ")
                : "Keine"
            }
          />
          <DataRow
            label="Medikamente"
            value={data.medikamente || "Keine"}
          />
          <DataRow
            label="Vorerkrankungen"
            value={data.vorerkrankungen || "Keine"}
          />
        </CardContent>
      </Card>

      {/* Gelenkprobleme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gelenkprobleme</CardTitle>
        </CardHeader>
        <CardContent>
          {data.gelenkProbleme && data.gelenkProbleme.length > 0 ? (
            <ul className="space-y-1.5">
              {data.gelenkProbleme.map((p, i) => (
                <li key={i} className="text-sm text-foreground">
                  {GELENK_LABELS[p.gelenk] || p.gelenk} ({SEITE_LABELS[p.seite] || p.seite},{" "}
                  {SCHWERE_LABELS[p.schwere] || `Stufe ${p.schwere}`})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Keine</p>
          )}
        </CardContent>
      </Card>

      {/* Training */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Training</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <DataRow
            label="Erfahrung"
            value={
              data.erfahrung
                ? ERFAHRUNG_LABELS[data.erfahrung] || data.erfahrung
                : "–"
            }
          />
          <DataRow
            label="Hauptziel"
            value={
              data.hauptziel
                ? ZIEL_LABELS[data.hauptziel] || data.hauptziel
                : "–"
            }
          />
          <DataRow
            label="Trainingstage/Woche"
            value={
              data.trainingstagePW
                ? `${data.trainingstagePW} Tage`
                : "–"
            }
          />
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200 leading-relaxed">
            Bitte konsultiere einen Arzt, bevor du ein neues Trainingsprogramm
            beginnst. Dies gilt besonders ab 50 Jahren und bei bestehenden
            Gesundheitseinschränkungen.
          </p>
        </div>
      </div>

      {/* Checkbox */}
      <button
        type="button"
        onClick={() => setBestaetigt((prev) => !prev)}
        className={cn(
          "flex items-start gap-4 w-full text-left rounded-xl p-4 transition-all",
          "min-h-[48px] border",
          bestaetigt
            ? "border-primary bg-primary/5"
            : "border-border bg-background hover:bg-accent/50"
        )}
      >
        <div
          className={cn(
            "flex items-center justify-center shrink-0 rounded-md w-6 h-6 mt-0.5 border-2 transition-all",
            bestaetigt
              ? "bg-primary border-primary text-primary-foreground"
              : "border-muted-foreground/40 bg-background"
          )}
        >
          {bestaetigt && <Check className="h-4 w-4" />}
        </div>
        <span className="text-sm leading-relaxed text-foreground">
          Ich bestätige, dass meine Angaben korrekt sind und ich ärztliche
          Freigabe habe.
        </span>
      </button>
    </OnboardingLayout>
  );
}
