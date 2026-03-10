"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export function BillingSection() {
  const [loading, setLoading] = useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>
          Manage your subscription, upgrade or downgrade plans, update payment
          method, cancel, or download invoices. All plans include a 30-day free trial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          onClick={openBillingPortal}
          disabled={loading}
          className="gap-2"
        >
          <CreditCard className="size-4" />
          {loading ? "Opening…" : "Manage subscription"}
        </Button>
        <p className="mt-2 text-sm text-muted-foreground">
          You will be redirected to Stripe to manage your subscription. Choose
          Starter, Pro, or Premium and switch plans anytime.
        </p>
      </CardContent>
    </Card>
  );
}
