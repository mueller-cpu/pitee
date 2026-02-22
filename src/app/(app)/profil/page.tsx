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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Scale, Ruler, LogOut, Dumbbell, Save, Sun, Moon, Watch, RefreshCw, Unlink, UtensilsCrossed, Pencil } from "lucide-react";
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
    geschlecht: string;
    erfahrung: string;
    hauptziel: string;
    trainingstagePW: number;
    anzahlMahlzeiten: number;
    ernaehrungsweise: string;
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

const ERNAEHRUNGSWEISE_LABELS: Record<string, string> = {
  omnivor: "Alles (Omnivor)",
  vegetarisch: "Vegetarisch",
  vegan: "Vegan",
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
  const [whoopConnected, setWhoopConnected] = useState(false);
  const [whoopSyncing, setWhoopSyncing] = useState(false);
  const [whoopConnecting, setWhoopConnecting] = useState(false);
  const { theme, setTheme } = useTheme();

  // Ernährungseinstellungen Dialog
  const [ernaehrungDialogOpen, setErnaehrungDialogOpen] = useState(false);
  const [ernaehrungForm, setErnaehrungForm] = useState({
    anzahlMahlzeiten: 4,
    ernaehrungsweise: "omnivor",
  });
  const [savingErnaehrung, setSavingErnaehrung] = useState(false);

  const [koerperForm, setKoerperForm] = useState<KoerperForm>({
    gewicht: "",
    koerperfett: "",
    brustumfang: "",
    taillenumfang: "",
    oberarmumfang: "",
    oberschenkelumfang: "",
  });

  useEffect(() => {
    // Load user data
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
        // Initialize Ernährungseinstellungen form
        if (data.profile) {
          setErnaehrungForm({
            anzahlMahlzeiten: data.profile.anzahlMahlzeiten || 4,
            ernaehrungsweise: data.profile.ernaehrungsweise || "omnivor",
          });
        }
      })
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => setLoading(false));

    // Load latest body metrics to pre-fill form
    fetch("/api/profil/letzte-koerperdaten")
      .then((res) => res.json())
      .then((response) => {
        if (response.data) {
          const data = response.data;
          setKoerperForm({
            gewicht: data.gewicht ? String(data.gewicht) : "",
            koerperfett: data.koerperfett ? String(data.koerperfett) : "",
            brustumfang: data.brustumfang ? String(data.brustumfang) : "",
            taillenumfang: data.taillenumfang ? String(data.taillenumfang) : "",
            oberarmumfang: data.oberarmumfang ? String(data.oberarmumfang) : "",
            oberschenkelumfang: data.oberschenkelumfang ? String(data.oberschenkelumfang) : "",
          });
        }
      })
      .catch((err) => console.error("Last body metrics error:", err));

    // Check WHOOP connection status
    fetch("/api/whoop/status")
      .then((res) => {
        if (!res.ok) {
          console.error("WHOOP status check failed:", res.status);
          return { connected: false };
        }
        return res.json();
      })
      .then((data) => {
        console.log("WHOOP status:", data);
        setWhoopConnected(data.connected || false);
      })
      .catch((err) => {
        console.error("WHOOP status error:", err);
        setWhoopConnected(false);
      });

    // Check URL params for WHOOP callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("whoop_connected") === "true") {
      toast.success("WHOOP erfolgreich verbunden und synchronisiert!");
      setWhoopConnected(true);
      // Clean up URL
      window.history.replaceState({}, "", "/profil");
    } else if (params.get("whoop_error")) {
      toast.error("WHOOP-Verbindung fehlgeschlagen");
      window.history.replaceState({}, "", "/profil");
    }
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

  const handleConnectWhoop = async () => {
    setWhoopConnecting(true);
    try {
      const res = await fetch("/api/whoop/auth");
      const data = await res.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error("No auth URL");
      }
    } catch {
      toast.error("Fehler beim Verbinden mit WHOOP");
      setWhoopConnecting(false);
    }
  };

  const handleDisconnectWhoop = async () => {
    try {
      const res = await fetch("/api/whoop/disconnect", { method: "POST" });

      if (!res.ok) throw new Error("Disconnect failed");

      setWhoopConnected(false);
      toast.success("WHOOP getrennt");
    } catch {
      toast.error("Fehler beim Trennen von WHOOP");
    }
  };

  const handleSyncWhoop = async () => {
    setWhoopSyncing(true);
    try {
      const res = await fetch("/api/whoop/sync", { method: "POST" });
      const data = await res.json();

      console.log("WHOOP sync response:", data);

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      if (data.daysSync > 0) {
        toast.success(`${data.daysSync} Tage synchronisiert`);
      } else {
        toast.info("Keine neuen Daten verfügbar");
      }
    } catch (err) {
      console.error("WHOOP sync error:", err);
      toast.error(err instanceof Error ? err.message : "Fehler beim Synchronisieren");
    } finally {
      setWhoopSyncing(false);
    }
  };

  const handleSaveErnaehrungseinstellungen = async () => {
    setSavingErnaehrung(true);
    try {
      const res = await fetch("/api/profil/ernaehrungseinstellungen", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ernaehrungForm),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save failed");

      // Update local user state
      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: prev.profile
            ? {
                ...prev.profile,
                anzahlMahlzeiten: data.anzahlMahlzeiten,
                ernaehrungsweise: data.ernaehrungsweise,
              }
            : prev.profile,
        };
      });

      toast.success("Ernährungseinstellungen gespeichert!");
      setErnaehrungDialogOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Fehler beim Speichern.";
      toast.error(message);
    } finally {
      setSavingErnaehrung(false);
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
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Geschlecht</span>
                  <span className="text-sm font-medium">
                    {user.profile.geschlecht === "weiblich" ? "Weiblich" : "Männlich"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Alter</span>
                  <span className="text-sm font-medium">
                    {user.profile.alter} Jahre
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Größe</span>
                  <span className="text-sm font-medium">
                    {user.profile.groesse} cm
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">
                    Erfahrungslevel
                  </span>
                  <span className="text-sm font-medium">
                    {ERFAHRUNG_LABELS[user.profile.erfahrung] ||
                      user.profile.erfahrung}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Ziel</span>
                  <span className="text-sm font-medium">
                    {ZIEL_LABELS[user.profile.hauptziel] ||
                      user.profile.hauptziel}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">
                    Trainingstage / Woche
                  </span>
                  <span className="text-sm font-medium">
                    {user.profile.trainingstagePW}x
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ernährungseinstellungen */}
          {user.profile && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5" />
                    Ernährungseinstellungen
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setErnaehrungDialogOpen(true)}
                    className="h-9 w-9 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Mahlzeiten pro Tag</span>
                  <span className="text-sm font-medium">
                    {user.profile.anzahlMahlzeiten}x
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center min-h-[48px]">
                  <span className="text-sm text-muted-foreground">Ernährungsweise</span>
                  <span className="text-sm font-medium">
                    {ERNAEHRUNGSWEISE_LABELS[user.profile.ernaehrungsweise] || user.profile.ernaehrungsweise}
                  </span>
                </div>
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Hinweis:</strong> Diese Einstellungen werden bei der KI-Generierung von Ernährungsplänen berücksichtigt.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* WHOOP Integration */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Watch className="h-5 w-5" />
                WHOOP Wearable
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Verbinde dein WHOOP für automatische Schlaf-, Recovery- und Strain-Daten.
              </p>

              {whoopConnected ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-success">
                    <div className="h-2 w-2 rounded-full bg-success" />
                    <span className="font-medium">WHOOP verbunden</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSyncWhoop}
                      disabled={whoopSyncing}
                      className="flex-1 min-h-[48px]"
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${
                          whoopSyncing ? "animate-spin" : ""
                        }`}
                      />
                      {whoopSyncing ? "Synchronisiere..." : "Jetzt synchronisieren"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectWhoop}
                      className="min-h-[48px] text-destructive border-destructive/30 hover:bg-destructive/5"
                    >
                      <Unlink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnectWhoop}
                  disabled={whoopConnecting}
                  className="w-full min-h-[48px]"
                >
                  <Watch className="h-4 w-4 mr-2" />
                  {whoopConnecting ? "Verbinde..." : "Mit WHOOP verbinden"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Dark Mode */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between min-h-[56px]">
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
                  className={`relative w-14 h-8 rounded-full transition-colors min-h-[48px] flex items-center ${
                    theme === "dark" ? "bg-primary" : "bg-muted"
                  }`}
                  aria-label="Dark Mode umschalten"
                >
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
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

        {/* Ernährungseinstellungen Dialog */}
        <Dialog open={ernaehrungDialogOpen} onOpenChange={setErnaehrungDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ernährungseinstellungen bearbeiten</DialogTitle>
              <DialogDescription>
                Diese Einstellungen werden bei der Generierung deiner Ernährungspläne berücksichtigt.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Anzahl Mahlzeiten */}
              <div className="space-y-2">
                <Label htmlFor="anzahlMahlzeiten" className="text-sm font-medium">
                  Mahlzeiten pro Tag
                </Label>
                <Select
                  value={String(ernaehrungForm.anzahlMahlzeiten)}
                  onValueChange={(value) =>
                    setErnaehrungForm((f) => ({
                      ...f,
                      anzahlMahlzeiten: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full min-h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 Mahlzeiten</SelectItem>
                    <SelectItem value="4">4 Mahlzeiten</SelectItem>
                    <SelectItem value="5">5 Mahlzeiten</SelectItem>
                    <SelectItem value="6">6 Mahlzeiten</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wähle die Anzahl, die zu deinem Tagesablauf passt.
                </p>
              </div>

              {/* Ernährungsweise */}
              <div className="space-y-2">
                <Label htmlFor="ernaehrungsweise" className="text-sm font-medium">
                  Ernährungsweise
                </Label>
                <Select
                  value={ernaehrungForm.ernaehrungsweise}
                  onValueChange={(value) =>
                    setErnaehrungForm((f) => ({ ...f, ernaehrungsweise: value }))
                  }
                >
                  <SelectTrigger className="w-full min-h-[48px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="omnivor">
                      Alles (Omnivor)
                    </SelectItem>
                    <SelectItem value="vegetarisch">
                      Vegetarisch
                    </SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {ernaehrungForm.ernaehrungsweise === "vegetarisch" &&
                    "Kein Fleisch oder Fisch, aber Eier und Milchprodukte."}
                  {ernaehrungForm.ernaehrungsweise === "vegan" &&
                    "Keine tierischen Produkte. B12-Supplementierung wird empfohlen."}
                  {ernaehrungForm.ernaehrungsweise === "omnivor" &&
                    "Alle Lebensmittel sind erlaubt."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setErnaehrungDialogOpen(false)}
                className="min-h-[48px]"
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveErnaehrungseinstellungen}
                disabled={savingErnaehrung}
                className="min-h-[48px]"
              >
                {savingErnaehrung ? "Speichern..." : "Speichern"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageContainer>
    </>
  );
}
