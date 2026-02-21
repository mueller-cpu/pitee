"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";
import Header from "@/components/layout/Header";
import PageContainer from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

interface EinkaufsItem {
  name: string;
  menge?: string;
}

interface KategorisierteEinkaufsliste {
  [kategorie: string]: EinkaufsItem[];
}

// Category icons/colors
const kategorieStile: Record<string, { farbe: string }> = {
  "Fleisch & Fisch": {
    farbe: "text-red-600 dark:text-red-400",
  },
  "Milchprodukte": {
    farbe: "text-blue-600 dark:text-blue-400",
  },
  "Obst & Gemüse": {
    farbe: "text-green-600 dark:text-green-400",
  },
  "Getreide & Hülsenfrüchte": {
    farbe: "text-amber-600 dark:text-amber-400",
  },
  "Sonstiges": {
    farbe: "text-muted-foreground",
  },
};

function SkeletonList() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="space-y-1">
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
            <div className="h-12 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EinkaufslistePage() {
  const router = useRouter();
  const [liste, setListe] = useState<KategorisierteEinkaufsliste>({});
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchListe();
  }, []);

  async function fetchListe() {
    try {
      setLoading(true);
      const res = await fetch("/api/ernaehrung/einkaufsliste");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        throw new Error("Fehler beim Laden");
      }
      const data = await res.json();
      setListe(data.einkaufsliste || {});
    } catch {
      toast.error("Einkaufsliste konnte nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  const kategorien = Object.keys(liste);
  const gesamtItems = kategorien.reduce(
    (sum, k) => sum + liste[k].length,
    0
  );

  // Loading
  if (loading) {
    return (
      <>
        <Header title="Einkaufsliste" showBack />
        <PageContainer>
          <SkeletonList />
        </PageContainer>
      </>
    );
  }

  // Empty
  if (kategorien.length === 0) {
    return (
      <>
        <Header title="Einkaufsliste" showBack />
        <PageContainer>
          <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
            <div className="p-4 rounded-3xl bg-secondary">
              <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                Keine Einkaufsliste
              </h2>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                Erstelle zuerst einen Ernährungsplan, dann wird die
                Einkaufsliste automatisch generiert.
              </p>
            </div>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Header title="Einkaufsliste" showBack />
      <PageContainer>
        <div className="space-y-6">
          {/* Summary */}
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted-foreground">
              {gesamtItems} Artikel
            </p>
            <p className="text-sm text-muted-foreground">
              {checked.size} erledigt
            </p>
          </div>

          {/* Categorized list */}
          {kategorien.map((kategorie) => {
            const stil = kategorieStile[kategorie] || kategorieStile["Sonstiges"];

            return (
              <div key={kategorie} className="space-y-2">
                <h3
                  className={cn(
                    "text-sm font-semibold uppercase tracking-wide px-1",
                    stil.farbe
                  )}
                >
                  {kategorie}
                </h3>
                <div className="space-y-1">
                  {liste[kategorie].map((item, idx) => {
                    const itemKey = `${kategorie}-${idx}-${item.name}`;
                    const istChecked = checked.has(itemKey);

                    return (
                      <button
                        key={itemKey}
                        onClick={() => toggleItem(itemKey)}
                        className={cn(
                          "flex items-center gap-3 w-full px-3 min-h-[48px] rounded-lg",
                          "text-left transition-colors",
                          "active:bg-muted/50",
                          istChecked && "opacity-50"
                        )}
                      >
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "flex items-center justify-center h-6 w-6 rounded-md border-2 shrink-0 transition-colors",
                            istChecked
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          )}
                        >
                          {istChecked && (
                            <Check className="h-4 w-4 text-primary-foreground" />
                          )}
                        </div>

                        {/* Item name */}
                        <span
                          className={cn(
                            "text-sm flex-1",
                            istChecked && "line-through text-muted-foreground"
                          )}
                        >
                          {item.name}
                        </span>

                        {/* Quantity */}
                        {item.menge && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {item.menge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </>
  );
}
