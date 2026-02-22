"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [todayTrainingName, setTodayTrainingName] = useState<string | null>(null);
  const [nextMealName, setNextMealName] = useState<string | null>(null);

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

    // Fetch Training Plan
    fetch("/api/training/plan")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.plan?.einheiten) {
          const dayOfWeek1m7 = new Date().getDay() || 7;
          const todayTraining = data.plan.einheiten.find((e: any) => e.wochentag === dayOfWeek1m7);
          setTodayTrainingName(todayTraining ? todayTraining.name : "Du hast heute frei");
        } else {
          setTodayTrainingName("Kein aktiver Plan");
        }
      })
      .catch((err) => console.error("Training fetch error:", err));

    // Fetch Nutrition Plan
    fetch("/api/ernaehrung/tagesplan")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.plan?.mahlzeiten) {
          const nowHour = new Date().getHours();
          const nowMin = new Date().getMinutes();
          const nowTime = nowHour * 60 + nowMin;

          let nextMeal = data.plan.mahlzeiten.find((m: any) => {
            if (!m.uhrzeit) return false;
            const [hours, mins] = m.uhrzeit.split(':').map(Number);
            const mealTime = hours * 60 + mins;
            return mealTime >= nowTime;
          });

          if (!nextMeal && data.plan.mahlzeiten.length > 0) {
            nextMeal = data.plan.mahlzeiten[0];
          }

          if (nextMeal) {
            setNextMealName(`${nextMeal.name} (${nextMeal.uhrzeit || "Zeit flexibel"})`);
          } else {
            setNextMealName("Keine Mahlzeiten geplant");
          }
        } else {
          setNextMealName("Kein aktiver Ernährungsplan");
        }
      })
      .catch((err) => console.error("Nutrition fetch error:", err));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground text-lg">Laden...</div>
      </div>
    );
  }

  const firstName = user.name.split(' ')[0];

  const getRecoveryLabel = (recovery: number) => {
    if (recovery >= 67) return "ERHOLT";
    if (recovery >= 34) return "MODERAT";
    return "ERSCHÖPFT";
  };

  const quickActions = [
    {
      title: "Heutiges Training",
      description: todayTrainingName || "Lädt...",
      icon: "fitness_center",
      href: "/training",
      bgClass: "gradient-blue",
    },
    {
      title: "Nächste Mahlzeit",
      description: nextMealName || "Lädt...",
      icon: "restaurant",
      href: "/ernaehrung",
      bgClass: "gradient-green",
    },
    {
      title: "Wellness Check-in",
      description: "Wie fühlst du dich gerade?",
      icon: "ecg_heart",
      href: "/wellness",
      bgClass: "gradient-red",
    },
    {
      title: "Coach fragen",
      description: "Bereit für deine Fragen",
      icon: "smart_toy",
      href: "/coach",
      bgClass: "gradient-orange",
    },
  ];

  return (
    <div className="relative flex flex-col pt-0 pb-12 w-full">
      {/* Header */}
      <header className="flex items-center px-6 py-4 justify-between">
        <div className="flex items-center gap-4">
          <div className="size-14 shrink-0 rounded-full border-2 border-white/10 p-0.5">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-full"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCXmaJXNxc87o9f1nlyNjyIxoLK6hllKr3sm1TRkoJdub1HSoATTQcLCC8oxg3lesn5FdjKO5k6z7tHlaA6SnieQhiVJMJjaGYOELvr0BgXzwXssU0gLdD_5OOARpLmcJwU0tDzIHVZ0_uSAPAbTyOe7HC3b5T7hGLcU_W7DKLZloEPyUTMRiYhsUZTelyP51frh_gl33WG_YvpVFY6xF9CVoRbLQoA0-ZIjXy4b9zeqCU-ih5WgsnDYKLR3b_2UYSUYd-_P1zwfwM")' }}
            ></div>
          </div>
          <div>
            <h2 className="text-white text-xl font-extrabold tracking-tight leading-none uppercase italic">pitee</h2>
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Premium</p>
          </div>
        </div>
        <button className="flex size-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white transition-all active:scale-95 hover:bg-white/10">
          <span className="material-symbols-outlined text-2xl">notifications</span>
        </button>
      </header>

      {/* Greeting */}
      <div className="px-6 pt-2 pb-8">
        <h1 className="text-white text-5xl font-extrabold tracking-tighter italic">
          Hallo,<br />{firstName}!
        </h1>
        <p className="text-slate-500 text-lg mt-2 font-medium">Was steht heute an?</p>
      </div>

      {/* WHOOP Score Card */}
      {whoopConnected && whoopData && (
        <div className="px-6 mb-10">
          <div className="bg-[#121212] rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-[80px]"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-[0.15em] mb-1">Tages-Score</span>
                  <div className="flex items-center gap-4">
                    <span className="text-neon text-7xl font-extrabold tracking-tighter">
                      {whoopData ? Math.round(whoopData.whoopRecovery) : "--"}
                      <span className="text-3xl font-bold ml-1">%</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="bg-primary text-black px-4 py-1.5 rounded-full font-bold text-sm mb-2 uppercase">
                    {whoopData ? getRecoveryLabel(whoopData.whoopRecovery) : "Lädt"}
                  </div>
                  <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-blue-500 text-xl">dark_mode</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Schlaf</span>
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {whoopData?.schlafStunden || "--"}<span className="text-sm ml-1 text-slate-400">h</span>
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-primary text-xl">vital_signs</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">HRV</span>
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {whoopData?.whoopHRV || "--"}<span className="text-sm ml-1 text-slate-400">ms</span>
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-red-500 text-xl">favorite</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Puls</span>
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {whoopData?.whoopRestingHR || "--"}<span className="text-sm ml-1 text-slate-400">bpm</span>
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-3xl p-5 border border-white/[0.05]">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-orange-400 text-xl">monitoring</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Strain</span>
                  </div>
                  <p className="text-xl font-bold text-white tracking-tight">
                    {whoopData?.whoopStrain?.toFixed(1) || "--"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Daily Actions */}
      <div className="px-6 space-y-4">
        <h3 className="text-slate-400 text-sm font-extrabold uppercase tracking-[0.2em] mb-4">Daily Actions</h3>

        {quickActions.map((action, idx) => (
          <div
            key={idx}
            onClick={() => router.push(action.href)}
            className={`group relative overflow-hidden ${action.bgClass} p-6 rounded-[2.5rem] flex items-center gap-5 cursor-pointer active:scale-[0.97] transition-all`}
          >
            <div className="size-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
              <span className="material-symbols-outlined text-white text-4xl">{action.icon}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-extrabold text-xl tracking-tight">{action.title}</p>
              <p className="text-white/70 text-sm font-medium">{action.description}</p>
            </div>
            <span className="material-symbols-outlined text-white/50 group-active:text-white">arrow_forward_ios</span>
          </div>
        ))}

      </div>
    </div>
  );
}

