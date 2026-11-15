import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "cyan" | "blue" | "emerald" | "amber" | "slate" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  children,
  variant = "cyan",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    cyan: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    blue: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    slate: "bg-slate-800/80 text-slate-300 border-slate-700",
    outline: "bg-transparent text-slate-300 border-slate-700",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-mono tracking-wider",
    md: "px-2.5 py-1 text-xs font-mono tracking-wider",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium uppercase transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

