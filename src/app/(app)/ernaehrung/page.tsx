"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Loader2,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Zap,
  Pill,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MakroBalken from "@/components/ernaehrung/MakroBalken";
import LeucinTracker from "@/components/ernaehrung/LeucinTracker";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";
import { cn } from "@/lib/utils";

interface MahlzeitData {
  id: string;
  name: string;
  uhrzeit: string | null;
  kalorien: number;
  proteinG: number;
  kohlenhydrateG: number;
  fettG: number;
  leucinG: number | null;
  rezept: string | null;
  istPostWorkout: boolean;
  sortierung: number;
}

interface TagesplanData {
  id: string;
  datum: string;
  istTrainingstag: boolean;
  kalorien: number;
  proteinG: number;
  kohlenhydrateG: number;
  fettG: number;
  leucinG: number | null;
  mahlzeiten: MahlzeitData[];
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-muted" />
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="h-10 w-24 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-4 w-48 rounded bg-muted" />
      </div>
    </div>
  );
}

function MahlzeitCard({ mahlzeit }: { mahlzeit: MahlzeitData }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "py-0 overflow-hidden transition-colors",
        mahlzeit.istPostWorkout &&
          "border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20"
      )}
    >
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center gap-3 w-full p-4 text-left min-h-[64px]"
          aria-expanded={expanded}
        >
          {/* Icon */}
          <div
            className={cn(
              "flex items-center justify-center h-12 w-12 rounded-2xl shrink-0",
              mahlzeit.istPostWorkout
                ? "bg-green-100 dark:bg-green-900/40"
                : "bg-secondary"
            )}
          >
            {mahlzeit.istPostWorkout ? (
              <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px]">{mahlzeit.name}</span>
              {mahlzeit.istPostWorkout && (
                <Badge
                  variant="secondary"
                  className="text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 text-[10px]"
                >
                  Post-Workout
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {mahlzeit.uhrzeit && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>{mahlzeit.uhrzeit}</span>
                  <span className="text-muted-foreground/50">|</span>
                </>
              )}
              <span>{mahlzeit.kalorien} kcal</span>
              <span className="text-muted-foreground/50">|</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {Math.round(mahlzeit.proteinG)}g P
              </span>
              {mahlzeit.leucinG != null && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span
                    className={cn(
                      "font-medium",
                      mahlzeit.leucinG >= 2.5
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    )}
                  >
                    {mahlzeit.leucinG.toFixed(1)}g L
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Chevron */}
          <div className="shrink-0 text-muted-foreground">
            {expanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </button>

        {/* Expandable recipe */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            expanded
              ? "grid-rows-[1fr] opacity-100"
              : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-4 pt-0 space-y-3">
              <div className="border-t pt-3" />

              {/* Macro breakdown */}
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {mahlzeit.kalorien}
                  </p>
                  <p className="text-[10px] text-muted-foreground">kcal</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                    {Math.round(mahlzeit.proteinG)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Protein</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {Math.round(mahlzeit.kohlenhydrateG)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Kohlenhydrate</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                    {Math.round(mahlzeit.fettG)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">Fett</p>
                </div>
              </div>

              {/* Recipe */}
              {mahlzeit.rezept && (
                <div className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mahlzeit.rezept}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ErnaehrungPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<TagesplanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, []);

  async function fetchPlan() {
    try {
      setLoading(true);
      const res = await fetch("/api/ernaehrung/tagesplan");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Fehler beim Laden");
      }
      const data = await res.json();
      setPlan(data.plan);
    } catch {
      toast.error("Ernährungsplan konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    try {
      setGenerating(true);
      const res = await fetch("/api/ernaehrung/generieren", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler bei der Plangenerierung");
      }
      toast.success("Ernährungsplan wurde erstellt!");
      await fetchPlan();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  // Format today's date in German
  const heute = new Date();
  const datumsFormat = heute.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Loading state
  if (loading) {
    return (
      <>
        <Header title="Ernährung" />
        <PageContainer>
          <SkeletonBlock />
        </PageContainer>
      </>
    );
  }

  // Empty state: no plan
  if (!plan) {
    return (
      <>
        <Header title="Ernährung" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
            <div className="p-4 rounded-3xl bg-secondary">
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Noch kein Ernährungsplan
              </h2>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                Lass dir einen personalisierten Ernährungsplan erstellen, der auf
                dein Trainingspensum und deine Ziele abgestimmt ist.
              </p>
            </div>
            <Button
              size="lg"
              className="rounded-xl h-12 px-6 text-base"
              onClick={handleGeneratePlan}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Plan wird erstellt...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Plan erstellen
                </>
              )}
            </Button>
          </div>

          <div className="mt-8">
            <WissenschaftSnippet titel="Warum ein individueller Ernährungsplan?">
              Ab 50 steigt die anabole Resistenz. Ein auf dich abgestimmter
              Ernährungsplan stellt sicher, dass du genug Protein (1.6-2.0g/kg)
              und Leucin (2.5-3g pro Mahlzeit) bekommst, um die maximale
              Muskelproteinsynthese zu stimulieren.
            </WissenschaftSnippet>
          </div>
        </PageContainer>
      </>
    );
  }

  // Plan exists
  const gesamtLeucin = plan.leucinG ?? plan.mahlzeiten.reduce(
    (sum, m) => sum + (m.leucinG ?? 0),
    0
  );

  return (
    <>
      <Header
        title="Ernährung"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl h-10"
            onClick={handleGeneratePlan}
            disabled={generating}
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <PageContainer>
        <div className="space-y-6">
          {/* Date + Day type */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight capitalize">
              {datumsFormat}
            </h2>
            <Badge
              variant="secondary"
              className={cn(
                plan.istTrainingstag
                  ? "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30"
                  : "text-muted-foreground bg-secondary"
              )}
            >
              {plan.istTrainingstag ? "Trainingstag" : "Ruhetag"}
            </Badge>
          </div>

          {/* Macro summary card */}
          <Card className="py-0">
            <CardContent className="p-4 space-y-4">
              {/* Calories - large display */}
              <div className="text-center py-2">
                <p className="text-4xl font-bold tracking-tight text-foreground tabular-nums">
                  {plan.kalorien}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Kalorien
                </p>
              </div>

              {/* Macro bars */}
              <div className="space-y-3">
                <MakroBalken
                  label="Protein"
                  aktuell={plan.proteinG}
                  ziel={plan.proteinG}
                  einheit="g"
                  farbe="blue"
                />
                <MakroBalken
                  label="Kohlenhydrate"
                  aktuell={plan.kohlenhydrateG}
                  ziel={plan.kohlenhydrateG}
                  einheit="g"
                  farbe="amber"
                />
                <MakroBalken
                  label="Fett"
                  aktuell={plan.fettG}
                  ziel={plan.fettG}
                  einheit="g"
                  farbe="red"
                />
              </div>
            </CardContent>
          </Card>

          {/* Leucin tracker */}
          <LeucinTracker leucinG={gesamtLeucin} />

          {/* Meals list */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide px-1">
              Mahlzeiten
            </h3>
            <div className="space-y-3">
              {plan.mahlzeiten.map((mahlzeit) => (
                <MahlzeitCard key={mahlzeit.id} mahlzeit={mahlzeit} />
              ))}
            </div>
          </div>

          {/* Supplement reminder */}
          <Card className="py-0 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 shrink-0">
                  <Pill className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Supplement-Erinnerung
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Kreatin 3-5g täglich, Vitamin D 2000-4000 IU
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Science snippet */}
          <WissenschaftSnippet titel="Warum 25-30g Protein pro Mahlzeit?">
            Ab 50 steigt die anabole Resistenz. Du brauchst ~25-30g hochwertiges
            Protein (mit 2.5-3g Leucin) pro Mahlzeit, um die maximale
            Muskelproteinsynthese zu stimulieren.
          </WissenschaftSnippet>

          {/* Shopping list link */}
          <Button
            variant="outline"
            className="w-full rounded-xl h-12 text-base"
            onClick={() => router.push("/ernaehrung/einkaufsliste")}
          >
            <ShoppingCart className="h-5 w-5" />
            Einkaufsliste anzeigen
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
