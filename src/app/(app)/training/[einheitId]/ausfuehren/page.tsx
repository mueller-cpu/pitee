"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flag,
  MessageSquare,
  Trophy,
  X,
} from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import RestTimer from "@/components/workout/RestTimer";
import SatzLogger, {
  type SatzErgebnis,
  type VorherSatzData,
} from "@/components/workout/SatzLogger";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────

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

interface LetzteSatzDaten {
  satzNummer: number;
  gewicht: number | null;
  wiederholungen: number | null;
  rir: number | null;
  rpe: number | null;
}

interface LetzteUebungDaten {
  uebungName: string;
  sortierung: number;
  satzLogs: LetzteSatzDaten[];
}

interface LetzteDaten {
  id: string;
  datum: string;
  gesamtRPE: number | null;
  uebungLogs: LetzteUebungDaten[];
}

interface GelogterSatz extends SatzErgebnis {
  // extends satzNummer, gewicht, wiederholungen, rir
}

interface UebungLogState {
  uebungName: string;
  sortierung: number;
  saetze: GelogterSatz[];
  rpe: number | null;
  notiz: string;
}

// ─── Workout duration display ───────────────────────────────

function DauerAnzeige({ startZeit }: { startZeit: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startZeit.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startZeit]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;
  return (
    <span className="tabular-nums text-sm text-muted-foreground">
      {min}:{sec.toString().padStart(2, "0")}
    </span>
  );
}

// ─── RPE Selector ───────────────────────────────────────────

