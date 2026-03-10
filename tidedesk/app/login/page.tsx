"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res || res.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-8">
      <div className="flex w-full max-w-sm flex-col items-center gap-2">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground self-start">
          ← Back to TideDesk
        </Link>
        <Image
          src="/TD_logo.png"
          alt="TideDesk"
          width={384}
          height={96}
          className="h-auto w-full object-contain"
        />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error ? (
              <div className="text-sm text-destructive">{error}</div>
            ) : null}

            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                No account?{" "}
                <Link href="/register" className="font-medium text-foreground hover:underline">
                  Start free trial
                </Link>
              </p>
              <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                <span>Seed:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("owner@tidedesk.local");
                    setPassword("ChangeMe123!");
                  }}
                  className="font-medium text-foreground hover:underline cursor-pointer text-left"
                >
                  Fill as owner
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("instructor@tidedesk.local");
                    setPassword("ChangeMe123!");
                  }}
                  className="font-medium text-foreground hover:underline cursor-pointer text-left"
                >
                  Fill as instructor
                </button>
                <span className="text-muted-foreground">(password: ChangeMe123!)</span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

