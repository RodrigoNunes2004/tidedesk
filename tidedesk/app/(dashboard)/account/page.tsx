import { requireSession } from "@/lib/server/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AccountSection } from "@/components/settings/account-section";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await requireSession();
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  const avatarUrl = (currentUser as { avatarUrl?: string | null } | null)?.avatarUrl ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground">
          Manage your profile photo so others can see your face.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            Upload your photo to show in the dashboard. JPEG, PNG or WebP, max 4MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSection
            avatarUrl={avatarUrl}
            name={session.user.name ?? "User"}
            email={session.user.email ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}