function RPESelector({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">RPE (Anstrengung)</label>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
          <button
            key={rpe}
            type="button"
            onClick={() => onChange(rpe)}
            className={cn(
              "h-12 rounded-xl text-base font-semibold transition-colors",
              "border border-border",
              value === rpe
                ? rpe >= 9
                  ? "bg-red-500 text-white border-red-500"
                  : rpe >= 7
                    ? "bg-orange-500 text-white border-orange-500"
                    : rpe >= 5
                      ? "bg-yellow-500 text-white border-yellow-500"
                      : "bg-green-500 text-white border-green-500"
                : "bg-secondary/50 text-foreground active:bg-secondary"
            )}
          >
            {rpe}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Exercise progress indicator ────────────────────────────

function UebungFortschritt({
  aktuell,
  gesamt,
}: {
  aktuell: number;
  gesamt: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: gesamt }).map((_, idx) => (
        <div
          key={idx}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            idx < aktuell
              ? "bg-primary"
              : idx === aktuell
                ? "bg-primary/50"
                : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────

function SkeletonWorkout() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-2 w-full rounded bg-muted" />
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="rounded-xl border p-5 space-y-4">
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="h-12 w-full rounded bg-muted" />
          <div className="h-12 w-full rounded bg-muted" />
          <div className="h-12 w-full rounded bg-muted" />
          <div className="h-14 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────

type WorkoutPhase = "uebung" | "pause" | "uebungRPE" | "zusammenfassung";

export default function AusfuehrenPage() {
  const router = useRouter();
  const params = useParams();
  const einheitId = params.einheitId as string;

  // Data
  const [einheit, setEinheit] = useState<EinheitDetail | null>(null);
  const [letzteDaten, setLetzteDaten] = useState<LetzteDaten | null>(null);
  const [loading, setLoading] = useState(true);

  // Workout state
  const [startZeit] = useState<Date>(() => new Date());
  const [aktuelleUebungIdx, setAktuelleUebungIdx] = useState(0);
  const [aktuellerSatzIdx, setAktuellerSatzIdx] = useState(0);
  const [phase, setPhase] = useState<WorkoutPhase>("uebung");
  const [uebungLogs, setUebungLogs] = useState<UebungLogState[]>([]);

  // Summary
  const [gesamtRPE, setGesamtRPE] = useState<number | null>(null);
  const [gesamtNotizen, setGesamtNotizen] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAbbrechen, setShowAbbrechen] = useState(false);

  // Current exercise RPE/notes
  const [aktuelleRPE, setAktuelleRPE] = useState<number | null>(null);
  const [aktuelleNotiz, setAktuelleNotiz] = useState("");

  // Ref to prevent double-saves
  const savedRef = useRef(false);

  // ─── Fetch data ─────────────────────────────────────────

  useEffect(() => {
    async function fetchData() {
      try {
        const [einheitRes, letzteRes] = await Promise.all([
          fetch(`/api/training/einheit/${einheitId}`),
          fetch(`/api/workout/letzte-daten/${einheitId}`),
        ]);

        if (!einheitRes.ok) {
          if (einheitRes.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Fehler beim Laden");
        }

        const einheitData = await einheitRes.json();
        setEinheit(einheitData.einheit);

        if (letzteRes.ok) {
          const letzteData = await letzteRes.json();
          setLetzteDaten(letzteData.letzteDaten);
        }
      } catch {
        toast.error("Training konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    }

    if (einheitId) {
      fetchData();
    }
  }, [einheitId, router]);

  // ─── Prevent accidental navigation ────────────────────────

  useEffect(() => {
    // 1. Intercept page reload/close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only block if we haven't finished the workout (phase !== "zusammenfassung")
      if (phase !== "zusammenfassung") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // 2. Intercept mobile back button or swipe gesture
    // Push a dummy state so we have something to "pop" without leaving the page
    if (phase !== "zusammenfassung") {
      window.history.pushState(null, "", window.location.href);
    }

    const handlePopState = () => {
      if (phase !== "zusammenfassung") {
        // Push the dummy state back to stay on the page
        window.history.pushState(null, "", window.location.href);
        // Open the custom cancellation dialog
        setShowAbbrechen(true);
      }
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [phase]);

  // ─── Current exercise ───────────────────────────────────

  const aktuelleUebung = einheit?.uebungen[aktuelleUebungIdx] ?? null;
  const gesamtUebungen = einheit?.uebungen.length ?? 0;

  // Find previous data for current exercise
  const vorherUebungDaten = letzteDaten?.uebungLogs.find(
    (ul) => ul.uebungName === aktuelleUebung?.name
  );
  const vorherSatz: VorherSatzData | null =
    vorherUebungDaten?.satzLogs[aktuellerSatzIdx]
      ? {
        gewicht: vorherUebungDaten.satzLogs[aktuellerSatzIdx].gewicht,
        wiederholungen:
          vorherUebungDaten.satzLogs[aktuellerSatzIdx].wiederholungen,
        rir: vorherUebungDaten.satzLogs[aktuellerSatzIdx].rir,
      }
      : null;

  // Already logged sets for current exercise
  const aktuelleGeloggteSaetze =
    uebungLogs.find((ul) => ul.uebungName === aktuelleUebung?.name)?.saetze ??
    [];

  // ─── Handlers ───────────────────────────────────────────

  const handleSatzSpeichern = useCallback(
    (ergebnis: SatzErgebnis) => {
      if (!aktuelleUebung) return;

      setUebungLogs((prev) => {
        const existing = prev.find(
          (ul) => ul.uebungName === aktuelleUebung.name
        );
        if (existing) {
          return prev.map((ul) =>
            ul.uebungName === aktuelleUebung.name
              ? { ...ul, saetze: [...ul.saetze, ergebnis] }
              : ul
          );
        }
        return [
          ...prev,
          {
            uebungName: aktuelleUebung.name,
            sortierung: aktuelleUebung.sortierung,
            saetze: [ergebnis],
            rpe: null,
            notiz: "",
          },
        ];
      });

      const nextSatzIdx = aktuellerSatzIdx + 1;
      const totalSaetze = aktuelleUebung.saetze;

      if (nextSatzIdx < totalSaetze) {
        // More sets to go - show rest timer
        setPhase("pause");
        setAktuellerSatzIdx(nextSatzIdx);
      } else {
        // All sets done - ask for RPE
        setPhase("uebungRPE");
      }
    },
    [aktuelleUebung, aktuellerSatzIdx]
  );

  const handleRestComplete = useCallback(() => {
    setPhase("uebung");
  }, []);

  const handleUebungAbschliessen = useCallback(() => {
    if (!aktuelleUebung) return;

    // Save RPE and note for this exercise
    setUebungLogs((prev) =>
      prev.map((ul) =>
        ul.uebungName === aktuelleUebung.name
          ? { ...ul, rpe: aktuelleRPE, notiz: aktuelleNotiz }
          : ul
      )
    );

    const nextUebungIdx = aktuelleUebungIdx + 1;

    if (nextUebungIdx < gesamtUebungen) {
      // Next exercise
      setAktuelleUebungIdx(nextUebungIdx);
      setAktuellerSatzIdx(0);
      setAktuelleRPE(null);
      setAktuelleNotiz("");
      setPhase("uebung");
    } else {
      // Workout done
      setPhase("zusammenfassung");
    }
  }, [
    aktuelleUebung,
    aktuelleUebungIdx,
    gesamtUebungen,
    aktuelleRPE,
    aktuelleNotiz,
  ]);

  const handleWorkoutSpeichern = useCallback(async () => {
    if (savedRef.current || !einheit) return;
    savedRef.current = true;
    setSaving(true);

    try {
      const endZeit = new Date();
      const body = {
        trainingsEinheitId: einheit.id,
        startZeit: startZeit.toISOString(),
        endZeit: endZeit.toISOString(),
        gesamtRPE,
        notizen: gesamtNotizen || null,
        uebungLogs: uebungLogs.map((ul) => ({
          uebungName: ul.uebungName,
          sortierung: ul.sortierung,
          rpe: ul.rpe,
          notiz: ul.notiz || null,
          satzLogs: ul.saetze.map((sl) => ({
            satzNummer: sl.satzNummer,
            gewicht: sl.gewicht,
            wiederholungen: sl.wiederholungen,
            rir: sl.rir,
            rpe: null,
            notiz: null,
          })),
        })),
      };

      const res = await fetch("/api/workout/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error("Speichern fehlgeschlagen");
      }

      toast.success("Training gespeichert!");
      router.push("/training");
    } catch {
      savedRef.current = false;
      toast.error("Fehler beim Speichern. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  }, [einheit, startZeit, gesamtRPE, gesamtNotizen, uebungLogs, router]);

  // ─── Computed values for summary ────────────────────────

  const gesamtDauerSekunden = Math.floor(
    (Date.now() - startZeit.getTime()) / 1000
  );
  const gesamtDauerMin = Math.floor(gesamtDauerSekunden / 60);
  const gesamtVolumen = uebungLogs.reduce(
    (total, ul) =>
      total +
      ul.saetze.reduce(
        (sum, s) => sum + (s.gewicht || 0) * (s.wiederholungen || 0),
        0
      ),
    0
  );
  const gesamtSaetze = uebungLogs.reduce(
    (total, ul) => total + ul.saetze.length,
    0
  );

  // ─── Render ─────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <Header title="Training" showBack />
        <PageContainer>
          <SkeletonWorkout />
        </PageContainer>
      </>
    );
  }

  if (!einheit || einheit.uebungen.length === 0) {
    return (
      <>
        <Header title="Training" showBack />
        <PageContainer>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
            <p className="text-muted-foreground">
              Keine Übungen gefunden.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/training")}
            >
              Zurück zum Trainingsplan
            </Button>
          </div>
        </PageContainer>
      </>
    );
  }

  // ─── Summary view ───────────────────────────────────────

  if (phase === "zusammenfassung") {
    return (
      <>
        <Header title="Zusammenfassung" />
        <PageContainer>
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2 py-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold">Training abgeschlossen!</h2>
              <p className="text-muted-foreground">{einheit.name}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="py-0">
                <CardContent className="p-4 text-center">
                  <Clock className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold tabular-nums">
                    {gesamtDauerMin}
                  </p>
                  <p className="text-xs text-muted-foreground">Minuten</p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4 text-center">
                  <Dumbbell className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold tabular-nums">
                    {gesamtSaetze}
                  </p>
                  <p className="text-xs text-muted-foreground">Satze</p>
                </CardContent>
              </Card>
              <Card className="py-0">
                <CardContent className="p-4 text-center">
                  <TrophyIcon className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xl font-bold tabular-nums">
                    {gesamtVolumen >= 1000
                      ? `${(gesamtVolumen / 1000).toFixed(1)}t`
                      : `${Math.round(gesamtVolumen)}kg`}
                  </p>
                  <p className="text-xs text-muted-foreground">Volumen</p>
                </CardContent>
              </Card>
            </div>

            {/* Exercise summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Ubungen
              </h3>
              {uebungLogs.map((ul, idx) => (
                <Card key={idx} className="py-0">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{ul.uebungName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ul.saetze.length} Satze
                          {ul.rpe ? ` · RPE ${ul.rpe}` : ""}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    {ul.saetze.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {ul.saetze.map((s, sIdx) => (
                          <Badge
                            key={sIdx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {s.gewicht}kg x {s.wiederholungen}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Separator />

            {/* Gesamt-RPE */}
            <RPESelector value={gesamtRPE} onChange={setGesamtRPE} />

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Notizen (optional)
              </label>
              <Textarea
                placeholder="Wie hast du dich gefuhlt? Schmerzen? Besonderes?"
                value={gesamtNotizen}
                onChange={(e) => setGesamtNotizen(e.target.value)}
                className="min-h-[80px] text-base"
              />
            </div>

            {/* Save button */}
            <div className="pb-4">
              <Button
                size="lg"
                className="w-full rounded-xl h-14 text-base font-semibold"
                onClick={handleWorkoutSpeichern}
                disabled={saving}
              >
                {saving ? "Wird gespeichert..." : "Speichern"}
              </Button>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  // ─── Active workout view ────────────────────────────────

  return (
    <>
      <Header
        title={einheit.name}
        rightAction={
          <div className="flex items-center gap-2">
            <DauerAnzeige startZeit={startZeit} />
            <button
              onClick={() => setShowAbbrechen(true)}
              className="flex items-center justify-center h-10 w-10 rounded-full text-muted-foreground active:bg-muted transition-colors"
              aria-label="Training abbrechen"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        }
      />

      <PageContainer>
        <div className="space-y-6">
          {/* Progress bar */}
          <UebungFortschritt
            aktuell={aktuelleUebungIdx}
            gesamt={gesamtUebungen}
          />

          {/* Exercise info */}
          {aktuelleUebung && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {aktuelleUebung.name}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {aktuelleUebungIdx + 1}/{gesamtUebungen}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {aktuelleUebung.saetze} x {aktuelleUebung.wiederholungen}
                </Badge>
                {aktuelleUebung.gewicht != null &&
                  aktuelleUebung.gewicht > 0 && (
                    <Badge variant="secondary">
                      {aktuelleUebung.gewicht} kg
                    </Badge>
                  )}
                <Badge variant="secondary">
                  RIR {aktuelleUebung.rir}
                </Badge>
                {aktuelleUebung.tempo && (
                  <Badge variant="secondary">
                    Tempo {aktuelleUebung.tempo}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Logged sets overview */}
          {aktuelleGeloggteSaetze.length > 0 && phase !== "uebungRPE" && (
            <div className="flex flex-wrap gap-2">
              {aktuelleGeloggteSaetze.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 px-3 py-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    S{s.satzNummer}: {s.gewicht}kg x {s.wiederholungen}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Phase content */}
          {phase === "uebung" && aktuelleUebung && (
            <SatzLogger
              satzNummer={aktuellerSatzIdx + 1}
              zielGewicht={aktuelleUebung.gewicht}
              zielReps={aktuelleUebung.wiederholungen}
              zielRIR={aktuelleUebung.rir}
              vorherSatz={vorherSatz}
              onSave={handleSatzSpeichern}
            />
          )}

          {phase === "pause" && aktuelleUebung && (
            <RestTimer
              dauer={aktuelleUebung.pauseSekunden}
              onComplete={handleRestComplete}
            />
          )}

          {phase === "uebungRPE" && aktuelleUebung && (
            <Card className="py-0 overflow-hidden">
              <CardContent className="p-5 space-y-5">
                <div className="text-center space-y-1">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold">
                    {aktuelleUebung.name} abgeschlossen
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {aktuelleGeloggteSaetze.length} Satze geloggt
                  </p>
                </div>

                <Separator />

                <RPESelector
                  value={aktuelleRPE}
                  onChange={setAktuelleRPE}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    Notizen (optional)
                  </label>
                  <Textarea
                    placeholder="Schmerzen, Anpassungen, Anmerkungen..."
                    value={aktuelleNotiz}
                    onChange={(e) => setAktuelleNotiz(e.target.value)}
                    className="min-h-[60px] text-base"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full rounded-xl h-14 text-base font-semibold"
                  onClick={handleUebungAbschliessen}
                >
                  {aktuelleUebungIdx + 1 < gesamtUebungen ? (
                    <>
                      Nachste Ubung
                      <ChevronRight className="h-5 w-5" />
                    </>
                  ) : (
                    <>
                      <Flag className="h-5 w-5" />
                      Training beenden
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>

      {/* Cancel dialog */}
      <Dialog open={showAbbrechen} onOpenChange={setShowAbbrechen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Training abbrechen?</DialogTitle>
            <DialogDescription>
              Dein bisheriger Fortschritt geht verloren.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-xl h-12"
              onClick={() => router.push(`/training/${einheitId}`)}
            >
              Ja, abbrechen
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl h-12"
              onClick={() => setShowAbbrechen(false)}
            >
              Weiter trainieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Small helper icon component to avoid importing another icon
function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}
