import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15",
            error && "border-red-400 focus:border-red-400 focus:ring-red-500/15",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
