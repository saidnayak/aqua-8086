import React from "react";
import { Badge } from "./Badge";

export interface SectionHeaderProps {
  badge?: string;
  badgeVariant?: "cyan" | "blue" | "emerald" | "amber" | "slate";
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  badge,
  badgeVariant = "cyan",
  title,
  subtitle,
  centered = false,
  className = "",
  children,
}: SectionHeaderProps) {
  return (
    <div
      className={`mb-12 ${centered ? "text-center mx-auto max-w-3xl" : "max-w-3xl"} ${className}`}
    >
      {badge && (
        <div className={`mb-3 ${centered ? "flex justify-center" : ""}`}>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
      )}
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-slate-100">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-base sm:text-lg text-slate-400 leading-relaxed">
          {subtitle}
        </p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

