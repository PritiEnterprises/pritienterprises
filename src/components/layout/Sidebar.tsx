"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wallet,
  Receipt,
  Building2,
  Banknote,
  FileText,
  HardHat,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { TranslationKey } from "@/lib/i18n/translations";

const nav: { href: string; labelKey: TranslationKey; icon: typeof LayoutDashboard }[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/employees", labelKey: "employees", icon: Users },
  { href: "/attendance", labelKey: "attendance", icon: CalendarDays },
  { href: "/advances", labelKey: "advances", icon: Wallet },
  { href: "/payroll", labelKey: "payroll", icon: Receipt },
  { href: "/projects", labelKey: "projects", icon: Building2 },
  { href: "/builder-payments", labelKey: "builderPayments", icon: Banknote },
  { href: "/reports", labelKey: "reports", icon: FileText },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function Sidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[17rem] flex-col bg-navy-950 shadow-sidebar transition-transform duration-300",
          open ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0"
        )}
      >
        <div className="relative overflow-hidden border-b border-white/10 px-5 py-6">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-lg shadow-brand-500/30">
              <HardHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">
                {t("appTagline")}
              </p>
              <h1 className="text-base font-bold leading-tight text-white">{t("appName")}</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-gradient-to-r from-brand-600/90 to-brand-500/80 text-white shadow-md shadow-brand-900/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && <span className="nav-active-indicator" />}
                <Icon className={cn("h-5 w-5 shrink-0", active && "text-brand-100")} />
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/10 p-4">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </button>
        </div>
      </aside>
    </>
  );
}
