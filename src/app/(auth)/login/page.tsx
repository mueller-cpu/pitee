"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Anmeldung fehlgeschlagen");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      toast.error("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-slate-100 min-h-screen flex flex-col items-center justify-center p-6 antialiased bg-[#080C0D] font-sans pt-safe pb-safe">
      {/* Background Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#00E5FF] opacity-[0.07] blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#39FF14] opacity-[0.05] blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[420px] flex flex-col items-center">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="text-[#39FF14] text-5xl font-extrabold tracking-tighter italic">pitee</span>
          </div>
        </header>

        <div className="w-full bg-gradient-to-br from-[rgba(18,24,26,0.9)] to-[rgba(10,15,16,0.95)] backdrop-blur-[20px] p-10 rounded-3xl border border-white/5 shadow-2xl">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Willkommen zurück</h1>
            <p className="text-slate-400 text-base font-medium">Melde dich an, um fortzufahren</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider ml-1">
                E-Mail
              </label>
              <div className="relative group rounded-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-[#00E5FF]/20">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00E5FF] transition-colors">
                  <span className="material-symbols-outlined text-[22px]">alternate_email</span>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="block w-full h-16 pl-14 pr-4 rounded-2xl border border-white/10 bg-white/5 text-white text-lg placeholder:text-slate-600 focus:border-[#00E5FF] focus:ring-0 transition-all outline-none"
                  placeholder="deine@email.de"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">
                  Passwort
                </label>
              </div>
              <div className="relative group rounded-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-[#00E5FF]/20">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#00E5FF] transition-colors">
                  <span className="material-symbols-outlined text-[22px]">lock</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="block w-full h-16 pl-14 pr-14 rounded-2xl border border-white/10 bg-white/5 text-white text-lg placeholder:text-slate-600 focus:border-[#00E5FF] focus:ring-0 transition-all outline-none"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-500 hover:text-[#00E5FF] transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              <div className="text-right mt-2">
                <a className="text-[#00E5FF] text-sm font-semibold hover:opacity-80 transition-opacity" href="#">
                  Passwort vergessen?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-16 bg-[#39FF14] hover:brightness-110 text-black font-extrabold text-lg rounded-2xl shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all flex items-center justify-center gap-2 group",
                loading ? "opacity-70 cursor-not-allowed" : "active:scale-[0.98]"
              )}
            >
              {loading ? "Anmelden..." : "Anmelden"}
              {!loading && (
                <span className="material-symbols-outlined font-bold group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              )}
            </button>
          </form>
        </div>

        <footer className="mt-10 text-center">
          <p className="text-slate-400 text-base">
            Noch kein Konto?{" "}
            <Link href="/register" className="text-[#39FF14] font-bold hover:underline decoration-2 underline-offset-8 ml-1">
              Registrieren
            </Link>
          </p>
        </footer>

        <div className="mt-16 flex gap-8 opacity-30 grayscale hover:opacity-60 transition-all duration-500">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#00E5FF]">verified</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Secure Access</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-xl text-[#39FF14]">workspace_premium</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">Premium Fit</span>
          </div>
        </div>
      </main>
    </div>
  );
}
