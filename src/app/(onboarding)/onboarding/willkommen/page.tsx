"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "onboarding-data";

export default function WillkommenPage() {
  const router = useRouter();
  const [name, setName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.name) setName(data.name);
      }
    } catch {}
  }, []);

  const handleWeiter = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};
    data.name = name.trim();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    router.push("/onboarding/koerperdaten");
  };

  return (
    <OnboardingLayout
      schritt={1}
      titel="Willkommen bei pitee"
      beschreibung="Dein persönlicher KI-Coach für evidenzbasiertes Krafttraining."
      onWeiter={handleWeiter}
      weiterDisabled={!name.trim()}
    >
      <div className="space-y-3">
        <Label htmlFor="name" className="text-base">
          Wie heißt du?
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Dein Vorname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-14 text-lg rounded-xl px-4"
          autoFocus
        />
      </div>
    </OnboardingLayout>
  );
}
