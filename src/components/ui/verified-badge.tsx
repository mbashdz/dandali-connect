"use client";

import React from "react";
import { BadgeCheck } from "lucide-react";

interface VerifiedBadgeProps {
  type?: "creator" | "merchant" | "leader";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function VerifiedBadge({
  type = "creator",
  size = "sm",
  showLabel = false,
  className = "",
}: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  const colorClasses =
    type === "merchant"
      ? "text-emerald-500 fill-emerald-500/20"
      : type === "leader"
      ? "text-amber-500 fill-amber-500/20"
      : "text-primary fill-primary/20";

  const labelText =
    type === "merchant"
      ? "Verified Merchant"
      : type === "leader"
      ? "Community Leader"
      : "Verified";

  return (
    <span
      title={`${labelText} • Zaure Connect`}
      className={`inline-flex items-center gap-1 shrink-0 select-none ${className}`}
    >
      <BadgeCheck className={`${sizeClasses} ${colorClasses} drop-shadow-xs`} />
      {showLabel && (
        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
          {labelText}
        </span>
      )}
    </span>
  );
}
