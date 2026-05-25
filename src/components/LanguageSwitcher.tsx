"use client";

import { useTranslation } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ compact }: { compact?: boolean }) {
  const { locale, setLocale, t } = useTranslation();

  if (compact) {
    return (
      <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5 text-xs">
        {(["hi", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              "flex-1 px-3 py-2 font-semibold transition",
              locale === l
                ? "bg-brand-500 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            )}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">{t("language")}</label>
      <div className="flex gap-2">
        {(["hi", "en"] as Locale[]).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              locale === l
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {l === "hi" ? t("hindi") : t("english")}
          </button>
        ))}
      </div>
    </div>
  );
}
