"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, Check, Moon, Zap, Brain, Flame, Smile } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";

// ── Types ──

interface WellnessLog {
  datum: string;
  schlafStunden: number | null;
  schlafQualitaet: number | null;
  energie: number | null;
  stress: number | null;
  muskelkater: number | null;
  stimmung: number | null;
  notiz: string | null;
}

interface WellnessFormData {
  schlafStunden: number;
  schlafQualitaet: number;
  energie: number;
  stress: number;
  muskelkater: number;
  stimmung: number;
  notiz: string;
}

// ── Metric configs ──
const METRICS = [
  { key: "schlafQualitaet" as const, label: "Schlaf", icon: "bedtime", colorClass: "text-blue-400", bgClass: "bg-blue-500/20", activeClass: "border-blue-500 bg-blue-500/10", sparkColor: "#3b82f6" },
  { key: "energie" as const, label: "Energie", icon: "bolt", colorClass: "text-yellow-500", bgClass: "bg-yellow-500/20", activeClass: "border-yellow-500 bg-yellow-500/10", sparkColor: "#eab308" },
  { key: "stress" as const, label: "Stress", icon: "psychology", colorClass: "text-red-500", bgClass: "bg-red-500/20", activeClass: "border-red-500 bg-red-500/10", sparkColor: "#ef4444" },
  { key: "muskelkater" as const, label: "Muskelkater", icon: "local_fire_department", colorClass: "text-orange-500", bgClass: "bg-orange-500/20", activeClass: "border-orange-500 bg-orange-500/10", sparkColor: "#f97316" },
  { key: "stimmung" as const, label: "Stimmung", icon: "sentiment_satisfied", colorClass: "text-purple-400", bgClass: "bg-purple-500/20", activeClass: "border-purple-500 bg-purple-500/10", sparkColor: "#a855f7" },
];

