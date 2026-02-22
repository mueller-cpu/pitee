"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

// ── Types ──

interface KraftEintrag {
  datum: string;
  geschaetztes1RM: number;
}

interface KraftDaten {
  uebungName: string;
  daten: KraftEintrag[];
}

interface KoerperEintrag {
  datum: string;
  gewicht: number | null;
  koerperfett: number | null;
  brustumfang: number | null;
  taillenumfang: number | null;
  oberarmumfang: number | null;
  oberschenkelumfang: number | null;
}

interface VolumenEintrag {
  woche: string;
  volumen: number;
}

interface WellnessEintrag {
  datum: string;
  schlafStunden: number | null;
  schlafQualitaet: number | null;
  energie: number | null;
  stress: number | null;
  muskelkater: number | null;
  stimmung: number | null;
}

interface FortschrittData {
  kraftDaten: KraftDaten[];
  koerperDaten: KoerperEintrag[];
  volumenDaten: VolumenEintrag[];
  wellnessDaten: WellnessEintrag[];
}

// ── Colors matching the new design ──
const COLORS = [
  { stroke: "#00F5FF", bg: "bg-[#00F5FF]/10", text: "text-[#00F5FF]", border: "border-[#00F5FF]/20", glow: "chart-glow-blue" },
  { stroke: "#39FF14", bg: "bg-[#39FF14]/10", text: "text-[#39FF14]", border: "border-[#39FF14]/20", glow: "chart-glow-green" },
  { stroke: "#BC13FE", bg: "bg-[#BC13FE]/10", text: "text-[#BC13FE]", border: "border-[#BC13FE]/20", glow: "chart-glow-purple" },
  { stroke: "#FF3366", bg: "bg-[#FF3366]/10", text: "text-[#FF3366]", border: "border-[#FF3366]/20", glow: "chart-glow-purple" }, // fallback
];

const TABS = [
  { key: "kraft", label: "Kraft" },
  { key: "koerper", label: "Körper" },
  { key: "volumen", label: "Volumen" },
  { key: "wellness", label: "Wellness" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-card-dark animate-pulse" />
        ))}
      </div>
      <div className="h-[200px] w-full animate-pulse bg-card-dark rounded-2xl" />
      <div className="h-[200px] w-full animate-pulse bg-card-dark rounded-2xl" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-card-dark border border-white/5 rounded-2xl">
      <span className="material-symbols-outlined text-4xl text-slate-500 mb-3">query_stats</span>
      <p className="text-slate-400 text-sm leading-relaxed max-w-xs">{message}</p>
    </div>
  );
}

function formatDatum(datum: string) {
  const d = new Date(datum);
  return `W${d.getDate().toString().padStart(2, '0')}`; // mimicking the W01 style loosely
}

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.1)",
  fontSize: "12px",
  backgroundColor: "#0F0F12",
  color: "#fff",
};

