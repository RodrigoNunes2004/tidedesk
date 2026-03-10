"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Tier } from "@/lib/tiers";

export type TierInfo = {
  tier: Tier;
  trialEndsAt: Date | null;
  isTrialing: boolean;
};

type DashboardContextValue = {
  closeSidebar: () => void;
  tier: Tier | null;
  tierInfo: TierInfo | null;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboardContext() {
  return useContext(DashboardContext);
}

export function DashboardProvider({
  children,
  closeSidebar,
  tier,
  tierInfo,
}: {
  children: ReactNode;
  closeSidebar: () => void;
  tier: Tier | null;
  tierInfo: TierInfo | null;
}) {
  return (
    <DashboardContext.Provider value={{ closeSidebar, tier, tierInfo }}>
      {children}
    </DashboardContext.Provider>
  );
}
