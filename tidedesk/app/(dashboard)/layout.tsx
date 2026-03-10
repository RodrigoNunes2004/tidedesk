import { requireSession } from "@/lib/server/session";
import { getBusinessTier, getTierContext } from "@/lib/tiers/get-business-tier";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "./shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const businessId = session.user.businessId!;
  const [tier, tierInfo] = await Promise.all([
    getBusinessTier(businessId),
    getTierContext(businessId),
  ]);

  return (
    <DashboardShell
      sidebar={<DashboardSidebar role={session.user.role} />}
      tier={tier}
      tierInfo={tierInfo}
    >
      {children}
    </DashboardShell>
  );
}

