import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { StartTrialButton } from "@/components/landing/start-trial-button";
import { PLANS } from "@/lib/plans";

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
              className="h-10 w-auto shrink-0"
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
        <h1 className="text-3xl font-bold text-center mb-4">Pricing</h1>
        <p className="text-center text-muted-foreground mb-12">
          30-day free trial on all plans. Upgrade or downgrade anytime.
        </p>
        <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
          {PLANS.map((p) => (
            <div
              key={p.plan}
              className={`relative rounded-xl border bg-card p-6 shadow-sm ${
                p.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                  Popular
                </div>
              )}
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <p className="mt-4 text-3xl font-bold">
                {p.price} <span className="text-base font-normal text-muted-foreground">NZD</span>
              </p>
              <p className="text-sm text-muted-foreground">/ month</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Check className="size-4 text-primary shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <StartTrialButton plan={p.plan} className="w-full" />
              </div>
            </div>
          ))}
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
