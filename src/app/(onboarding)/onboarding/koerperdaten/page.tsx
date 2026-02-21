"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { berechneBMI } from "@/lib/calculations";

const STORAGE_KEY = "onboarding-data";

function getBMIKategorie(bmi: number): { label: string; farbe: string } {
  if (bmi < 18.5) return { label: "Untergewicht", farbe: "text-blue-500" };
  if (bmi < 25) return { label: "Normalgewicht", farbe: "text-green-500" };
  if (bmi < 30) return { label: "Übergewicht", farbe: "text-yellow-500" };
  return { label: "Adipositas", farbe: "text-red-500" };
}

export default function KoerperdatenPage() {
  const router = useRouter();
  const [alter, setAlter] = useState("");
  const [gewicht, setGewicht] = useState("");
  const [groesse, setGroesse] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.alter) setAlter(String(data.alter));
        if (data.gewicht) setGewicht(String(data.gewicht));
        if (data.groesse) setGroesse(String(data.groesse));
      }
    } catch {}
  }, []);

  const bmiResult = useMemo(() => {
    const g = parseFloat(gewicht);
    const h = parseFloat(groesse);
    if (!g || !h || g <= 0 || h <= 0) return null;
    const bmi = berechneBMI(g, h);
    return { wert: bmi, ...getBMIKategorie(bmi) };
  }, [gewicht, groesse]);

  const isValid =
    alter.trim() !== "" &&
    gewicht.trim() !== "" &&
    groesse.trim() !== "" &&
    parseFloat(alter) > 0 &&
    parseFloat(gewicht) > 0 &&
    parseFloat(groesse) > 0;

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.alter = parseFloat(alter);
    data.gewicht = parseFloat(gewicht);
    data.groesse = parseFloat(groesse);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/gesundheit");
  };

  return (
    <OnboardingLayout
      schritt={2}
      titel="Körperdaten"
      beschreibung="Diese Angaben helfen uns, dein Training optimal zu personalisieren."
      zurueckUrl="/onboarding/willkommen"
      onWeiter={handleWeiter}
      weiterDisabled={!isValid}
    >
      <div className="space-y-3">
        <Label htmlFor="alter" className="text-base">
          Alter
        </Label>
        <Input
          id="alter"
          type="number"
          inputMode="numeric"
          placeholder="z.B. 55"
          value={alter}
          onChange={(e) => setAlter(e.target.value)}
          className="h-14 text-lg rounded-xl px-4"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="gewicht" className="text-base">
          Gewicht (kg)
        </Label>
        <Input
          id="gewicht"
          type="number"
          inputMode="decimal"
          placeholder="z.B. 85"
          value={gewicht}
          onChange={(e) => setGewicht(e.target.value)}
          className="h-14 text-lg rounded-xl px-4"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="groesse" className="text-base">
          Größe (cm)
        </Label>
        <Input
          id="groesse"
          type="number"
          inputMode="numeric"
          placeholder="z.B. 178"
          value={groesse}
          onChange={(e) => setGroesse(e.target.value)}
          className="h-14 text-lg rounded-xl px-4"
        />
      </div>

      {bmiResult && (
        <div className="rounded-2xl bg-muted/50 p-5 text-center space-y-1">
          <p className="text-sm text-muted-foreground">Dein BMI</p>
          <p className="text-3xl font-bold tracking-tight">
            {bmiResult.wert}
          </p>
          <p className={`text-sm font-medium ${bmiResult.farbe}`}>
            {bmiResult.label}
          </p>
        </div>
      )}
    </OnboardingLayout>
  );
}
