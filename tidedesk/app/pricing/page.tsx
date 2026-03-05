import Image from "next/image";
import Link from "next/link";
import { Waves } from "lucide-react";
import { StartTrialButton } from "@/components/landing/start-trial-button";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/TD_logo.png"
              alt="TideDesk"
              width={40}
              height={40}
              className="shrink-0"
            />
            <span className="font-semibold text-lg">TideDesk</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/features"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Features
            </Link>
            <Link href="/login" className="text-sm font-medium">
              Sign in
            </Link>
            <StartTrialButton />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold text-center mb-12">Pricing</h1>
        <div className="max-w-md mx-auto rounded-xl border bg-card p-8 shadow-sm">
          <h2 className="text-xl font-semibold">Starter Plan</h2>
          <p className="mt-2 text-4xl font-bold">69 NZD</p>
          <p className="text-muted-foreground">/ month</p>
          <ul className="mt-6 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-primary shrink-0" />
              30-day free trial
            </li>
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-primary shrink-0" />
              Unlimited bookings
            </li>
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-primary shrink-0" />
              Equipment tracking
            </li>
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-primary shrink-0" />
              Instructor management
            </li>
            <li className="flex items-center gap-2">
              <Waves className="size-4 text-primary shrink-0" />
              Revenue dashboard
            </li>
          </ul>
          <div className="mt-8">
            <StartTrialButton className="w-full" />
          </div>
        </div>
      </main>

      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © TideDesk
        </div>
      </footer>
    </div>
  );
}
