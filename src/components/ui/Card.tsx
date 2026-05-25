import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition-shadow hover:shadow-card-hover",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
          {title && (
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {title}
            </h3>
          )}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "brand",
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "brand" | "green" | "blue" | "amber" | "red";
  icon?: ReactNode;
}) {
  const styles = {
    brand: "from-brand-500/10 to-brand-600/5 border-brand-200/60 text-brand-700",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-200/60 text-emerald-700",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-200/60 text-blue-700",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-200/60 text-amber-700",
    red: "from-red-500/10 to-red-600/5 border-red-200/60 text-red-700",
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-5 shadow-card transition hover:shadow-card-hover",
        styles[accent]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
        </div>
        {icon && (
          <div className="rounded-xl bg-white/80 p-2.5 shadow-sm">{icon}</div>
        )}
      </div>
    </div>
  );
}