function Sparkline({
  data,
  dataKey,
  color,
}: {
  data: WellnessLog[];
  dataKey: string;
  color: string;
}) {
  if (data.length < 2) return null;

  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [last7Days, setLast7Days] = useState<WellnessLog[]>([]);
  const [whoopDataAvailable, setWhoopDataAvailable] = useState(false);
  const [whoopDetails, setWhoopDetails] = useState<{ recovery?: number; hrv?: number }>({});
  const [form, setForm] = useState<WellnessFormData>({
    schlafStunden: 7,
    schlafQualitaet: 3,
    energie: 3,
    stress: 3,
    muskelkater: 3,
    stimmung: 3,
    notiz: "",
  });

  const loadData = useCallback(() => {
    fetch("/api/wellness/save")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          throw new Error("Fetch failed");
        }
        return res.json();
      })
      .then((data) => {
        setLast7Days(data.logs || []);

        if (data.whoopData && !data.todayLog) {
          setWhoopDataAvailable(true);
          const recovery = data.whoopData.whoopRecovery;
          const hrv = data.whoopData.whoopHRV;
          setWhoopDetails({ recovery, hrv });

          const qualityFromRecovery = recovery
            ? Math.min(5, Math.max(1, Math.round((recovery / 100) * 5)))
            : 3;
          const energieFromRecovery = recovery
            ? Math.min(5, Math.max(1, Math.round((recovery / 100) * 5)))
            : 3;

          setForm({
            schlafStunden: data.whoopData.schlafStunden ?? 7,
            schlafQualitaet: qualityFromRecovery,
            energie: energieFromRecovery,
            stress: 3,
            muskelkater: 3,
            stimmung: 3,
            notiz: `Von WHOOP importiert (Recovery: ${recovery}%${hrv ? `, HRV: ${hrv}ms` : ""})`,
          });
        } else if (data.todayLog) {
          setWhoopDataAvailable(false);
          setForm({
            schlafStunden: data.todayLog.schlafStunden ?? 7,
            schlafQualitaet: data.todayLog.schlafQualitaet ?? 3,
            energie: data.todayLog.energie ?? 3,
            stress: data.todayLog.stress ?? 3,
            muskelkater: data.todayLog.muskelkater ?? 3,
            stimmung: data.todayLog.stimmung ?? 3,
            notiz: data.todayLog.notiz ?? "",
          });
        } else {
          setWhoopDataAvailable(false);
        }
      })
      .catch((err) => console.error("Wellness fetch error:", err))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/wellness/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schlafStunden: form.schlafStunden,
          schlafQualitaet: form.schlafQualitaet,
          energie: form.energie,
          stress: form.stress,
          muskelkater: form.muskelkater,
          stimmung: form.stimmung,
          notiz: form.notiz || null,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Wellness-Check-in gespeichert!");
      router.back();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const showSchlafWarning = form.schlafStunden < 6 || form.energie <= 2;

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#101622] text-slate-100 font-display">
        <header className="sticky top-0 z-20 bg-[#101622]/80 backdrop-blur-md px-6 pt-8 pb-4 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-100">Wellness Check-in</h1>
              <p className="text-primary font-medium text-sm">Laden...</p>
            </div>
          </div>
        </header>
        <div className="flex-1 px-6 pt-6 space-y-8 flex items-center justify-center">
          <div className="animate-pulse text-slate-500">Log wird geladen...</div>
        </div>
      </div>
    );
  }

  const todayStr = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long' }).format(new Date());

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#101622] text-slate-100 overflow-x-hidden pb-32 font-display">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#101622]/80 backdrop-blur-md px-6 pt-8 pb-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Wellness Check-in</h1>
            <p className="text-primary font-medium text-sm">Heute, {todayStr}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="bg-slate-800 p-2 rounded-full flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-slate-400">close</span>
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 space-y-8">
        {/* Warnungen / Auto-Import */}
        {showSchlafWarning && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-amber-500 shrink-0">warning</span>
            <div className="space-y-1">
              <p className="text-amber-200 text-sm leading-relaxed">
                Dein Energie-/Schlaflevel ist niedrig. Wir empfehlen ein reduziertes Trainingsvolumen heute.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 min-h-[40px] border-amber-500/40 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg"
                onClick={() => router.push("/training")}
              >
                Plan anpassen
              </Button>
            </div>
          </div>
        )}

        {whoopDataAvailable && !showSchlafWarning && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-green-500 shrink-0">check_circle</span>
            <p className="text-green-400 text-sm leading-relaxed">
              Daten (Recovery: {whoopDetails.recovery}%) von WHOOP importiert!
            </p>
          </div>
        )}

        {/* Dynamic Metric Sections */}
        {METRICS.map((m) => (
          <section key={m.key} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", m.bgClass, m.colorClass)}>
                  <span className="material-symbols-outlined">{m.icon}</span>
                </div>
                <h2 className="text-lg font-semibold">{m.label}</h2>
              </div>
              <div className="flex items-end gap-1 h-6">
                {[1, 2, 3, 4, 5, 6, 7].map((bar, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full",
                      i % 2 === 0 ? "h-3" : i % 3 === 0 ? "h-5" : "h-1",
                      form[m.key] >= Math.ceil(i / 1.5) ? m.bgClass.replace('/20', '') : m.bgClass.replace('/10', '/30')
                    )}
                  />
                ))}
              </div>
            </div>

            <p className="text-slate-400 text-sm">
              {m.key === "schlafQualitaet" && "Wie hast du geschlafen?"}
              {m.key === "energie" && "Wie ist dein Energielevel?"}
              {m.key === "stress" && "Wie gestresst fühlst du dich?"}
              {m.key === "muskelkater" && "Hast du heute Muskelkater?"}
              {m.key === "stimmung" && "Wie ist deine Stimmung?"}
            </p>

            <div className="flex justify-between items-center gap-2">
              {[1, 2, 3, 4, 5].map((val) => (
                <label key={val} className="relative flex-1 group cursor-pointer">
                  <input
                    type="radio"
                    name={m.key}
                    className="peer hidden"
                    checked={form[m.key] === val}
                    onChange={() => setForm(f => ({ ...f, [m.key]: val }))}
                  />
                  <div className={cn(
                    "h-12 flex items-center justify-center rounded-xl bg-slate-800 border-2 border-transparent transition-all",
                    m.activeClass.split(" ").map(c => `peer-checked:${c}`).join(" ")
                  )}>
                    <span className="text-lg font-bold group-hover:scale-110 transition-transform">{val}</span>
                  </div>
                </label>
              ))}
            </div>
            {m.key === "schlafQualitaet" && (
              <div className="flex justify-between text-[10px] uppercase tracking-widest text-slate-500 font-bold px-1">
                <span>Sehr schlecht</span>
                <span>Sehr gut</span>
              </div>
            )}
          </section>
        ))}

        {/* Numeric Inputs */}
        <section className="grid grid-cols-1 gap-6 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Schlafstunden</label>
            <div className="relative flex items-center">
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                value={form.schlafStunden}
                onChange={(e) => setForm((f) => ({ ...f, schlafStunden: parseFloat(e.target.value) || 0 }))}
                className="w-full bg-slate-800 border-none rounded-xl h-14 px-4 text-xl font-bold text-slate-100 focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <div className="absolute right-4 text-slate-500 font-medium">Std</div>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Notiz (optional)</label>
            <textarea
              value={form.notiz}
              onChange={(e) => setForm(f => ({ ...f, notiz: e.target.value }))}
              className="w-full bg-slate-800 border-none rounded-xl p-4 text-base focus:ring-2 focus:ring-primary h-32 resize-none focus:outline-none placeholder-slate-600"
              placeholder="Wie fühlst du dich heute sonst noch?"
            />
          </div>
        </section>

        {/* WissenschaftSnippet & Last 7 days */}
        <div className="pt-4 pb-8 space-y-8">
          <WissenschaftSnippet titel="Warum Schlaf so wichtig ist">
            Schlaf ist der wichtigste Regenerationsfaktor. Bei weniger als 6
            Stunden Schlaf sinkt die Muskelproteinsynthese um 18% und das
            Verletzungsrisiko steigt um 60%. Für optimale Regeneration und
            Muskelaufbau sollten Männer über 50 mindestens 7-8 Stunden
            qualitativ hochwertigen Schlaf anstreben.
          </WissenschaftSnippet>

          {last7Days.length >= 2 && (
            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
              <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Letzte 7 Tage</h3>
              <div className="space-y-4">
                {METRICS.map((m) => (
                  <div key={m.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("material-symbols-outlined text-sm", m.colorClass)}>{m.icon}</span>
                      <span className="text-sm font-medium text-slate-300">{m.label}</span>
                    </div>
                    <Sparkline data={last7Days} dataKey={m.key} color={m.sparkColor} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Footer Area */}
      <div className="fixed bottom-0 left-0 right-0 z-30 max-w-md mx-auto">
        <div className="p-6 bg-gradient-to-t from-[#101622] via-[#101622] to-transparent">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] uppercase tracking-widest text-sm"
          >
            {saving ? "Wird gespeichert..." : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
