"use client";

import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import type { TranslationKey } from "@/lib/i18n/translations";

const routeKeys: Record<string, TranslationKey> = {
  "/": "dashboard",
  "/employees": "employees",
  "/attendance": "attendance",
  "/advances": "advances",
  "/payroll": "payroll",
  "/projects": "projects",
  "/builder-payments": "builderPayments",
  "/reports": "reports",
  "/settings": "settings",
};

export function TopBar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const base = "/" + (pathname.split("/")[1] || "");
  const titleKey = routeKeys[base] || "dashboard";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/70 px-6 py-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
            {t("appName")}
          </p>
          <h2 className="text-lg font-bold text-slate-900">{t(titleKey)}</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-md">
          PE
        </div>
      </div>
    </header>
  );
}
