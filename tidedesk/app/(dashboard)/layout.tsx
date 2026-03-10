import { requireSession } from "@/lib/server/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardShell } from "./shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <DashboardShell sidebar={<DashboardSidebar role={session.user.role} />}>
      {children}
    </DashboardShell>
  );
}

