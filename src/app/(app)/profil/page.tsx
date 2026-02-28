"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
}

const ERFAHRUNG_LABELS: Record<string, string> = {
  einsteiger: "Einsteiger",
  grundlagen: "Grundlagen",
  mittel: "Mittel",
  fortgeschritten: "Fortgeschritten",
};

const ERNAEHRUNGSWEISE_LABELS: Record<string, string> = {
  omnivor: "Alles (Omnivor)",
  vegetarisch: "Vegetarisch",
  vegan: "Vegan",
};

const ZIEL_LABELS: Record<string, string> = {
  muskelaufbau: "Muskelaufbau",
  fettabbau: "Fettabbau",
  gesundheit: "Gesundheit & Fitness",
  kraft: "Kraft steigern",
};

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

  const [ernaehrungDialogOpen, setErnaehrungDialogOpen] = useState(false);
  const [ernaehrungForm, setErnaehrungForm] = useState({
    anzahlMahlzeiten: 4,
    ernaehrungsweise: "omnivor",
  });
  const [savingErnaehrung, setSavingErnaehrung] = useState(false);

  const [zielDialogOpen, setZielDialogOpen] = useState(false);
  const [zielForm, setZielForm] = useState("");
  const [savingZiel, setSavingZiel] = useState(false);

  const [koerperForm, setKoerperForm] = useState<KoerperForm>({
    gewicht: "",
    koerperfett: "",
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
        if (data.profile) {
          setErnaehrungForm({
            anzahlMahlzeiten: data.profile.anzahlMahlzeiten || 4,
            ernaehrungsweise: data.profile.ernaehrungsweise || "omnivor",
          });
          setZielForm(data.profile.hauptziel || "muskelaufbau");
        }
      })
      .catch((err) => console.error("Profile fetch error:", err))
      .finally(() => setLoading(false));

    fetch("/api/profil/letzte-koerperdaten")
      .then((res) => res.json())
      .then((response) => {
        if (response.data) {
          const data = response.data;
          setKoerperForm({
            gewicht: data.gewicht ? String(data.gewicht) : "",
            koerperfett: data.koerperfett ? String(data.koerperfett) : "",
          });
        }
      })
      .catch((err) => console.error("Last body metrics error:", err));

    fetch("/api/whoop/status")
      .then((res) => {
        if (!res.ok) {
          return { connected: false };
        }
        return res.json();
      })
      .then((data) => {
        setWhoopConnected(data.connected || false);
      })
      .catch((err) => {
        setWhoopConnected(false);
      });

    const params = new URLSearchParams(window.location.search);
    if (params.get("whoop_connected") === "true") {
      toast.success("WHOOP erfolgreich verbunden und synchronisiert!");
      setWhoopConnected(true);
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
        koerperfett: koerperForm.koerperfett ? parseFloat(koerperForm.koerperfett) : null,
      };

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

      toast.success("Körperdaten gespeichert!");
    } catch {
      toast.error("Fehler beim Speichern der Körperdaten.");
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

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      if (data.daysSync > 0) {
        toast.success(`${data.daysSync} Tage synchronisiert`);
      } else {
        toast.info("Keine neuen Daten verfügbar");
      }
    } catch (err) {
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
      const message = error instanceof Error ? error.message : "Fehler beim Speichern.";
      toast.error(message);
    } finally {
      setSavingErnaehrung(false);
    }
  };

  const handleSaveZiel = async () => {
    setSavingZiel(true);
    try {
      const res = await fetch("/api/profil/hauptziel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hauptziel: zielForm }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Save failed");

      setUser((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          profile: prev.profile
            ? {
              ...prev.profile,
              hauptziel: data.hauptziel,
            }
            : prev.profile,
        };
      });

      toast.success("Trainingsziel gespeichert! Generiere einen neuen Plan, um das Ziel zu berücksichtigen.");
      setZielDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Fehler beim Speichern.";
      toast.error(message);
    } finally {
      setSavingZiel(false);
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

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0B] text-white pt-20">
        <div className="flex items-center justify-center flex-1">
          <div className="animate-pulse text-slate-500">Profil wird geladen...</div>
        </div>
      </div>
    );
  }

  // Get Initials
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-32 bg-[#0A0A0B] text-white font-display">
      <div className="flex items-center bg-[#0A0A0B]/80 backdrop-blur-md p-6 sticky top-0 z-30">
        <div
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center cursor-pointer bg-[#161618] rounded-full border border-[#262629]"
        >
          <span className="material-symbols-outlined text-2xl text-white">chevron_left</span>
        </div>
        <h2 className="text-lg font-bold flex-1 text-center tracking-tight">PROFIL</h2>
        <div
          onClick={() => setErnaehrungDialogOpen(true)}
          className="flex h-10 w-10 items-center justify-center cursor-pointer bg-[#161618] rounded-full border border-[#262629]"
        >
          <span className="material-symbols-outlined text-xl text-white">settings</span>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 py-4 gap-6">
        <div className="relative p-1 avatar-border rounded-full shadow-2xl">
          <div className="h-32 w-32 rounded-full bg-[#0A0A0B] flex items-center justify-center overflow-hidden border-2 border-[#0A0A0B]">
            <span className="text-4xl font-extrabold text-white tracking-tighter">{initials}</span>
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rank-gradient px-5 py-1.5 rounded-full shadow-lg border border-white/20">
            {/* Gamification title mapped or hardcoded for now */}
            <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-900 leading-none">Mitglied</p>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">{user.name}</h1>
          <p className="text-slate-400 text-sm font-medium">{user.email}</p>
        </div>
      </div>

      <div className="px-6 space-y-8 mt-4">
        {/* Korperdaten Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Körperdaten</h3>
            <span className="material-symbols-outlined text-primary text-xl">straighten</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Gewicht</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={koerperForm.gewicht}
                  onChange={(e) => setKoerperForm({ ...koerperForm, gewicht: e.target.value })}
                  className="w-full rounded-2xl bg-[#161618] border border-[#262629] p-4 text-xl font-bold text-white focus:ring-0 input-focus-glow transition-all focus:outline-none"
                  placeholder="--"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">KG</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Größe</label>
              <div className="relative">
                <input
                  type="number"
                  readOnly
                  value={user.profile?.groesse || "--"}
                  className="w-full rounded-2xl bg-[#161618] border border-[#262629] p-4 text-xl font-bold text-white opacity-80 cursor-not-allowed focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">CM</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Alter</label>
              <div className="relative">
                <input
                  type="number"
                  readOnly
                  value={user.profile?.alter || "--"}
                  className="w-full rounded-2xl bg-[#161618] border border-[#262629] p-4 text-xl font-bold text-white opacity-80 cursor-not-allowed focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">JAHRE</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">KFA</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={koerperForm.koerperfett}
                  onChange={(e) => setKoerperForm({ ...koerperForm, koerperfett: e.target.value })}
                  className="w-full rounded-2xl bg-[#161618] border border-[#262629] p-4 text-xl font-bold text-white focus:ring-0 input-focus-glow transition-all focus:outline-none"
                  placeholder="--"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">%</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleSaveKoerperdaten}
            disabled={saving}
            className="w-full bg-primary text-[#0A0A0B] font-black py-5 rounded-2xl shadow-[0_4px_20px_rgba(204,255,0,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            {saving ? "Wird gespeichert..." : "Änderungen Speichern"}
          </button>
        </section>

        {/* Einstellungen Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Einstellungen</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-5 bg-[#161618] rounded-2xl border border-[#262629]">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#00FFC2]">fitness_center</span>
                <span className="font-medium text-slate-300">Level</span>
              </div>
              <span className="font-bold text-white">
                {user.profile ? ERFAHRUNG_LABELS[user.profile.erfahrung] || user.profile.erfahrung : "--"}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-5 bg-[#161618] rounded-2xl border border-[#262629] cursor-pointer active:bg-white/5"
              onClick={() => setZielDialogOpen(true)}
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#00FFC2]">target</span>
                <span className="font-medium text-slate-300">Trainingsziel</span>
              </div>
              <span className="font-bold text-white">
                {user.profile ? ZIEL_LABELS[user.profile.hauptziel] || user.profile.hauptziel : "--"}
              </span>
            </div>
            <div
              className="flex justify-between items-center p-5 bg-[#161618] rounded-2xl border border-[#262629] cursor-pointer active:bg-white/5"
              onClick={() => setErnaehrungDialogOpen(true)}
            >
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-[#00FFC2]">nutrition</span>
                <span className="font-medium text-slate-300">Ernährungsform</span>
              </div>
              <span className="font-bold text-white">
                {user.profile ? ERNAEHRUNGSWEISE_LABELS[user.profile.ernaehrungsweise] || user.profile.ernaehrungsweise : "--"}
              </span>
            </div>
          </div>
        </section>

        {/* WHOOP Data Section */}
        <section className="bg-[#161618] rounded-3xl p-6 border border-[#262629] relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#00FFC2]/10 p-2 rounded-lg">
                <span className="material-symbols-outlined text-[#00FFC2]">sync_alt</span>
              </div>
              <h3 className="text-lg font-bold">WHOOP Data</h3>
            </div>
            {whoopConnected && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[#00FFC2]/10 border border-[#00FFC2]/20 rounded-full">
                <div className="h-1.5 w-1.5 bg-[#00FFC2] rounded-full animate-pulse shadow-[0_0_8px_#00FFC2]"></div>
                <span className="text-[9px] font-black text-[#00FFC2] uppercase tracking-widest">Active</span>
              </div>
            )}
          </div>

          {whoopConnected ? (
            <>
              <button
                onClick={handleSyncWhoop}
                disabled={whoopSyncing}
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 border border-white/10 transition-all"
              >
                <span className={cn("material-symbols-outlined text-sm", whoopSyncing && "animate-spin")}>refresh</span>
                <span className="text-sm uppercase tracking-widest">
                  {whoopSyncing ? "Synchronisiere..." : "Jetzt synchronisieren"}
                </span>
              </button>
              <div className="mt-4 text-center">
                <button
                  onClick={handleDisconnectWhoop}
                  className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[#FF3B30] transition-colors"
                >
                  Verbindung trennen
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={handleConnectWhoop}
              disabled={whoopConnecting}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 border border-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">watch</span>
              <span className="text-sm uppercase tracking-widest">
                {whoopConnecting ? "Verbinde..." : "Mit WHOOP verbinden"}
              </span>
            </button>
          )}
        </section>

        {/* Erscheinungsbild Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-black tracking-[0.2em] text-slate-500 uppercase">Erscheinungsbild</h3>
          <div className="flex p-1.5 bg-[#161618] rounded-2xl border border-[#262629]">
            <button
              onClick={() => setTheme("light")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all", theme !== "dark" ? "bg-white/10 text-primary shadow-inner" : "text-slate-500")}
            >
              <span className="material-symbols-outlined text-xl">light_mode</span>
              <span className="text-xs uppercase tracking-widest">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={cn("flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all", theme === "dark" ? "bg-white/10 text-primary shadow-inner" : "text-slate-500")}
            >
              <span className="material-symbols-outlined text-xl">dark_mode</span>
              <span className="text-xs uppercase tracking-widest">Dark</span>
            </button>
          </div>
        </section>

        {/* Logout Section */}
        <div className="pt-4 pb-12">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-3 text-[#FF3B30] font-black py-5 rounded-2xl border border-[#FF3B30]/20 bg-[#FF3B30]/5 active:bg-[#FF3B30]/10 transition-all uppercase tracking-[0.2em] text-xs"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            {loggingOut ? "Wird abgemeldet..." : "Abmelden"}
          </button>
          <p className="text-center text-slate-600 text-[10px] mt-8 font-bold tracking-widest uppercase">
            pitee v2.4.0 • Premium Access
          </p>
        </div>
      </div>

      {/* Trainingsziel Dialog */}
      <Dialog open={zielDialogOpen} onOpenChange={setZielDialogOpen}>
        <DialogContent className="bg-[#161618] border border-[#262629] text-white">
          <DialogHeader>
            <DialogTitle>Trainingsziel ändern</DialogTitle>
            <DialogDescription className="text-slate-400">
              Wähle dein Hauptziel. Generiere danach einen neuen Trainingsplan, um das Ziel zu berücksichtigen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Hauptziel</Label>
              <Select
                value={zielForm}
                onValueChange={(value) => setZielForm(value)}
              >
                <SelectTrigger className="w-full min-h-[48px] bg-[#0A0A0B] border-[#262629] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-[#262629] text-white">
                  <SelectItem value="muskelaufbau">Muskelaufbau</SelectItem>
                  <SelectItem value="fettabbau">Fettabbau</SelectItem>
                  <SelectItem value="gesundheit">Gesundheit & Fitness</SelectItem>
                  <SelectItem value="kraft">Kraft steigern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setZielDialogOpen(false)}
              className="min-h-[48px] border-[#262629] bg-transparent text-white hover:bg-white/5 hover:text-white"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveZiel}
              disabled={savingZiel}
              className="min-h-[48px] bg-primary text-black hover:bg-primary/90"
            >
              {savingZiel ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ernährungseinstellungen Dialog */}
      <Dialog open={ernaehrungDialogOpen} onOpenChange={setErnaehrungDialogOpen}>
        <DialogContent className="bg-[#161618] border border-[#262629] text-white">
          <DialogHeader>
            <DialogTitle>Ernährungseinstellungen</DialogTitle>
            <DialogDescription className="text-slate-400">
              Diese Einstellungen werden bei der Generierung deiner Ernährungspläne berücksichtigt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Mahlzeiten pro Tag</Label>
              <Select
                value={String(ernaehrungForm.anzahlMahlzeiten)}
                onValueChange={(value) =>
                  setErnaehrungForm((f) => ({
                    ...f,
                    anzahlMahlzeiten: parseInt(value),
                  }))
                }
              >
                <SelectTrigger className="w-full min-h-[48px] bg-[#0A0A0B] border-[#262629] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-[#262629] text-white">
                  <SelectItem value="3">3 Mahlzeiten</SelectItem>
                  <SelectItem value="4">4 Mahlzeiten</SelectItem>
                  <SelectItem value="5">5 Mahlzeiten</SelectItem>
                  <SelectItem value="6">6 Mahlzeiten</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Ernährungsweise</Label>
              <Select
                value={ernaehrungForm.ernaehrungsweise}
                onValueChange={(value) =>
                  setErnaehrungForm((f) => ({ ...f, ernaehrungsweise: value }))
                }
              >
                <SelectTrigger className="w-full min-h-[48px] bg-[#0A0A0B] border-[#262629] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161618] border-[#262629] text-white">
                  <SelectItem value="omnivor">Alles (Omnivor)</SelectItem>
                  <SelectItem value="vegetarisch">Vegetarisch</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setErnaehrungDialogOpen(false)}
              className="min-h-[48px] border-[#262629] bg-transparent text-white hover:bg-white/5 hover:text-white"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveErnaehrungseinstellungen}
              disabled={savingErnaehrung}
              className="min-h-[48px] bg-primary text-black hover:bg-primary/90"
            >
              {savingErnaehrung ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
