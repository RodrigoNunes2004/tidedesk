"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { DashboardProvider } from "@/lib/dashboard-context";
import { DashboardTopbar, TrialBanner } from "@/components/dashboard";
import type { Tier } from "@/lib/tiers";
import type { TierInfo } from "@/lib/dashboard-context";
import { useState } from "react";

export function DashboardShell({
  children,
  sidebar,
  tier,
  tierInfo,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  tier: Tier;
  tierInfo: TierInfo | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <DashboardProvider closeSidebar={() => setOpen(false)} tier={tier} tierInfo={tierInfo}>
      <div className="flex min-h-screen min-w-0 bg-background">
        <div className="hidden md:fixed md:inset-y-0 md:flex">{sidebar}</div>

        <div className="min-w-0 flex-1 md:pl-64">
          <DashboardTopbar onOpenNav={() => setOpen(true)} />
          <TrialBanner />
          <main className="min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6">{children}</main>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent
            side="left"
            className="w-[85vw] max-w-[280px] p-0 sm:max-w-[300px]"
          >
            {sidebar}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardProvider>
  );
}

