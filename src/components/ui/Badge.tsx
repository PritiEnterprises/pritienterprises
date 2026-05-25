import { cn } from "@/lib/utils";

const variants: Record<string, string> = {
  default: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  success: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  warning: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80",
  danger: "bg-red-50 text-red-800 ring-1 ring-red-200/80",
  info: "bg-blue-50 text-blue-800 ring-1 ring-blue-200/80",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}
