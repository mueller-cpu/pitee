"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  Play,
  Clock,
  Target,
  Weight,
  Timer,
  Gauge,
  StickyNote,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";
import { cn } from "@/lib/utils";

interface UebungDetail {
  id: string;
  uebungId: string;
  name: string;
  kategorie: string;
  muskelgruppen: string;
  geraet: string;
  beschreibung: string | null;
  saetze: number;
  wiederholungen: string;
  gewicht: number | null;
  rir: number;
  pauseSekunden: number;
  tempo: string | null;
  notizen: string | null;
  sortierung: number;
}

interface EinheitDetail {
  id: string;
  name: string;
  wochentag: number;
  typ: string;
  aufwaermen: string | null;
  cooldown: string | null;
  sortierung: number;
  planName: string;
  uebungen: UebungDetail[];
}

interface WarmupStep {
  name: string;
  dauer?: string;
  beschreibung?: string;
}

function parsePhase(json: string | null): WarmupStep[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === "string") {
      // If it's a plain string, treat each line as a step
      return parsed
        .split("\n")
        .filter(Boolean)
        .map((line: string) => ({ name: line.trim() }));
    }
    return [];
  } catch {
    // If not valid JSON, treat as plain text
    if (!json.trim()) return [];
    return json
      .split("\n")
      .filter(Boolean)
      .map((line) => ({ name: line.trim() }));
  }
}

function formatPause(seconds: number): string {
  if (seconds >= 60) {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return sec > 0 ? `${min}:${sec.toString().padStart(2, "0")} min` : `${min} min`;
  }
  return `${seconds}s`;
}

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-5 w-32 rounded bg-muted" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-4 w-56 rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-6 w-20 rounded-full bg-muted" />
              <div className="h-6 w-14 rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhaseSection({
  title,
  steps,
}: {
  title: string;
  steps: WarmupStep[];
}) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <Card className="py-0 overflow-hidden">
        <CardContent className="p-4">
          <ul className="space-y-2">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 min-h-[32px]">
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-secondary text-xs font-medium shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{step.name}</span>
                  {step.dauer && (
                    <span className="text-xs text-muted-foreground ml-2">
                      ({step.dauer})
                    </span>
                  )}
                  {step.beschreibung && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {step.beschreibung}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Science tips per category for contextual snippets
const SCIENCE_TIPS: Record<string, { titel: string; text: string }> = {
  Brust: {
    titel: "Brusttraining ab 50",
    text: "Maschinen-basiertes Brusttraining reduziert die Belastung auf Schultergelenke. Achte auf eine kontrollierte exzentrische Phase (3-4 Sekunden) für maximalen Muskelreiz.",
  },
  Rücken: {
    titel: "Rückengesundheit",
    text: "Ein starker Rücken schützt die Wirbelsäule und verbessert die Haltung. Ziehbewegungen sollten immer Bestandteil deines Trainings sein.",
  },
  Beine: {
    titel: "Beintraining für Mobilität",
    text: "Starke Beine sind essenziell für Alltagsmobilität und Sturzprävention. Maschinenübungen wie die Beinpresse sind gelenkschonender als freie Kniebeugen.",
  },
};

export default function EinheitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const einheitId = params.einheitId as string;

  const [einheit, setEinheit] = useState<EinheitDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEinheit() {
      try {
        const res = await fetch(`/api/training/einheit/${einheitId}`);
        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Fehler beim Laden");
        }
        const data = await res.json();
        setEinheit(data.einheit);
      } catch {
        toast.error("Trainingseinheit konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    if (einheitId) {
      fetchEinheit();
    }
  }, [einheitId, router]);

  if (loading) {
    return (
      <>
        <Header title="Einheit" showBack />
        <PageContainer>
          <SkeletonDetail />
        </PageContainer>
      </>
    );
  }

  if (!einheit) {
    return (
      <>
        <Header title="Einheit" showBack />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              Trainingseinheit nicht gefunden.
            </p>
            <Button variant="outline" onClick={() => router.push("/training")}>
              Zurück zum Trainingsplan
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  const warmupSteps = parsePhase(einheit.aufwaermen);
  const cooldownSteps = parsePhase(einheit.cooldown);

  // Find a relevant science tip based on exercise categories
  const categories = einheit.uebungen.map((u) => u.kategorie);
  const scienceTip = Object.keys(SCIENCE_TIPS).find((key) =>
    categories.some((cat) => cat.toLowerCase().includes(key.toLowerCase()))
  );

  return (
    <>
      <Header title={einheit.name} showBack />
      <PageContainer>
        <div className="space-y-6">
          {/* Einheit info */}
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {einheit.planName}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{einheit.typ}</Badge>
              <span className="text-sm text-muted-foreground">
                {einheit.uebungen.length} Übungen
              </span>
            </div>
          </div>

          {/* Warmup */}
          <PhaseSection title="Aufwärmen" steps={warmupSteps} />

          {/* Exercises */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Übungen
            </h3>
            {einheit.uebungen.map((uebung, idx) => (
              <Card key={uebung.id} className="py-0 overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  {/* Exercise header */}
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-xl text-sm font-semibold shrink-0",
                        "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                      )}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px]">{uebung.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {uebung.muskelgruppen} &middot; {uebung.geraet}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Exercise details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>
                        {uebung.saetze} &times; {uebung.wiederholungen}
                      </span>
                    </div>

                    {uebung.gewicht != null && uebung.gewicht > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <Weight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{uebung.gewicht} kg</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm">
                      <Gauge className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>RIR {uebung.rir}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Timer className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Pause {formatPause(uebung.pauseSekunden)}</span>
                    </div>

                    {uebung.tempo && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>Tempo {uebung.tempo}</span>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {uebung.notizen && (
                    <div className="flex items-start gap-2 bg-secondary/50 rounded-lg p-2.5">
                      <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {uebung.notizen}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cooldown */}
          <PhaseSection title="Cool-down" steps={cooldownSteps} />

          {/* Contextual science snippet */}
          {scienceTip && SCIENCE_TIPS[scienceTip] && (
            <WissenschaftSnippet titel={SCIENCE_TIPS[scienceTip].titel}>
              {SCIENCE_TIPS[scienceTip].text}
            </WissenschaftSnippet>
          )}

          {/* Start button */}
          <div className="pb-4">
            <Button
              size="lg"
              className="w-full rounded-xl h-14 text-base font-semibold"
              onClick={() =>
                router.push(`/training/${einheitId}/ausfuehren`)
              }
            >
              <Play className="h-5 w-5" />
              Training starten
            </Button>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
