import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/25 hover:from-brand-600 hover:to-brand-700 hover:shadow-lg",
      secondary:
        "bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300",
      outline:
        "border-2 border-brand-500/30 bg-transparent text-brand-700 hover:bg-brand-50",
      danger:
        "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 hover:from-red-600 hover:to-red-700",
      ghost: "text-slate-600 hover:bg-slate-100/80",
    };
    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-lg",
      md: "px-4 py-2.5 text-sm rounded-xl",
      lg: "px-6 py-3 text-base rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
