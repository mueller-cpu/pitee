"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft } from "lucide-react";

interface OnboardingLayoutProps {
  schritt: number;
  gesamtSchritte?: number;
  titel: string;
  beschreibung?: string;
  children: React.ReactNode;
  zurueckUrl?: string;
  weiterLabel?: string;
  onWeiter?: () => void;
  weiterDisabled?: boolean;
  loading?: boolean;
}

export default function OnboardingLayout({
  schritt,
  gesamtSchritte = 7,
  titel,
  beschreibung,
  children,
  zurueckUrl,
  weiterLabel = "Weiter",
  onWeiter,
  weiterDisabled = false,
  loading = false,
}: OnboardingLayoutProps) {
  const router = useRouter();
  const fortschritt = (schritt / gesamtSchritte) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header mit Fortschritt */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-lg mx-auto px-4">
          <div className="flex items-center h-14">
            {zurueckUrl ? (
              <button
                onClick={() => router.push(zurueckUrl)}
                className="flex items-center justify-center w-12 h-12 -ml-2 rounded-full hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            ) : (
              <div className="w-10" />
            )}
            <div className="flex-1 text-center">
              <span className="text-sm text-muted-foreground">
                Schritt {schritt} von {gesamtSchritte}
              </span>
            </div>
            <div className="w-10" />
          </div>
          <Progress value={fortschritt} className="h-1 -mt-px" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{titel}</h1>
          {beschreibung && (
            <p className="text-muted-foreground text-base leading-relaxed">
              {beschreibung}
            </p>
          )}
        </div>

        <div className="space-y-6">{children}</div>
      </div>

      {/* Footer mit Weiter-Button */}
      {onWeiter && (
        <div className="sticky bottom-0 bg-background/80 backdrop-blur-lg border-t">
          <div className="max-w-lg mx-auto px-4 py-4">
            <Button
              onClick={onWeiter}
              disabled={weiterDisabled || loading}
              className="w-full h-14 text-base font-semibold rounded-2xl"
              size="lg"
            >
              {loading ? "Wird gespeichert..." : weiterLabel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
