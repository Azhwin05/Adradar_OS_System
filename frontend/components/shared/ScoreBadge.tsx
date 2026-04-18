import { cn } from "@/lib/utils";
import type { ScoreTier } from "@/types";

interface ScoreBadgeProps {
  score: number | null;
  tier: ScoreTier | null;
  className?: string;
}

const TIER_CONFIG: Record<ScoreTier, { label: string; emoji: string; classes: string }> = {
  hot: {
    label: "Hot",
    emoji: "🔥",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  warm: {
    label: "Warm",
    emoji: "✅",
    classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  review: {
    label: "Review",
    emoji: "⚠️",
    classes: "bg-gray-50 text-gray-600 border-gray-200",
  },
};

export function ScoreBadge({ score, tier, className }: ScoreBadgeProps) {
  if (score === null || tier === null) {
    return (
      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-gray-50 text-gray-400 border-gray-100", className)}>
        —
      </span>
    );
  }

  const config = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold",
        config.classes,
        className
      )}
    >
      <span>{config.emoji}</span>
      <span>{score}</span>
      <span className="font-normal">{config.label}</span>
    </span>
  );
}
