"use client";

import Link from "next/link";
import { useDashboardContext } from "@/lib/dashboard-context";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

function formatDaysUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function TrialBanner() {
  const ctx = useDashboardContext();
  const info = ctx?.tierInfo;

  if (!info?.trialEndsAt) return null;

  const now = new Date();
  const ended = info.trialEndsAt <= now;

  // Show banner when: trial ended, or trial ends within 7 days
  const daysLeft = Math.ceil((info.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (!ended && daysLeft > 7) return null;

  return (
    <div
      className={
        ended
          ? "border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
          : "border-b border-blue-200 bg-blue-50 px-4 py-3 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100"
      }
    >
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span className="text-sm font-medium">
            {ended ? (
              <>Your free trial ended on {formatDate(info.trialEndsAt)}. Choose a plan to keep all features.</>
            ) : (
              <>
                Your trial ends {formatDaysUntil(info.trialEndsAt)} ({formatDate(info.trialEndsAt)}).{" "}
                Upgrade now to keep access to all features.
              </>
            )}
          </span>
        </div>
        <Button asChild variant={ended ? "default" : "secondary"} size="sm" className="shrink-0">
          <Link href="/settings?tab=billing">Choose plan</Link>
        </Button>
      </div>
    </div>
  );
}
