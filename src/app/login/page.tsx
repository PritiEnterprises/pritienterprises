"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HardHat, Shield, BarChart3, Users } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const from = searchParams.get("from") || "/";
      router.push(from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-navy-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="relative">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-xl">
            <HardHat className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-8 text-3xl font-bold text-white">{t("appName")}</h1>
          <p className="mt-3 max-w-sm text-slate-400">{t("loginSubtitle")}</p>
        </div>
        <div className="relative space-y-4">
          {[
            { icon: Users, text: "Daily attendance & overtime" },
            { icon: BarChart3, text: "Payroll with advance deduction" },
            { icon: Shield, text: "Builder payment tracking" },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} className="flex items-center gap-3 text-slate-300">
              <div className="rounded-lg bg-white/10 p-2">
                <Icon className="h-4 w-4 text-brand-400" />
              </div>
              <span className="text-sm">{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-12">
        <div className="mb-6 flex justify-end lg:absolute lg:right-8 lg:top-8">
          <LanguageSwitcher compact />
        </div>
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <HardHat className="h-7 w-7 text-white" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">{t("loginTitle")}</h1>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-card lg:p-10">
            <h2 className="hidden text-xl font-bold text-slate-900 lg:block">{t("loginTitle")}</h2>
            <p className="mt-1 hidden text-sm text-slate-500 lg:block">{t("loginSubtitle")}</p>

            <form onSubmit={submit} className="mt-6 space-y-5">
              <Input
                label={t("username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
              <Input
                label={t("password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-100">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? t("signingIn") : t("signIn")}
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-slate-400">{t("defaultCredentials")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
