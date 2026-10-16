"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { CulturalReactionType } from "@/types";

export interface ReactionMeta {
  type: CulturalReactionType;
  emoji: string;
  hausaLabel: string;
  englishLabel: string;
  color: string;
}

export const CULTURAL_REACTIONS: ReactionMeta[] = [
  {
    type: "kauna",
    emoji: "❤️",
    hausaLabel: "Ƙauna",
    englishLabel: "Love",
    color: "text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40",
  },
  {
    type: "madalla",
    emoji: "👏",
    hausaLabel: "Madalla",
    englishLabel: "Bravo",
    color: "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40",
  },
  {
    type: "wuta",
    emoji: "🔥",
    hausaLabel: "Wuta",
    englishLabel: "Lit / Hot",
    color: "text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/40",
  },
  {
    type: "dariya",
    emoji: "😂",
    hausaLabel: "Dariya",
    englishLabel: "Haha",
    color: "text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-950/40",
  },
  {
    type: "alheri",
    emoji: "🤲",
    hausaLabel: "Alheri",
    englishLabel: "Blessing",
    color: "text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
  },
];

interface CulturalReactionsPickerProps {
  currentReaction?: CulturalReactionType | null;
  onSelectReaction: (type: CulturalReactionType) => void;
  lang?: "en" | "ha";
}

export function CulturalReactionsPicker({
  currentReaction,
  onSelectReaction,
  lang = "en",
}: CulturalReactionsPickerProps) {
  return (
    <div className="absolute -top-14 left-0 sm:left-4 z-40 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-full px-3 py-1.5 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
      {CULTURAL_REACTIONS.map((item) => {
        const isSelected = currentReaction === item.type;
        return (
          <button
            key={item.type}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectReaction(item.type);
            }}
            className={`group relative flex flex-col items-center p-1.5 rounded-full transition-transform hover:scale-125 ${
              isSelected ? "scale-110 bg-primary/10" : ""
            }`}
            title={lang === "ha" ? item.hausaLabel : item.englishLabel}
          >
            <span className="text-2xl leading-none transition-transform group-hover:-translate-y-1">
              {item.emoji}
            </span>
            <span className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-[10px] font-semibold px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none shadow">
              {lang === "ha" ? item.hausaLabel : item.englishLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
