"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Sparkles } from "lucide-react";

type BillingSectionProps = {
  /** When false, user has no Stripe subscription — show "Subscribe to Premium" instead of portal */
  hasSubscription?: boolean;
};

export function BillingSection({ hasSubscription = true }: BillingSectionProps) {
  const [loading, setLoading] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  async function openBillingPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        alert(data.error ?? "Failed to open billing portal");
      }
    } catch {
      setLoading(false);
      alert("Failed to open billing portal");
    }
  }

  async function startUpgrade(plan: "starter" | "pro" | "premium" = "premium") {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setUpgradeLoading(false);
        alert(data.error ?? "Failed to start checkout");
      }
    } catch {
      setUpgradeLoading(false);
      alert("Failed to start checkout");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          {hasSubscription
            ? "Manage your subscription, upgrade or downgrade plans, update payment method, cancel, or download invoices."
            : "Subscribe to unlock Premium features like marine forecast, API access, and more. 30-day free trial included."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasSubscription ? (
          <>
            <Button
              onClick={openBillingPortal}
              disabled={loading}
              className="gap-2"
            >
              <CreditCard className="size-4" />
              {loading ? "Opening…" : "Manage subscription"}
            </Button>
            <p className="text-sm text-muted-foreground">
              You will be redirected to Stripe. Choose Starter, Pro, or Premium and switch plans anytime.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => startUpgrade("premium")}
                disabled={upgradeLoading}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                {upgradeLoading ? "Redirecting…" : "Subscribe to Premium"}
              </Button>
              <Button
                variant="outline"
                onClick={() => startUpgrade("pro")}
                disabled={upgradeLoading}
              >
                Pro
              </Button>
              <Button
                variant="outline"
                onClick={() => startUpgrade("starter")}
                disabled={upgradeLoading}
              >
                Starter
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              All plans include a 30-day free trial. You will be redirected to Stripe to complete checkout.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
