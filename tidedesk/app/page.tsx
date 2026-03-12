import {
  CalendarDays,
  Check,
  CreditCard,
  LayoutDashboard,
  Package,
  Users,
  Waves,
  BarChart3,
} from "lucide-react";
import { StartTrialButton } from "@/components/landing/start-trial-button";
import { LandingHeader } from "@/components/landing/landing-header";
import { SiteFooter } from "@/components/landing/site-footer";
import { PLANS } from "@/lib/plans";

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
        <LandingHeader />

        <section className="relative container mx-auto px-4 pt-6 pb-24 sm:py-16 md:py-24 lg:py-32 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl px-2">
            TideDesk
          </h1>
          <p className="mt-2 sm:mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2">
            Management Software for Surf Schools
          </p>
          <p className="mt-1 sm:mt-2 text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-2">
            Bookings, equipment tracking, instructors and revenue — all in one
            place.
          </p>
          <div className="mt-4 sm:mt-8 md:mt-10">
            <StartTrialButton size="lg" />
          </div>
        </section>
      </div>

      <main>

        <section className="border-t bg-muted/30 py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
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

        <section className="py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Pricing</h2>
            <p className="text-muted-foreground mb-8 sm:mb-12">
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
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                  <p className="mt-4 text-3xl font-bold">
                    {p.price}{" "}
                    <span className="text-base font-normal text-muted-foreground">NZD</span>
                  </p>
                  <p className="text-sm text-muted-foreground">/ month</p>
                  <ul className="mt-6 space-y-2 text-left text-sm">
                    <li className="flex items-center gap-2">
                      <Waves className="size-4 text-primary shrink-0" />
                      30-day free trial
                    </li>
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
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}

