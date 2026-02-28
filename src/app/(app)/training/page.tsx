"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Einheit {
  id: string;
  name: string;
  wochentag: number;
  typ: string;
  anzahlUebungen: number;
  istAbgeschlossen: boolean;
}

interface UebungDetail {
  id: string;
  name: string;
  saetze: number;
  wiederholungen: string;
  rir: number;
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

const WOCHENTAGE_KURZ = ["", "MO", "DI", "MI", "DO", "FR", "SA", "SO"];

export default function TrainingPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedEinheitId, setExpandedEinheitId] = useState<string | null>(null);
  const [einheitDetails, setEinheitDetails] = useState<Record<string, UebungDetail[]>>({});

  useEffect(() => {
    fetchPlan();
  }, []);

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
      console.log("Fetched plan:", data.plan?.id, data.plan?.name, "istAktiv:", data.plan?.istAktiv);
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

  async function toggleEinheitExpand(einheitId: string) {
    if (expandedEinheitId === einheitId) {
      setExpandedEinheitId(null);
      return;
    }

    setExpandedEinheitId(einheitId);

    // If we already fetched details, don't fetch again
    if (einheitDetails[einheitId]) {
      return;
    }

    // Fetch einheit details
    try {
      const res = await fetch(`/api/training/einheit/${einheitId}`);
      if (!res.ok) return;
      const data = await res.json();
      const uebungen = data.einheit.uebungen.map((u: any) => ({
        id: u.id,
        name: u.name,
        saetze: u.saetze,
        wiederholungen: u.wiederholungen,
        rir: u.rir,
      }));
      setEinheitDetails((prev) => ({ ...prev, [einheitId]: uebungen }));
    } catch (err) {
      console.error("Failed to fetch einheit details:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground text-lg">Laden...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="relative flex min-h-screen w-full flex-col pb-32">
        <header className="sticky top-0 z-50 bg-[#0a0c10]/80 ios-blur px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-3xl neon-glow-blue">auto_awesome</span>
              <h1 className="text-3xl font-bold tracking-tight text-white">Training</h1>
            </div>
          </div>
        </header>
        <main className="px-6 mt-6 flex flex-col items-center justify-center text-center py-12 space-y-6">
          <div className="p-5 rounded-3xl bg-primary/10">
            <span className="material-symbols-outlined text-primary text-5xl neon-glow-blue">fitness_center</span>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white">Noch kein Trainingsplan</h2>
            <p className="text-slate-400 text-sm max-w-[280px]">
              Lass dir einen personalisierten Trainingsplan erstellen.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="w-full bg-white text-background-dark font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-accent neon-glow-blue">auto_awesome</span>
            <span className="tracking-tight uppercase text-sm">
              {generating ? "Plan wird erstellt..." : "KI-Trainingsplan erstellen"}
            </span>
          </button>
        </main>
      </div>
    );
  }

  const completedCount = plan.einheiten.filter((e) => e.istAbgeschlossen).length;
  const today = new Date().getDay() || 7;
  const todayWorkout = plan.einheiten.find((e) => e.wochentag === today && !e.istAbgeschlossen);
  const nextWorkout = todayWorkout || plan.einheiten.find((e) => !e.istAbgeschlossen);
  const deloadIn = plan.istDeload ? 0 : Math.max(0, 4 - plan.woche);

  return (
    <div className="relative flex flex-col pt-0 pb-12 w-full">
      <header className="sticky top-0 z-40 bg-[#0a0c10]/80 ios-blur px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl neon-glow-blue">auto_awesome</span>
          <h1 className="text-3xl font-bold tracking-tight text-white">Training</h1>
        </div>
      </header>

      <main className="px-6 mt-6 space-y-8">
        <div className="flex items-start justify-between px-1 gap-4">
          <div className="space-y-1 flex-1">
            <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-1">Aktueller Plan</p>
            <h2 className="text-2xl font-bold text-white leading-tight">
              Woche {plan.woche} – <span className="text-slate-400">{plan.name}</span>
            </h2>
          </div>
        </div>

        {nextWorkout && (
          <div className="relative group overflow-hidden rounded-xl bg-[#161b26] border border-white/5 shadow-2xl">
            <div
              className="h-[380px] w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2DpFn4K4wQFKkurzIoaQV8Rlfxcmie7mi8cpZHYEkQRjOfCCSGQ0tbryoYSMRQinRIRzEbs_eoTYr0YNm3sagtIt6QUMkxKlvRIyjt7HiB6nlZKVGzrWF3FhIbxtYWdzy0srQFdsKyqkTDuVyQOfrJRlEQv1BvYwwhSnyWOQqwED3VtmZF8boV-gXFBT2RvT5T8zB4f7uJWuO8zCfpRJiOTYIGpZ_Zy-zLinQ0RYc2Uf4mTbU73tHjALzjHnWMG1KxnsZ71SDzWk')" }}
            ></div>
            <div className="absolute inset-0 card-gradient"></div>
            <div className="absolute inset-x-0 bottom-0 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <span className="bg-white/10 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20 tracking-widest uppercase">
                  {nextWorkout.anzahlUebungen} Übungen
                </span>
                <span className="bg-primary/10 backdrop-blur-md text-primary text-[10px] font-black px-3 py-1 rounded-full border border-primary/30 tracking-widest uppercase">
                  45 Min
                </span>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-white mb-1">
                  {WOCHENTAGE[nextWorkout.wochentag]} – {nextWorkout.typ}
                </h3>
                <p className="text-slate-400 text-lg font-medium">{nextWorkout.name}</p>
              </div>
              <button
                onClick={() => router.push(`/training/${nextWorkout.id}/ausfuehren`)}
                className="w-full bg-primary hover:brightness-110 text-black font-black text-lg py-5 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.97] shadow-[0_0_25px_rgba(204,255,0,0.4)]"
              >
                <span className="material-symbols-outlined fill-1 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                <span>WORKOUT STARTEN</span>
              </button>
            </div>
          </div>
        )}

        {!plan.istDeload && deloadIn > 0 && (
          <div className="glass-panel rounded-2xl p-5 flex items-center gap-5">
            <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary text-2xl neon-glow-blue">event_repeat</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nächster Meilenstein</p>
              <p className="text-lg font-bold text-white">Deload Phase <span className="text-primary">in {deloadIn} Wochen</span></p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xl font-bold text-white">Wochenübersicht</h3>
            <span className="text-primary text-sm font-semibold">{completedCount}/{plan.einheiten.length} Details</span>
          </div>

          <div className="space-y-4">
            {plan.einheiten.map((einheit) => {
              const isExpanded = expandedEinheitId === einheit.id;
              const uebungen = einheitDetails[einheit.id] || [];

              return (
                <div
                  key={einheit.id}
                  className={cn(
                    "rounded-2xl transition-all overflow-hidden",
                    einheit.istAbgeschlossen
                      ? "bg-[#39ff14]/5 border border-[#39ff14]/10"
                      : "glass-panel"
                  )}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleEinheitExpand(einheit.id);
                    }}
                    className="flex items-center justify-between p-6 cursor-pointer"
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "rounded-xl flex items-center justify-center",
                        einheit.istAbgeschlossen
                          ? "bg-[#39ff14] text-black w-10 h-10 shadow-[0_0_15px_rgba(57,255,20,0.3)]"
                          : "w-10 h-10 border-2 border-slate-800 bg-slate-900/50 text-slate-400 font-black text-xs"
                      )}>
                        {einheit.istAbgeschlossen ? (
                          <span className="material-symbols-outlined font-black">done</span>
                        ) : (
                          WOCHENTAGE_KURZ[einheit.wochentag]
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          "font-bold text-lg",
                          einheit.istAbgeschlossen ? "text-slate-500 line-through" : "text-white"
                        )}>
                          {WOCHENTAGE[einheit.wochentag]} – {einheit.typ}
                        </p>
                        {einheit.istAbgeschlossen ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#39ff14] font-bold uppercase tracking-wider neon-glow-green">Abgeschlossen</span>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 font-medium">{einheit.name} • {einheit.anzahlUebungen} Übungen</p>
                        )}
                      </div>
                    </div>
                    {!einheit.istAbgeschlossen && (
                      <span className={cn(
                        "material-symbols-outlined text-slate-600 transition-transform",
                        isExpanded && "rotate-90"
                      )}>
                        chevron_right
                      </span>
                    )}
                  </div>

                  {/* Expandable exercise preview */}
                  {isExpanded && !einheit.istAbgeschlossen && (
                    <div className="px-6 pb-6 space-y-4">
                      <div className="border-t border-white/5 pt-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Übungen</p>
                        <div className="space-y-2">
                          {uebungen.map((uebung, idx) => (
                            <div
                              key={uebung.id}
                              className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/20 text-primary text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-sm font-medium text-white">{uebung.name}</span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {uebung.saetze} × {uebung.wiederholungen}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/training/${einheit.id}/ausfuehren`);
                        }}
                        className="w-full bg-primary hover:brightness-110 text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                      >
                        <span className="material-symbols-outlined text-xl">play_circle</span>
                        <span>Training starten</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <div className="px-6 mt-8 mb-4">
        <button
          onClick={handleGeneratePlan}
          disabled={generating}
          className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-2xl flex items-center justify-center gap-3 active:scale-[0.97] transition-all disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-blue-600">auto_awesome</span>
          <span className="tracking-tight uppercase text-sm">
            {generating ? "Plan wird erstellt..." : "Neuen KI-Plan generieren"}
          </span>
        </button>
      </div>

    </div>
  );
}
