"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, UtensilsCrossed, TrendingUp, MessageCircle, Heart, Activity, Moon, Zap } from "lucide-react";

interface UserData {
  name: string;
  hasProfile: boolean;
  hasFitnessTest: boolean;
}

interface WhoopData {
  whoopRecovery: number;
  whoopStrain: number | null;
  whoopHRV: number | null;
  whoopRestingHR: number | null;
  schlafStunden: number;
  whoopSyncedAt: Date;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [whoopData, setWhoopData] = useState<WhoopData | null>(null);
  const [whoopConnected, setWhoopConnected] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          setUser(data);
          if (!data.hasProfile) {
            router.push("/onboarding/willkommen");
          }
        }
      })
      .finally(() => setLoading(false));

    // Fetch WHOOP data
    fetch("/api/wellness/save")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.whoopData) {
          setWhoopData(data.whoopData);
        }
        if (data?.whoopConnected !== undefined) {
          setWhoopConnected(data.whoopConnected);
        }
      })
      .catch((err) => console.error("WHOOP fetch error:", err));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground text-lg">Laden...</div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Heutiges Training",
      description: "Workout jetzt starten",
      icon: Dumbbell,
      href: "/training",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Nächste Mahlzeit",
      description: "Was steht an?",
      icon: UtensilsCrossed,
      href: "/ernaehrung",
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Wellness Check-in",
      description: "Wie fühlst du dich heute?",
      icon: Heart,
      href: "/wellness",
      color: "text-red-500 dark:text-red-400",
    },
    {
      title: "Coach fragen",
      description: "Frag deinen KI-Coach",
      icon: MessageCircle,
      href: "/coach",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  const firstName = user.name.split(' ')[0];

  // Recovery color coding
  const getRecoveryColor = (recovery: number) => {
    if (recovery >= 67) return "text-green-600 dark:text-green-400";
    if (recovery >= 34) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRecoveryBgColor = (recovery: number) => {
    if (recovery >= 67) return "bg-green-500/20";
    if (recovery >= 34) return "bg-yellow-500/20";
    return "bg-red-500/20";
  };

  const getRecoveryLabel = (recovery: number) => {
    if (recovery >= 67) return "Erholt";
    if (recovery >= 34) return "Mittel";
    return "Niedrig";
  };

  return (
    <>
      <Header title="" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hallo, {firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Was steht heute an?
          </p>
        </div>

        {/* WHOOP Recovery Widget */}
        {whoopData && (
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                WHOOP Recovery
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main Recovery Score */}
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-5xl font-bold tracking-tight ${getRecoveryColor(whoopData.whoopRecovery)}`}>
                    {whoopData.whoopRecovery}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {getRecoveryLabel(whoopData.whoopRecovery)}
                  </div>
                </div>
                <div className={`p-6 rounded-full ${getRecoveryBgColor(whoopData.whoopRecovery)}`}>
                  <Zap className={`h-10 w-10 ${getRecoveryColor(whoopData.whoopRecovery)}`} />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {whoopData.schlafStunden && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                    <Moon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Schlaf</div>
                      <div className="font-semibold">{whoopData.schlafStunden}h</div>
                    </div>
                  </div>
                )}
                {whoopData.whoopHRV && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                    <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">HRV</div>
                      <div className="font-semibold">{whoopData.whoopHRV}ms</div>
                    </div>
                  </div>
                )}
                {whoopData.whoopRestingHR && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                    <Heart className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Ruhe-Puls</div>
                      <div className="font-semibold">{whoopData.whoopRestingHR} bpm</div>
                    </div>
                  </div>
                )}
                {whoopData.whoopStrain && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                    <TrendingUp className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground">Strain</div>
                      <div className="font-semibold">{whoopData.whoopStrain.toFixed(1)}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.href}
              className="cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => router.push(action.href)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-3 rounded-2xl bg-secondary ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
