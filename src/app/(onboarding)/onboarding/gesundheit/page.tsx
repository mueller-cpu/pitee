"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "onboarding-data";

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function HealthToggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between w-full rounded-2xl border p-5 transition-all",
        "min-h-[60px] text-left",
        checked
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-background hover:bg-accent/50"
      )}
    >
      <span className="text-base font-medium pr-4">{label}</span>
      <div
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </div>
    </button>
  );
}

export default function GesundheitPage() {
  const router = useRouter();
  const [herzKreislauf, setHerzKreislauf] = useState(false);
  const [bluthochdruck, setBluthochdruck] = useState(false);
  const [diabetes, setDiabetes] = useState(false);
  const [medikamente, setMedikamente] = useState("");
  const [vorerkrankungen, setVorerkrankungen] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.herzKreislauf !== undefined)
          setHerzKreislauf(data.herzKreislauf);
        if (data.bluthochdruck !== undefined)
          setBluthochdruck(data.bluthochdruck);
        if (data.diabetes !== undefined) setDiabetes(data.diabetes);
        if (data.medikamente) setMedikamente(data.medikamente);
        if (data.vorerkrankungen) setVorerkrankungen(data.vorerkrankungen);
      }
    } catch {}
  }, []);

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.herzKreislauf = herzKreislauf;
    data.bluthochdruck = bluthochdruck;
    data.diabetes = diabetes;
    data.medikamente = medikamente.trim();
    data.vorerkrankungen = vorerkrankungen.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/gelenke");
  };

  return (
    <OnboardingLayout
      schritt={3}
      titel="Gesundheitsinformationen"
      beschreibung="Diese Fragen helfen uns, dein Training sicher zu gestalten."
      zurueckUrl="/onboarding/koerperdaten"
      onWeiter={handleWeiter}
    >
      <div className="space-y-3">
        <HealthToggle
          label="Hast du Herz-Kreislauf-Erkrankungen?"
          checked={herzKreislauf}
          onChange={setHerzKreislauf}
        />
        <HealthToggle
          label="Hast du Bluthochdruck?"
          checked={bluthochdruck}
          onChange={setBluthochdruck}
        />
        <HealthToggle
          label="Hast du Diabetes?"
          checked={diabetes}
          onChange={setDiabetes}
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="medikamente" className="text-base">
          Medikamente <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="medikamente"
          placeholder="z.B. Blutdrucksenker, Cholesterinsenker..."
          value={medikamente}
          onChange={(e) => setMedikamente(e.target.value)}
          className="min-h-[80px] text-base rounded-xl px-4 py-3"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="vorerkrankungen" className="text-base">
          Vorerkrankungen{" "}
          <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id="vorerkrankungen"
          placeholder="z.B. Bandscheibenvorfall, Arthrose..."
          value={vorerkrankungen}
          onChange={(e) => setVorerkrankungen(e.target.value)}
          className="min-h-[80px] text-base rounded-xl px-4 py-3"
        />
      </div>
    </OnboardingLayout>
  );
}
