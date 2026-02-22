"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dumbbell,
  Play,
  CheckCircle2,
  Loader2,
  Sparkles,
  Calendar,
  Activity,
  AlertTriangle,
  Info,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";
import { cn } from "@/lib/utils";

interface Einheit {
  id: string;
  name: string;
  wochentag: number;
  typ: string;
  anzahlUebungen: number;
  istAbgeschlossen: boolean;
}

interface TrainingPlan {
  id: string;
  name: string;
  woche: number;
  istAktiv: boolean;
  istDeload: boolean;
  startDatum: string;
  endDatum: string;
  einheiten: Einheit[];
}

interface WhoopData {
  whoopRecovery: number;
  whoopStrain: number | null;
  whoopHRV: number | null;
  whoopRestingHR: number | null;
  schlafStunden: number;
}

const WOCHENTAGE = [
  "",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
];

function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-muted" />
          <div className="h-3 w-40 rounded bg-muted" />
        </div>
        <div className="h-9 w-24 rounded-md bg-muted" />
      </div>
    </div>
  );
}

export default function TrainingPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);

  useEffect(() => {
    fetchPlan();
    fetchWhoopData();
  }, []);

  async function fetchWhoopData() {
    try {
      const res = await fetch("/api/wellness/save");
      if (!res.ok) return;
      const data = await res.json();
      if (data?.whoopData) {
        setWhoopData(data.whoopData);
      }
    } catch (err) {
      console.error("WHOOP fetch error:", err);
    }
  }

  async function fetchPlan() {
    try {
      setLoading(true);
      const res = await fetch("/api/training/plan");
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
      toast.error("Trainingsplan konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePlan() {
    try {
      setGenerating(true);
      const res = await fetch("/api/ai/plan-generierung", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Fehler bei der Plangenerierung");
      }
      toast.success("Trainingsplan wurde erstellt!");
      await fetchPlan();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      toast.error(message);
    } finally {
      setGenerating(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Header title="Training" />
        <PageContainer>
          <div className="space-y-3">
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="mt-6 space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // Empty state: no plan exists
  if (!plan) {
    return (
      <>
        <Header title="Training" />
        <PageContainer>
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
            <div className="p-4 rounded-3xl bg-secondary">
              <Dumbbell className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Noch kein Trainingsplan
              </h2>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                Lass dir einen personalisierten Trainingsplan erstellen, der auf
                dein Fitnesslevel und deine Ziele abgestimmt ist.
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
                  Trainingsplan erstellen lassen
                </>
              )}
            </Button>
          </div>

          <div className="mt-8">
            <WissenschaftSnippet titel="Warum ein individueller Plan?">
              Ein auf dich abgestimmter Trainingsplan berücksichtigt deine
              Gelenkgesundheit, dein Fitnesslevel und deine Ziele. Das minimiert
              Verletzungsrisiken und maximiert deine Fortschritte.
            </WissenschaftSnippet>
          </div>
        </PageContainer>
      </>
    );
  }

  // Plan exists: show weekly overview
  const completedCount = plan.einheiten.filter(
    (e) => e.istAbgeschlossen
  ).length;

  return (
    <>
      <Header title="Training" />
      <PageContainer>
        <div className="space-y-6">
          {/* Plan header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {plan.name}
              </h2>
              {plan.istDeload && (
                <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30">
                  Deload
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Woche {plan.woche}</span>
              <span className="text-muted-foreground/50">|</span>
              <span>
                {completedCount}/{plan.einheiten.length} abgeschlossen
              </span>
            </div>
          </div>

          {/* WHOOP Recovery Recommendation */}
          {whoopData && (
            <>
              {whoopData.whoopRecovery < 34 && (
                <Card className="border-red-500/50 bg-red-50 dark:bg-red-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200">
                            Niedrige Recovery: {whoopData.whoopRecovery}%
                          </p>
                          <Activity className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                          Dein Körper braucht mehr Erholung. Wir empfehlen heute ein reduziertes Trainingsvolumen (60-70%) oder einen Ruhetag. Dein Schlaf: {whoopData.schlafStunden}h
                          {whoopData.whoopHRV && `, HRV: ${whoopData.whoopHRV}ms`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {whoopData.whoopRecovery >= 34 && whoopData.whoopRecovery < 67 && (
                <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                            Mittlere Recovery: {whoopData.whoopRecovery}%
                          </p>
                          <Activity className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                          Dein Körper ist teilweise erholt. Heute empfehlen wir 70-85% Volumen oder moderate Intensität. Achte auf dein Körpergefühl.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {whoopData.whoopRecovery >= 67 && (
                <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200">
                            Optimal erholt: {whoopData.whoopRecovery}%
                          </p>
                          <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Perfekt! Du bist optimal erholt und bereit für dein volles Training.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Einheiten list */}
          <div className="space-y-3">
            {plan.einheiten.map((einheit) => (
              <Card
                key={einheit.id}
                className={cn(
                  "py-0 overflow-hidden transition-colors",
                  einheit.istAbgeschlossen && "border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-950/20"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Day icon */}
                    <div
                      className={cn(
                        "flex items-center justify-center h-12 w-12 rounded-2xl shrink-0",
                        einheit.istAbgeschlossen
                          ? "bg-green-100 dark:bg-green-900/40"
                          : "bg-secondary"
                      )}
                    >
                      {einheit.istAbgeschlossen ? (
                        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {WOCHENTAGE[einheit.wochentag] || `Tag ${einheit.wochentag}`}
                        </span>
                      </div>
                      <p className="font-semibold text-[15px] truncate">
                        {einheit.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {einheit.typ} &middot; {einheit.anzahlUebungen} Übungen
                      </p>
                    </div>

                    {/* Action */}
                    <div className="shrink-0">
                      {einheit.istAbgeschlossen ? (
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">
                          Erledigt
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-xl h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              `/training/${einheit.id}/ausfuehren`
                            );
                          }}
                        >
                          <Play className="h-4 w-4" />
                          Starten
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Science snippet */}
          <WissenschaftSnippet titel="Was bedeutet RIR?">
            RIR 2-3 (Reps in Reserve) bedeutet, dass du bei jedem Satz 2-3
            Wiederholungen vor dem Muskelversagen aufhörst. Das ist optimal für
            Muskelwachstum bei geringerem Verletzungsrisiko.
          </WissenschaftSnippet>
        </div>
      </PageContainer>
    </>
  );
}
