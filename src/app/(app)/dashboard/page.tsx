"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, UtensilsCrossed, TrendingUp, MessageCircle, Heart } from "lucide-react";

interface UserData {
  name: string;
  hasProfile: boolean;
  hasFitnessTest: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

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
      title: "Training starten",
      description: "Heutiges Workout durchführen",
      icon: Dumbbell,
      href: "/training",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Ernährungsplan",
      description: "Mahlzeiten für heute",
      icon: UtensilsCrossed,
      href: "/ernaehrung",
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Fortschritt",
      description: "Deine Entwicklung",
      icon: TrendingUp,
      href: "/fortschritt",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Wellness Check-in",
      description: "Wie fühlst du dich?",
      icon: Heart,
      href: "/wellness",
      color: "text-red-500 dark:text-red-400",
    },
    {
      title: "Coach fragen",
      description: "KI-Coach für Fragen",
      icon: MessageCircle,
      href: "/coach",
      color: "text-orange-600 dark:text-orange-400",
    },
  ];

  return (
    <>
      <Header title="Dashboard" />
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hallo, {user.name}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Was steht heute an?
          </p>
        </div>

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
