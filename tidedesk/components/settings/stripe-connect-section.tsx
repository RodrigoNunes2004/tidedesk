"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ExternalLink, AlertCircle } from "lucide-react";

type StripeConnectSectionProps = {
  stripeAccountId?: string | null;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  stripeConnected?: boolean;
  connectError?: string;
};

export function StripeConnectSection({
  stripeAccountId,
  chargesEnabled = false,
  payoutsEnabled = false,
  detailsSubmitted = false,
  stripeConnected = false,
  connectError: initialError,
}: StripeConnectSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!stripeAccountId;
  const canAcceptPayments = chargesEnabled && payoutsEnabled;

  const errorMessages: Record<string, string> = {
    invalid_business: "Invalid business. Please try again.",
    no_account: "No Stripe account found. Please connect again.",
    connect_failed: "Failed to sync Stripe account. Please try again.",
    connect_refresh_failed: "Link expired. Please connect again.",
  };

  useEffect(() => {
    // Don't show connect_failed if we're actually connected (webhook may have synced)
    if (initialError && !(initialError === "connect_failed" && canAcceptPayments)) {
      setError(errorMessages[initialError] ?? initialError);
    }
  }, [initialError, canAcceptPayments]);

  useEffect(() => {
    if (stripeConnected) {
      router.refresh();
    }
  }, [stripeConnected, router]);

  async function handleConnect() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe/connect", { method: "POST" });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Failed to create Connect link");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <CreditCard className="size-4" />
            Stripe Connect
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Accept card payments from customers. Connect your Stripe account to receive payouts.
          </p>
        </div>
        {isConnected ? (
          canAcceptPayments ? (
            <Badge variant="default" className="bg-green-600 hover:bg-green-600">
              Ready to accept payments
            </Badge>
          ) : (
            <Badge variant="secondary">
              Onboarding incomplete
            </Badge>
          )
        ) : (
          <Badge variant="secondary">Not connected</Badge>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-3 py-2 text-sm flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {!canAcceptPayments && isConnected && (
        <p className="text-sm text-muted-foreground">
          Complete onboarding in Stripe to enable card payments. You may need to verify your identity
          and bank details.
        </p>
      )}

      {!isConnected ? (
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? "Redirecting…" : "Connect Stripe"}
        </Button>
      ) : (
        <Button variant="outline" onClick={handleConnect} disabled={loading}>
          {loading ? "Redirecting…" : (
            <>
              <ExternalLink className="size-4 mr-2" />
              Complete / update onboarding
            </>
          )}
        </Button>
      )}
    </div>
  );
}
