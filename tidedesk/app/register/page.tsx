"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StartTrialButton } from "@/components/landing/start-trial-button";

export default function RegisterPage() {
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
          <CardTitle>Create an account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Start your 30-day free trial to get access to TideDesk. No credit
            card required until trial ends.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <StartTrialButton className="w-full" />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
