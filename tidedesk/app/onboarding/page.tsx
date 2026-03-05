"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TIMEZONES = [
  "Pacific/Auckland",
  "Pacific/Chatham",
  "Australia/Sydney",
  "Australia/Melbourne",
  "UTC",
];

const CURRENCIES = ["NZD", "AUD", "USD", "EUR", "GBP"];

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("Pacific/Auckland");
  const [currency, setCurrency] = useState("NZD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("Missing checkout session. Please complete the checkout first.");
    }
  }, [sessionId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionId) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          businessName,
          ownerName,
          email,
          password,
          timezone,
          currency,
        }),
      });

      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data?.error ?? "Failed to complete setup");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created but sign-in failed. Please sign in manually.");
        setLoading(false);
        router.push("/login");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
        <Image
          src="/TD_logo.png"
          alt="TideDesk"
          width={120}
          height={40}
          className="object-contain"
        />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              No checkout session found. Please start by clicking &quot;Start
              30-Day Free Trial&quot; on the homepage.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Homepage
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <Image
        src="/TD_logo.png"
        alt="TideDesk"
        width={120}
        height={40}
        className="object-contain"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete your setup</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your business details and create your account.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business name *</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="My Surf School"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ownerName">Owner name *</Label>
              <Input
                id="ownerName"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account…" : "Complete setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <OnboardingForm />
    </Suspense>
  );
}
