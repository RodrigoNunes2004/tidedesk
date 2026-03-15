import type { SurfRating } from "@/lib/surf/evaluateConditions";
import { cn } from "@/lib/utils";

const BADGE_STYLES: Record<
  SurfRating,
  { className: string }
> = {
  Excellent: { className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  Good: { className: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  Average: { className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  Poor: { className: "bg-red-500/15 text-red-700 dark:text-red-400" },
};

type ConditionBadgeProps = {
  label: SurfRating;
  className?: string;
};

export function ConditionBadge({ label, className }: ConditionBadgeProps) {
  const style = BADGE_STYLES[label];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        style?.className ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {label}
    </span>
  );
}
