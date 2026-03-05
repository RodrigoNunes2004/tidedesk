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

export default function FeaturesPage() {
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
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login" className="text-sm font-medium">
              Sign in
            </Link>
            <StartTrialButton />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold text-center mb-12">Features</h1>
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
                <h2 className="mt-4 font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-16 text-center">
          <StartTrialButton size="lg" />
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
