"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Scale, Ruler, LogOut, Dumbbell, Save, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

// ── Types ──

interface UserData {
  id: string;
  name: string;
  email: string;
  hasProfile: boolean;
  profile?: {
    gewicht: number;
    groesse: number;
    alter: number;
    erfahrung: string;
    hauptziel: string;
    trainingstagePW: number;
  };
}

interface KoerperForm {
  gewicht: string;
  koerperfett: string;
  brustumfang: string;
  taillenumfang: string;
  oberarmumfang: string;
  oberschenkelumfang: string;
}

// ── Helper ──

const ERFAHRUNG_LABELS: Record<string, string> = {
  einsteiger: "Einsteiger",
  grundlagen: "Grundlagen",
  mittel: "Mittel",
  fortgeschritten: "Fortgeschritten",
};

const ZIEL_LABELS: Record<string, string> = {
  muskelaufbau: "Muskelaufbau",
  kraft: "Kraft",
  fettabbau: "Fettabbau",
  gesundheit: "Allgemeine Gesundheit",
};

// ── Metric Input Row ──
function MetricInput({
  label,
  unit,
  value,
  onChange,
  icon: Icon,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
      <div className="flex-1">
        <Label className="text-sm text-muted-foreground">{label}</Label>
      </div>
      <div className="flex items-center gap-1.5">
        <Input
          type="number"
          step="0.1"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 min-h-[48px] text-center text-base font-medium"
          placeholder="--"
        />
        <span className="text-sm text-muted-foreground w-8">{unit}</span>
      </div>
    </div>
  );
}

// ── Main Page ──

export default function ProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();

  const [koerperForm, setKoerperForm] = useState<KoerperForm>({
    gewicht: "",
    koerperfett: "",
    brustumfang: "",
    taillenumfang: "",
    oberarmumfang: "",
    oberschenkelumfang: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((data) => {
        setUser(data);
        // Pre-fill weight from profile if available
        if (data.profile?.gewicht) {
          setKoerperForm((f) => ({
            ...f,
            gewicht: String(data.profile.gewicht),
          }));
        }
      })
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveKoerperdaten = async () => {
    setSaving(true);
    try {
      const body = {
        gewicht: koerperForm.gewicht ? parseFloat(koerperForm.gewicht) : null,
        koerperfett: koerperForm.koerperfett
          ? parseFloat(koerperForm.koerperfett)
          : null,
        brustumfang: koerperForm.brustumfang
          ? parseFloat(koerperForm.brustumfang)
          : null,
        taillenumfang: koerperForm.taillenumfang
          ? parseFloat(koerperForm.taillenumfang)
          : null,
        oberarmumfang: koerperForm.oberarmumfang
          ? parseFloat(koerperForm.oberarmumfang)
          : null,
        oberschenkelumfang: koerperForm.oberschenkelumfang
          ? parseFloat(koerperForm.oberschenkelumfang)
          : null,
      };

      // Require at least one value
      const hasValue = Object.values(body).some((v) => v !== null);
      if (!hasValue) {
        toast.error("Bitte mindestens einen Wert eingeben.");
        setSaving(false);
        return;
      }

      const res = await fetch("/api/profil/koerperdaten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success("Koerperdaten gespeichert!");
    } catch {
      toast.error("Fehler beim Speichern der Koerperdaten.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      toast.error("Fehler beim Abmelden.");
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Profil" />
        <PageContainer>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse bg-muted rounded-xl"
              />
            ))}
          </div>
        </PageContainer>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header title="Profil" />
      <PageContainer>
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold truncate">
                    {user.name}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Body Metrics Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Koerperdaten erfassen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-4">
              <MetricInput
                label="Gewicht"
                unit="kg"
                value={koerperForm.gewicht}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, gewicht: v }))
                }
                icon={Scale}
              />
              <Separator />
              <MetricInput
                label="Koerperfett"
                unit="%"
                value={koerperForm.koerperfett}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, koerperfett: v }))
                }
                icon={Ruler}
              />
              <Separator />
              <MetricInput
                label="Brustumfang"
                unit="cm"
                value={koerperForm.brustumfang}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, brustumfang: v }))
                }
                icon={Ruler}
              />
              <Separator />
              <MetricInput
                label="Taillenumfang"
                unit="cm"
                value={koerperForm.taillenumfang}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, taillenumfang: v }))
                }
                icon={Ruler}
              />
              <Separator />
              <MetricInput
                label="Oberarmumfang"
                unit="cm"
                value={koerperForm.oberarmumfang}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, oberarmumfang: v }))
                }
                icon={Ruler}
              />
              <Separator />
              <MetricInput
                label="Oberschenkelumfang"
                unit="cm"
                value={koerperForm.oberschenkelumfang}
                onChange={(v) =>
                  setKoerperForm((f) => ({ ...f, oberschenkelumfang: v }))
                }
                icon={Ruler}
              />

              <Button
                onClick={handleSaveKoerperdaten}
                disabled={saving}
                className="w-full min-h-[52px] text-base font-semibold mt-2"
              >
                {saving ? (
                  "Speichern..."
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    Messen & Speichern
                  </span>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Training Settings */}
          {user.profile && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="h-5 w-5" />
                  Trainingseinstellungen
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Erfahrungslevel
                  </span>
                  <span className="text-sm font-medium">
                    {ERFAHRUNG_LABELS[user.profile.erfahrung] ||
                      user.profile.erfahrung}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Ziel</span>
                  <span className="text-sm font-medium">
                    {ZIEL_LABELS[user.profile.hauptziel] ||
                      user.profile.hauptziel}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Trainingstage / Woche
                  </span>
                  <span className="text-sm font-medium">
                    {user.profile.trainingstagePW}x
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Groesse
                  </span>
                  <span className="text-sm font-medium">
                    {user.profile.groesse} cm
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Alter</span>
                  <span className="text-sm font-medium">
                    {user.profile.alter} Jahre
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dark Mode */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {theme === "dark" ? (
                    <Moon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Sun className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="font-medium">Dark Mode</span>
                </div>
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    theme === "dark" ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                      theme === "dark" ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full min-h-[52px] text-base font-semibold text-destructive border-destructive/30 hover:bg-destructive/5"
          >
            {loggingOut ? (
              "Abmelden..."
            ) : (
              <span className="flex items-center gap-2">
                <LogOut className="h-5 w-5" />
                Abmelden
              </span>
            )}
          </Button>
        </div>
      </PageContainer>
    </>
  );
}
