"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TrendingUp, Scale, BarChart3, Heart } from "lucide-react";

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

// ── Chart colors ──
const CHART_COLORS = {
  primary: "hsl(221, 83%, 53%)",
  secondary: "hsl(142, 71%, 45%)",
  accent: "hsl(262, 83%, 58%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
};

// ── Skeleton ──
function ChartSkeleton() {
  return (
    <div className="h-[300px] w-full animate-pulse bg-muted rounded-xl flex items-center justify-center">
      <span className="text-muted-foreground text-sm">Laden...</span>
    </div>
  );
}

// ── Empty State ──
function EmptyState({ message }: { message: string }) {
  return (
    <div className="h-[300px] w-full flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <TrendingUp className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
        {message}
      </p>
    </div>
  );
}

// ── Format date for axis ──
function formatDatum(datum: string) {
  const d = new Date(datum);
  return `${d.getDate()}.${d.getMonth() + 1}`;
}

// ── Kraft Tab ──
function KraftTab({ data }: { data: KraftDaten[] }) {
  const [selectedUebung, setSelectedUebung] = useState<string>("");

  useEffect(() => {
    if (data.length > 0 && !selectedUebung) {
      setSelectedUebung(data[0].uebungName);
    }
  }, [data, selectedUebung]);

  if (data.length === 0) {
    return (
      <EmptyState message="Noch keine Kraftdaten vorhanden. Absolviere dein erstes Workout, um deine Kraftentwicklung zu sehen." />
    );
  }

  const chartData =
    data.find((d) => d.uebungName === selectedUebung)?.daten || [];

  return (
    <div className="space-y-4">
      <Select value={selectedUebung} onValueChange={setSelectedUebung}>
        <SelectTrigger className="w-full min-h-[48px]">
          <SelectValue placeholder="Uebung waehlen" />
        </SelectTrigger>
        <SelectContent>
          {data.map((d) => (
            <SelectItem key={d.uebungName} value={d.uebungName}>
              {d.uebungName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {chartData.length === 0 ? (
        <EmptyState message="Keine Daten fuer diese Uebung vorhanden." />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Geschaetztes 1RM - {selectedUebung}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                <XAxis
                  dataKey="datum"
                  tickFormatter={formatDatum}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                  unit=" kg"
                />
                <Tooltip
                  labelFormatter={(l) => `Datum: ${l}`}
                  formatter={(value) => [`${value} kg`, "1RM"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(0, 0%, 90%)",
                    fontSize: "14px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="geschaetztes1RM"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS.primary }}
                  activeDot={{ r: 6 }}
                  name="Geschaetztes 1RM"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Koerper Tab ──
function KoerperTab({ data }: { data: KoerperEintrag[] }) {
  if (data.length === 0) {
    return (
      <EmptyState message="Noch keine Koerperdaten vorhanden. Trage deine Masse im Profil ein, um deinen Fortschritt zu verfolgen." />
    );
  }

  const gewichtData = data.filter((d) => d.gewicht != null);
  const umfangData = data.filter(
    (d) =>
      d.brustumfang != null ||
      d.taillenumfang != null ||
      d.oberarmumfang != null
  );

  return (
    <div className="space-y-4">
      {gewichtData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Koerpergewicht</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gewichtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                <XAxis
                  dataKey="datum"
                  tickFormatter={formatDatum}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                  unit=" kg"
                  domain={["dataMin - 2", "dataMax + 2"]}
                />
                <Tooltip
                  labelFormatter={(l) => `Datum: ${l}`}
                  formatter={(value) => [`${value} kg`, "Gewicht"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(0, 0%, 90%)",
                    fontSize: "14px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="gewicht"
                  stroke={CHART_COLORS.secondary}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: CHART_COLORS.secondary }}
                  activeDot={{ r: 6 }}
                  name="Gewicht"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {umfangData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Koerperumfaenge</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={umfangData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
                <XAxis
                  dataKey="datum"
                  tickFormatter={formatDatum}
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(0, 0%, 60%)"
                  unit=" cm"
                />
                <Tooltip
                  labelFormatter={(l) => `Datum: ${l}`}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(0, 0%, 90%)",
                    fontSize: "14px",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="brustumfang"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Brust"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="taillenumfang"
                  stroke={CHART_COLORS.warning}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Taille"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="oberarmumfang"
                  stroke={CHART_COLORS.accent}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Oberarm"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Volumen Tab ──
function VolumenTab({ data }: { data: VolumenEintrag[] }) {
  if (data.length === 0) {
    return (
      <EmptyState message="Noch keine Volumendaten vorhanden. Dein woechentliches Trainingsvolumen wird nach den ersten Workouts sichtbar." />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Woechentliches Trainingsvolumen</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
            <XAxis
              dataKey="woche"
              tickFormatter={formatDatum}
              tick={{ fontSize: 12 }}
              stroke="hsl(0, 0%, 60%)"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              stroke="hsl(0, 0%, 60%)"
              tickFormatter={(v) =>
                v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)
              }
            />
            <Tooltip
              labelFormatter={(l) => `Woche ab ${l}`}
              formatter={(value) => [
                `${Number(value).toLocaleString("de-DE")} kg`,
                "Volumen",
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(0, 0%, 90%)",
                fontSize: "14px",
              }}
            />
            <Bar
              dataKey="volumen"
              fill={CHART_COLORS.accent}
              radius={[6, 6, 0, 0]}
              name="Volumen (kg)"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Wellness Tab ──
function WellnessTab({ data }: { data: WellnessEintrag[] }) {
  if (data.length === 0) {
    return (
      <EmptyState message="Noch keine Wellness-Daten vorhanden. Fuehre deinen ersten Check-in durch, um Trends zu erkennen." />
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Wellness (letzte 30 Tage)</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 88%)" />
            <XAxis
              dataKey="datum"
              tickFormatter={formatDatum}
              tick={{ fontSize: 12 }}
              stroke="hsl(0, 0%, 60%)"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 12 }}
              stroke="hsl(0, 0%, 60%)"
            />
            <Tooltip
              labelFormatter={(l) => `Datum: ${l}`}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid hsl(0, 0%, 90%)",
                fontSize: "14px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="schlafQualitaet"
              stroke={CHART_COLORS.primary}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Schlaf"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="energie"
              stroke={CHART_COLORS.secondary}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Energie"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="stress"
              stroke={CHART_COLORS.danger}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Stress"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="muskelkater"
              stroke={CHART_COLORS.warning}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Muskelkater"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="stimmung"
              stroke={CHART_COLORS.accent}
              strokeWidth={2}
              dot={{ r: 2 }}
              name="Stimmung"
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Main Page ──

export default function FortschrittPage() {
  const router = useRouter();
  const [data, setData] = useState<FortschrittData | null>(null);
  const [loading, setLoading] = useState(true);

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
    <>
      <Header title="Fortschritt" />
      <PageContainer>
        <Tabs defaultValue="kraft" className="w-full">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="kraft" className="min-h-[48px] gap-1.5">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Kraft</span>
            </TabsTrigger>
            <TabsTrigger value="koerper" className="min-h-[48px] gap-1.5">
              <Scale className="h-4 w-4" />
              <span className="text-xs">Koerper</span>
            </TabsTrigger>
            <TabsTrigger value="volumen" className="min-h-[48px] gap-1.5">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Volumen</span>
            </TabsTrigger>
            <TabsTrigger value="wellness" className="min-h-[48px] gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="text-xs">Wellness</span>
            </TabsTrigger>
          </TabsList>

          {loading ? (
            <div className="mt-4">
              <ChartSkeleton />
            </div>
          ) : (
            <>
              <TabsContent value="kraft" className="mt-4">
                <KraftTab data={data?.kraftDaten || []} />
              </TabsContent>
              <TabsContent value="koerper" className="mt-4">
                <KoerperTab data={data?.koerperDaten || []} />
              </TabsContent>
              <TabsContent value="volumen" className="mt-4">
                <VolumenTab data={data?.volumenDaten || []} />
              </TabsContent>
              <TabsContent value="wellness" className="mt-4">
                <WellnessTab data={data?.wellnessDaten || []} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </PageContainer>
    </>
  );
}
