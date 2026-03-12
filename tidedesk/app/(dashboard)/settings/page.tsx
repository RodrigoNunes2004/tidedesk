import Link from "next/link";
import { requireStaffOrOwner } from "@/lib/server/role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountSection } from "@/components/settings/account-section";
import { BusinessProfileForm } from "@/components/settings/business-profile-form";
import { BillingSection } from "@/components/settings/billing-section";
import { IntegrationsSection } from "@/components/settings/integrations-section";
import { InstructorsSection } from "@/components/settings/instructors-section";
import { PaymentSettingsForm } from "@/components/settings/payment-settings-form";
import { StripeConnectSection } from "@/components/settings/stripe-connect-section";
import { OnlineBookingSection } from "@/components/settings/online-booking-section";
import { ApiKeysSection } from "@/components/settings/api-keys-section";
import { WebhookEndpointsSection } from "@/components/settings/webhook-endpoints-section";
import { FeatureGate } from "@/lib/tiers/feature-gate";
import { prisma } from "@/lib/prisma";
import { Building2, CreditCard, DollarSign, Key, Plug, User, Users } from "lucide-react";

type SearchParams = Promise<{ tab?: string; stripe_connected?: string; error?: string }>;

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const defaultTab =
    params.tab === "payment" ||
    params.tab === "integrations" ||
    params.tab === "api" ||
    params.tab === "billing" ||
    params.tab === "profile" ||
    params.tab === "instructors" ||
    params.tab === "account"
      ? params.tab
      : "account";
  const session = await requireStaffOrOwner();
  const businessId = session.user.businessId;

  const [business, currentUser, subscription] = await Promise.all([
    prisma.business.findUniqueOrThrow({ where: { id: businessId } }),
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.subscription.findUnique({
      where: { businessId },
      select: { stripeCustomerId: true },
    }),
  ]);

  const avatarUrl = (currentUser as { avatarUrl?: string | null } | null)?.avatarUrl ?? null;
  const hasSubscription = Boolean(subscription?.stripeCustomerId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business profile, integrations, and payment defaults.
        </p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="flex w-full max-w-3xl flex-wrap gap-1 sm:grid sm:grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="size-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <Building2 className="size-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <DollarSign className="size-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="instructors" className="flex items-center gap-2">
            <Users className="size-4" />
            Instructors
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="size-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="size-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="size-4" />
            Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
          <OnlineBookingSection
            slug={business.slug}
            onlineBookingEnabled={(business as { onlineBookingEnabled?: boolean }).onlineBookingEnabled ?? true}
            onlineBookingMessage={(business as { onlineBookingMessage?: string | null }).onlineBookingMessage ?? null}
            businessHoursOpen={(business as { businessHoursOpen?: number | null }).businessHoursOpen ?? null}
            businessHoursClose={(business as { businessHoursClose?: number | null }).businessHoursClose ?? null}
          />
          <Card>
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>
                Used on invoices, Stripe, and multi-tenant scaling.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessProfileForm
                business={{
                  ...business,
                  latitude: business.latitude != null ? Number(business.latitude) : null,
                  longitude: business.longitude != null ? Number(business.longitude) : null,
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <BillingSection hasSubscription={hasSubscription} />
        </TabsContent>

        <TabsContent value="instructors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instructor Management</CardTitle>
              <CardDescription>
                Add instructors, set hourly rates (for payroll), and toggle active status. Only
                active instructors appear in the booking form.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InstructorsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>
                Connect Stripe, FareHarbor, or Weather API (coming soon). Enter credentials and click Connect.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationsSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <FeatureGate
            feature="api"
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>API Access</CardTitle>
                  <CardDescription>
                    REST API and webhooks are available on Premium. Upgrade to create API keys and receive webhook events.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href="/pricing"
                    className="text-sm text-primary hover:underline"
                  >
                    Upgrade to Premium →
                  </Link>
                </CardContent>
              </Card>
            }
          >
            <Card>
              <CardHeader>
                <CardTitle>API Access</CardTitle>
                <CardDescription>
                  REST API and webhooks for Premium. Create API keys and webhook endpoints to integrate with your apps.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <ApiKeysSection />
                <WebhookEndpointsSection />
              </CardContent>
            </Card>
          </FeatureGate>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <StripeConnectSection
            stripeAccountId={business.stripeAccountId}
            chargesEnabled={business.chargesEnabled}
            payoutsEnabled={business.payoutsEnabled}
            detailsSubmitted={business.detailsSubmitted}
            stripeConnected={params.stripe_connected === "1"}
            connectError={params.error}
          />
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>
                Default payment method for manual entries. Revenue tab can filter by provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentSettingsForm business={business} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