// ── Kraft Tab ──
function KraftTab({ data }: { data: KraftDaten[] }) {
  if (data.length === 0) {
    return <EmptyState message="Noch keine Kraftdaten vorhanden. Absolviere Workouts, um deine Fortschritte zu sehen." />;
  }

  // Calculate stats for summary cards
  let bestUebung = "–";
  let bestProgress = -1000;
  let totalProgress = 0;
  let validExercises = 0;

  const enrichedData = data.map((d, index) => {
    const arr = d.daten;
    const firstValue = arr.length > 0 ? arr[0].geschaetztes1RM : 0;
    const lastValue = arr.length > 0 ? arr[arr.length - 1].geschaetztes1RM : 0;
    const progressPercent = firstValue > 0 ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0;

    if (progressPercent > bestProgress) {
      bestProgress = progressPercent;
      bestUebung = d.uebungName;
    }
    if (firstValue > 0) {
      totalProgress += progressPercent;
      validExercises++;
    }

    return {
      ...d,
      lastValue,
      progressPercent,
      color: COLORS[index % COLORS.length]
    };
  });

  const avgProgress = validExercises > 0 ? (totalProgress / validExercises).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Beste Übung</p>
          <p className="text-white text-lg font-bold truncate">{bestUebung}</p>
          <p className="text-4xl font-black mt-1 text-[#39FF14] tabular-nums">
            {bestProgress > 0 ? "+" : ""}{bestProgress}%
          </p>
        </div>
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Ø Zuwachs</p>
          <p className="text-white text-lg font-bold">Gesamt</p>
          <p className="text-4xl font-black mt-1 text-white tabular-nums">
            {avgProgress}%
          </p>
        </div>
      </div>

      {enrichedData.map((d, index) => (
        <section key={d.uebungName} className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{d.uebungName} (1RM)</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{d.lastValue}<span className="text-lg font-medium text-slate-500 ml-1">kg</span></span>
                {d.progressPercent !== 0 && (
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 border", d.color.bg, d.color.text, d.color.border)}>
                    <span className="material-symbols-outlined text-[10px] font-black">
                      {d.progressPercent >= 0 ? "arrow_upward" : "arrow_downward"}
                    </span>
                    {Math.abs(d.progressPercent)}%
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative h-48 w-full bg-[#0F0F12] rounded-2xl border border-white/5 p-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.daten} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="datum"
                  tickFormatter={formatDatum}
                  tick={{ fontSize: 10, fill: "#475569", fontWeight: 800 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 5', 'dataMax + 5']}
                  tick={{ fontSize: 10, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  labelFormatter={(l) => `Datum: ${new Date(l).toLocaleDateString()}`}
                  formatter={(value) => [`${value} kg`, "1RM"]}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="geschaetztes1RM"
                  stroke={d.color.stroke}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, fill: d.color.stroke, strokeWidth: 0 }}
                  className={d.color.glow}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      ))}
    </div>
  );
}

// ── Koerper Tab ──
function KoerperTab({ data }: { data: KoerperEintrag[] }) {
  if (data.length === 0) return <EmptyState message="Noch keine Körperdaten vorhanden." />;

  const gewichtData = data.filter((d) => d.gewicht != null);
  const latestWeight = gewichtData.length > 0 ? gewichtData[gewichtData.length - 1].gewicht : null;
  const firstWeight = gewichtData.length > 1 ? gewichtData[0].gewicht : null;
  const weightDiff = latestWeight && firstWeight ? +(latestWeight - firstWeight).toFixed(1) : null;

  return (
    <div className="space-y-8">
      {gewichtData.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Körpergewicht</h3>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-white">{latestWeight}<span className="text-lg font-medium text-slate-500 ml-1">kg</span></span>
                {weightDiff !== null && weightDiff !== 0 && (
                  <span className={cn("px-2 py-0.5 rounded text-[10px] font-black flex items-center gap-1 border",
                    weightDiff > 0 ? "bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20" : "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/20")}>
                    <span className="material-symbols-outlined text-[10px] font-black">
                      {weightDiff > 0 ? "arrow_upward" : "arrow_downward"}
                    </span>
                    {Math.abs(weightDiff)}kg
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative h-48 w-full bg-[#0F0F12] rounded-2xl border border-white/5 p-4 overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gewichtData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="datum" tickFormatter={formatDatum} tick={{ fontSize: 10, fill: "#475569", fontWeight: 800 }} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="gewicht" stroke="#00F5FF" strokeWidth={3} dot={false} className="chart-glow-blue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </div>
  );
}

// ── Volumen Tab ──
function VolumenTab({ data }: { data: VolumenEintrag[] }) {
  if (data.length === 0) return <EmptyState message="Noch keine Volumendaten vorhanden." />;

  const totalVolumen = data.reduce((sum, d) => sum + d.volumen, 0);
  const avgVolumen = Math.round(totalVolumen / data.length);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Gesamt Volumen</p>
          <p className="text-3xl font-black mt-1 text-[#BC13FE] tabular-nums">
            {totalVolumen >= 1000 ? `${(totalVolumen / 1000).toFixed(1)}k` : totalVolumen} <span className="text-sm font-medium text-slate-500">kg</span>
          </p>
        </div>
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Ø pro Woche</p>
          <p className="text-3xl font-black mt-1 text-white tabular-nums">
            {avgVolumen >= 1000 ? `${(avgVolumen / 1000).toFixed(1)}k` : avgVolumen} <span className="text-sm font-medium text-slate-500">kg</span>
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Wöchentliches Trainingsvolumen</h3>
        <div className="relative h-48 w-full bg-[#0F0F12] rounded-2xl border border-white/5 p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="woche" tickFormatter={formatDatum} tick={{ fontSize: 10, fill: "#475569", fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Bar dataKey="volumen" fill="#BC13FE" radius={[4, 4, 0, 0]} className="chart-glow-purple" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ── Wellness Tab ──
function WellnessTab({ data }: { data: WellnessEintrag[] }) {
  if (data.length === 0) return <EmptyState message="Noch keine Wellness-Daten vorhanden." />;

  const avgSchlaf = data.filter(d => d.schlafQualitaet).reduce((s, d) => s + (d.schlafQualitaet ?? 0), 0) / (data.filter(d => d.schlafQualitaet).length || 1);
  const avgEnergie = data.filter(d => d.energie).reduce((s, d) => s + (d.energie ?? 0), 0) / (data.filter(d => d.energie).length || 1);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Ø Schlafqualität</p>
          <p className="text-3xl font-black mt-1 text-[#00F5FF] tabular-nums">
            {avgSchlaf.toFixed(1)} <span className="text-sm font-medium text-slate-500">/5</span>
          </p>
        </div>
        <div className="bg-[#0F0F12] border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Ø Energie</p>
          <p className="text-3xl font-black mt-1 text-[#39FF14] tabular-nums">
            {avgEnergie.toFixed(1)} <span className="text-sm font-medium text-slate-500">/5</span>
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Wellness Trends</h3>
        <div className="relative h-48 w-full bg-[#0F0F12] rounded-2xl border border-white/5 p-4 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="datum" tickFormatter={(v) => new Date(v).getDate().toString()} tick={{ fontSize: 10, fill: "#475569", fontWeight: 800 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: "#475569" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="schlafQualitaet" stroke="#00F5FF" strokeWidth={3} dot={false} name="Schlaf" className="chart-glow-blue" />
              <Line type="monotone" dataKey="energie" stroke="#39FF14" strokeWidth={3} dot={false} name="Energie" className="chart-glow-green" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

// ── Main Page ──
export default function FortschrittPage() {
  const router = useRouter();
  const [data, setData] = useState<FortschrittData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("kraft");

  useEffect(() => {
    fetch("/api/fortschritt/daten")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          throw new Error("Fetch failed");
        }
        return res.json();
      })
      .then((d) => setData(d))
      .catch((err) => console.error("Fortschritt fetch error:", err))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="relative flex min-h-screen w-full flex-col pb-32">
      <header className="sticky top-0 z-50 bg-[#050505]/80 ios-blur px-6 py-5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Fortschritt</h1>
        </div>
      </header>

      <nav className="mt-4 px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-8 border-b border-white/5 w-max pr-6">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative pb-3 text-sm tracking-widest uppercase transition-all whitespace-nowrap",
                  isActive ? "font-bold text-[#00F5FF]" : "font-bold text-slate-500 hover:text-slate-300"
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#00F5FF] shadow-[0_0_8px_#00F5FF]"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="px-6 mt-8">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <>
            {activeTab === "kraft" && <KraftTab data={data?.kraftDaten || []} />}
            {activeTab === "koerper" && <KoerperTab data={data?.koerperDaten || []} />}
            {activeTab === "volumen" && <VolumenTab data={data?.volumenDaten || []} />}
            {activeTab === "wellness" && <WellnessTab data={data?.wellnessDaten || []} />}
          </>
        )}
      </main>
    </div>
  );
}
