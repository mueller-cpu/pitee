"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import WissenschaftSnippet from "@/components/shared/WissenschaftSnippet";
import {
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { AlertTriangle, Check, Moon, Zap, Brain, Flame, Smile } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// ── Rating labels ──
const RATING_LABELS: Record<number, string> = {
  1: "Sehr schlecht",
  2: "Schlecht",
  3: "Mittel",
  4: "Gut",
  5: "Sehr gut",
};

// ── Metric configs ──
const METRICS = [
  { key: "schlafQualitaet" as const, label: "Schlafqualitaet", icon: Moon, color: "hsl(221, 83%, 53%)" },
  { key: "energie" as const, label: "Energie", icon: Zap, color: "hsl(142, 71%, 45%)" },
  { key: "stress" as const, label: "Stress", icon: Brain, color: "hsl(0, 84%, 60%)" },
  { key: "muskelkater" as const, label: "Muskelkater", icon: Flame, color: "hsl(38, 92%, 50%)" },
  { key: "stimmung" as const, label: "Stimmung", icon: Smile, color: "hsl(262, 83%, 58%)" },
];

// ── Rating Circle Selector ──
function RatingSelector({
  value,
  onChange,
  label,
  icon: Icon,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <Label className="text-sm font-medium">{label}</Label>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex items-center justify-center",
              "w-12 h-12 rounded-full",
              "text-sm font-semibold",
              "transition-all duration-200",
              "border-2",
              n <= value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-muted hover:border-primary/50"
            )}
            aria-label={`${label}: ${n} - ${RATING_LABELS[n]}`}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{RATING_LABELS[value]}</p>
    </div>
  );
}

// ── Mini Sparkline ──
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

// ── Main Page ──

export default function WellnessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [last7Days, setLast7Days] = useState<WellnessLog[]>([]);
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

        // Pre-fill form if today's log exists
        if (data.todayLog) {
          setForm({
            schlafStunden: data.todayLog.schlafStunden ?? 7,
            schlafQualitaet: data.todayLog.schlafQualitaet ?? 3,
            energie: data.todayLog.energie ?? 3,
            stress: data.todayLog.stress ?? 3,
            muskelkater: data.todayLog.muskelkater ?? 3,
            stimmung: data.todayLog.stimmung ?? 3,
            notiz: data.todayLog.notiz ?? "",
          });
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
      loadData();
    } catch {
      toast.error("Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  // Schlaf-Impact warning conditions
  const showSchlafWarning = form.schlafStunden < 6 || form.energie <= 2;

  if (loading) {
    return (
      <>
        <Header title="Wellness Check-in" />
        <PageContainer>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse bg-muted rounded-xl"
              />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Wellness Check-in" showBack />
      <PageContainer>
        <div className="space-y-6">
          {/* Schlafstunden */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-muted-foreground" />
                  <Label className="text-sm font-medium">
                    Schlafstunden
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    max={24}
                    step={0.5}
                    value={form.schlafStunden}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        schlafStunden: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-24 min-h-[48px] text-center text-lg font-semibold"
                  />
                  <span className="text-muted-foreground text-sm">Stunden</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ratings */}
          <Card>
            <CardContent className="p-4 space-y-6">
              {METRICS.map((m) => (
                <RatingSelector
                  key={m.key}
                  value={form[m.key]}
                  onChange={(v) => setForm((f) => ({ ...f, [m.key]: v }))}
                  label={m.label}
                  icon={m.icon}
                />
              ))}
            </CardContent>
          </Card>

          {/* Schlaf-Impact Warning */}
          {showSchlafWarning && (
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Schlaf-Impact erkannt
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
                      Basierend auf deinem Schlaf/Energie-Level empfehlen wir
                      heute ein reduziertes Trainingsvolumen (60-70%). Moechtest
                      du den heutigen Plan anpassen?
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-[48px] border-yellow-500 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-100 dark:hover:bg-yellow-900/30"
                      onClick={() => router.push("/training")}
                    >
                      Plan anpassen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <Label className="text-sm font-medium">Notizen (optional)</Label>
              <Textarea
                value={form.notiz}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notiz: e.target.value }))
                }
                placeholder="Wie fuehlt sich dein Koerper heute an?"
                className="min-h-[80px] resize-none"
              />
            </CardContent>
          </Card>

          {/* WissenschaftSnippet */}
          <WissenschaftSnippet titel="Warum Schlaf so wichtig ist">
            Schlaf ist der wichtigste Regenerationsfaktor. Bei weniger als 6
            Stunden Schlaf sinkt die Muskelproteinsynthese um 18% und das
            Verletzungsrisiko steigt um 60%. Fuer optimale Regeneration und
            Muskelaufbau sollten Maenner ueber 50 mindestens 7-8 Stunden
            qualitativ hochwertigen Schlaf anstreben.
          </WissenschaftSnippet>

          {/* Last 7 days sparklines */}
          {last7Days.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Letzte 7 Tage</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {METRICS.map((m) => (
                  <div
                    key={m.key}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <m.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{m.label}</span>
                    </div>
                    <Sparkline
                      data={last7Days}
                      dataKey={m.key}
                      color={m.color}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full min-h-[52px] text-base font-semibold"
          >
            {saving ? (
              "Speichern..."
            ) : (
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                Speichern
              </span>
            )}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
