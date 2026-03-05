import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
  Waves,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartTrialButton } from "@/components/landing/start-trial-button";

const features = [
  {
    title: "Booking management",
    description: "Schedule lessons, manage time slots, and track check-ins.",
    icon: CalendarDays,
  },
  {
    title: "Equipment inventory",
    description: "Track boards, wetsuits, and gear by category and size.",
    icon: Package,
  },
  {
    title: "Instructor scheduling",
    description: "Assign instructors to lessons and manage their availability.",
    icon: Users,
  },
  {
    title: "Customer CRM",
    description: "Store customer details, rental history, and booking records.",
    icon: LayoutDashboard,
  },
  {
    title: "Revenue analytics",
    description: "Daily, weekly, and monthly revenue breakdowns and charts.",
    icon: BarChart3,
  },
  {
    title: "Payment integrations",
    description: "Connect Stripe and FareHarbor for online bookings.",
    icon: CreditCard,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div
        className="relative bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/TD_img.png)" }}
      >
        <div className="absolute inset-0 bg-white/70" aria-hidden />
        <header className="relative border-b border-black/5">
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
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Pricing
              </Link>
              <Link href="/login" className="text-sm font-medium">
                Sign in
              </Link>
              <Link href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                Sign up
              </Link>
              <StartTrialButton />
            </nav>
          </div>
        </header>

        <section className="relative container mx-auto px-4 py-20 md:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            TideDesk
          </h1>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Management Software for Surf Schools
          </p>
          <p className="mt-2 text-lg text-muted-foreground max-w-xl mx-auto">
            Bookings, equipment tracking, instructors and revenue — all in one
            place.
          </p>
          <div className="mt-10">
            <StartTrialButton size="lg" />
          </div>
        </section>
      </div>

      <main>

        <section className="border-t bg-muted/30 py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="rounded-lg border bg-card p-6 shadow-sm"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-6 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-12">Pricing</h2>
            <div className="max-w-md mx-auto rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="text-xl font-semibold">Starter Plan</h3>
              <p className="mt-2 text-4xl font-bold">69 NZD</p>
              <p className="text-muted-foreground">/ month</p>
              <ul className="mt-6 space-y-2 text-left text-sm">
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
          </div>
        </section>

        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © TideDesk
          </div>
        </footer>
      </main>
    </div>
  );
}

