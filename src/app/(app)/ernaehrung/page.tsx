"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
    <div className="space-y-4 animate-pulse px-6 pt-24">
      <div className="h-40 w-full rounded-[2rem] bg-card-dark border border-white/5" />
      <div className="h-28 w-full rounded-2xl bg-card-dark border border-white/5" />
      <div className="h-40 w-full rounded-2xl bg-card-dark border border-white/5" />
    </div>
  );
}

export default function ErnaehrungPage() {
  const router = useRouter();
  const [plan, setPlan] = useState<TagesplanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<string>>(new Set());

  const toggleMeal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompletedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

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

  if (loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col pb-48 bg-[#050505] text-slate-100">
        <header className="sticky top-0 z-50 glass-header px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
              <h1 className="text-3xl font-bold tracking-tight text-white">Ernährung</h1>
            </div>
          </div>
        </header>
        <SkeletonBlock />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="relative flex min-h-screen w-full flex-col pb-48 bg-[#050505] text-slate-100">
        <header className="sticky top-0 z-50 glass-header px-6 pt-14 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
              <h1 className="text-3xl font-bold tracking-tight text-white">Ernährung</h1>
            </div>
          </div>
        </header>
        <main className="px-6 flex flex-col items-center justify-center text-center mt-20 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">restaurant</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Noch kein Plan</h2>
          <p className="text-slate-400 text-sm max-w-[280px]">
            Lass dir einen personalisierten Ernährungsplan erstellen, der auf
            dein Trainingspensum und deine Ziele abgestimmt ist.
          </p>
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="w-full max-w-[280px] mt-8 bg-primary text-black font-black py-5 rounded-button flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-[0_8px_30px_rgb(0,245,255,0.2)]"
          >
            {generating ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="uppercase tracking-widest text-xs">Wird erstellt...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined font-bold">auto_awesome</span>
                <span className="uppercase tracking-widest text-xs">Plan generieren</span>
              </>
            )}
          </button>
        </main>
      </div>
    );
  }

  // Calculate Macros
  const currentKcal = plan.mahlzeiten.reduce((sum, m) => sum + m.kalorien, 0);
  const currentProtein = plan.mahlzeiten.reduce((sum, m) => sum + m.proteinG, 0);
  const currentCarbs = plan.mahlzeiten.reduce((sum, m) => sum + m.kohlenhydrateG, 0);
  const currentFat = plan.mahlzeiten.reduce((sum, m) => sum + m.fettG, 0);

  const targetKcal = plan.kalorien || 2200;
  const targetProtein = plan.proteinG || 160;
  const targetCarbs = plan.kohlenhydrateG || 350;
  const targetFat = plan.fettG || 85;

  const kcalPct = Math.min(100, Math.round((currentKcal / targetKcal) * 100));
  const kcalOffset = 578 - (578 * kcalPct) / 100;
  const proteinPct = Math.min(100, Math.round((currentProtein / targetProtein) * 100));
  const carbsPct = Math.min(100, Math.round((currentCarbs / targetCarbs) * 100));
  const fatPct = Math.min(100, Math.round((currentFat / targetFat) * 100));

  const gesamtLeucin = plan.leucinG ?? plan.mahlzeiten.reduce((sum, m) => sum + (m.leucinG ?? 0), 0);

  // Try to define Leucine Tracker entries (simulated for now based on meals)
  const mealsWithLeucine = plan.mahlzeiten.filter((m) => (m.leucinG ?? 0) >= 2.5);

  return (
    <div className="relative flex min-h-screen w-full flex-col pb-48 text-slate-100">
      <header className="sticky top-0 z-50 glass-header px-6 pt-14 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Ernährung</h1>
          </div>
          <div className="bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-primary">
              {plan.istTrainingstag ? "Trainingstag" : "Ruhetag"}
            </span>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-10 mt-6">
        {/* Macro Overview section */}
        <section className="bg-surface-dark rounded-[2rem] p-8 border border-card-border flex flex-col items-center">
          <div className="relative flex items-center justify-center w-52 h-52 mb-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                className="text-white/5"
                cx="104"
                cy="104"
                fill="transparent"
                r="92"
                stroke="currentColor"
                strokeWidth="14"
              />
              <circle
                className="text-primary"
                cx="104"
                cy="104"
                fill="transparent"
                r="92"
                stroke="currentColor"
                strokeDasharray="578"
                strokeDashoffset={kcalOffset}
                strokeLinecap="round"
                strokeWidth="14"
                style={{ filter: "drop-shadow(0 0 8px rgba(0, 245, 255, 0.3))", transition: "stroke-dashoffset 1s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-5xl font-extrabold tracking-tighter text-white leading-none">
                {currentKcal}
              </span>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
                kcal gesamt
              </span>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Protein</span>
                <span className="text-white font-bold">
                  {Math.round(currentProtein)}g <span className="text-slate-600 font-medium">/ {targetProtein}g</span>
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full shadow-[0_0_10px_rgba(0,245,255,0.4)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, proteinPct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Carbs</span>
                <span className="text-white font-bold">
                  {Math.round(currentCarbs)}g <span className="text-slate-600 font-medium">/ {targetCarbs}g</span>
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#CCFF00] rounded-full shadow-[0_0_10px_rgba(204,255,0,0.4)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, carbsPct)}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Fett</span>
                <span className="text-white font-bold">
                  {Math.round(currentFat)}g <span className="text-slate-600 font-medium">/ {targetFat}g</span>
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#39FF14] rounded-full shadow-[0_0_10px_rgba(57,255,20,0.4)] transition-all duration-1000"
                  style={{ width: `${Math.min(100, fatPct)}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Leucin Tracker section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight text-white/90">Leucin Tracker</h2>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Muskel-Protein-Synthese
            </span>
          </div>
          <div className="bg-surface-dark rounded-2xl p-6 border border-card-border">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-8 right-8 h-[2px] bg-white/5 top-7" />
              {[0, 1, 2].map((i) => {
                const meal = mealsWithLeucine[i];
                if (meal) {
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary leucin-glow-active flex items-center justify-center border border-primary/50 text-black">
                        <span className="material-symbols-outlined font-bold text-2xl">check</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-primary tracking-widest">
                        {meal.uhrzeit || "Mahlzeit"}
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-slate-600 text-2xl">nutrition</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-slate-600 tracking-widest">
                        {i === 2 ? "Abend" : `Mahlzeit ${i + 1}`}
                      </span>
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </section>

        {/* Tagesplan section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white/90">Tagesplan</h2>
          {plan.mahlzeiten.map((mahlzeit, index) => {
            const isPostWorkout = mahlzeit.istPostWorkout;

            return (
              <div key={mahlzeit.id} className={cn(
                "bg-surface-dark rounded-2xl border flex flex-col overflow-hidden transition-all",
                isPostWorkout ? "border-[#CCFF00]/30" : "border-white/5"
              )}>
                <div
                  onClick={() => setExpandedMealId(expandedMealId === mahlzeit.id ? null : mahlzeit.id)}
                  className={cn(
                    "p-6 flex justify-between items-center cursor-pointer hover:bg-white/[0.02] transition-colors",
                    completedMeals.has(mahlzeit.id) && "opacity-50 grayscale"
                  )}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      {isPostWorkout ? (
                        <span className="material-symbols-outlined zap-neon text-xl font-bold">bolt</span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                          {mahlzeit.uhrzeit || "Mahlzeit"}
                        </span>
                      )}
                      {isPostWorkout && (
                        <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest">
                          Nach Training
                        </span>
                      )}
                    </div>
                    <h3 className={cn(
                      "text-xl font-bold mt-1",
                      completedMeals.has(mahlzeit.id) ? "text-slate-400 line-through" : "text-white"
                    )}>{mahlzeit.name}</h3>
                    <p className="text-slate-500 text-sm font-medium mt-1 max-w-[200px] truncate">
                      {mahlzeit.rezept || "Kein konkretes Rezept hinterlegt"} • {mahlzeit.kalorien} kcal
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <button
                      onClick={(e) => toggleMeal(mahlzeit.id, e)}
                      className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300",
                        completedMeals.has(mahlzeit.id)
                          ? "bg-primary border-primary text-black"
                          : "border-white/20 text-transparent hover:border-primary/50"
                      )}
                    >
                      <span className="material-symbols-outlined text-sm font-bold">
                        check
                      </span>
                    </button>
                    <span className={cn(
                      "material-symbols-outlined text-slate-400 transition-transform duration-300",
                      expandedMealId === mahlzeit.id ? "rotate-90" : ""
                    )}>
                      chevron_right
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedMealId === mahlzeit.id && (
                  <div className="px-6 pb-6 pt-2 border-t border-white/5 mt-2 space-y-4">
                    <div className="bg-black/20 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-white mb-2">Makros</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-black text-primary">{mahlzeit.proteinG}g</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Protein</div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-[#CCFF00]">{mahlzeit.kohlenhydrateG}g</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Carbs</div>
                        </div>
                        <div>
                          <div className="text-lg font-black text-[#39FF14]">{mahlzeit.fettG}g</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Fett</div>
                        </div>
                      </div>
                    </div>

                    {mahlzeit.rezept && (
                      <div>
                        <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">restaurant_menu</span>
                          Rezept / Zutaten
                        </h4>
                        <div className="text-sm text-slate-400 whitespace-pre-wrap bg-white/5 rounded-xl p-4">
                          {mahlzeit.rezept}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        {/* Ergänzungen section */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight text-white/90">Ergänzungen</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-surface-dark rounded-2xl border border-card-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">pill</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Kreatin</h4>
                  <p className="text-xs text-slate-500 font-medium">0.1g/kg Körpergewicht</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-black hover:border-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-lg font-bold">check</span>
              </div>
            </div>

            <div className="bg-surface-dark rounded-2xl border border-card-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">pill</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">Vitamin D</h4>
                  <p className="text-xs text-slate-500 font-medium">2000-4000 IU täglich</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-slate-600 hover:bg-primary hover:text-black hover:border-primary transition-colors cursor-pointer">
                <span className="material-symbols-outlined text-lg font-bold">check</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Action Buttons Container */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-6 pb-2 pt-6 glass-header bg-gradient-to-t from-[#050505] to-transparent pointer-events-none">
        <div className="flex flex-col gap-3 max-w-lg mx-auto mb-2 pointer-events-auto">
          <button
            onClick={handleGeneratePlan}
            disabled={generating}
            className="w-full bg-primary text-black font-black py-5 rounded-button flex items-center justify-center gap-3 transition-transform active:scale-95 shadow-[0_8px_30px_rgb(0,245,255,0.2)]"
          >
            {generating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="material-symbols-outlined font-bold">auto_awesome</span>
            )}
            <span className="uppercase tracking-widest text-xs">
              {generating ? "Wird generiert..." : "Neuen Plan generieren"}
            </span>
          </button>
          <button
            onClick={() => router.push("/ernaehrung/einkaufsliste")}
            className="w-full bg-white/5 border border-white/10 text-white font-bold py-4 rounded-button flex items-center justify-center gap-3 transition-transform active:scale-95"
          >
            <span className="material-symbols-outlined text-slate-400">shopping_cart</span>
            <span className="uppercase tracking-widest text-[10px]">Einkaufsliste öffnen</span>
          </button>
        </div>
      </div>
    </div>
  );
}
