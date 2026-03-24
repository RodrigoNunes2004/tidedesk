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
      <div className="relative w-full max-w-none overflow-hidden">
        {/* Photo hero: tablets/desktop only — full asset reads busy on small phones */}
        <div
          className="pointer-events-none absolute inset-0 hidden bg-cover bg-center bg-no-repeat md:block 2xl:bg-position-[center_40%]"
          style={{ backgroundImage: "url(/TD_img.png)" }}
          aria-hidden
        />
        {/* Mobile: same hero art, very soft + cropped so it reads as texture (not busy) */}
        <div
          className="pointer-events-none absolute inset-0 bg-size-[min(280%,1200px)_auto] bg-position-[50%_100%] bg-no-repeat opacity-[0.34] saturate-110 md:hidden"
          style={{ backgroundImage: "url(/TD_img.png)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_130%_90%_at_50%_-18%,rgba(14,165,233,0.22)_0%,transparent_55%)] md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(186,230,253,0.5)_0%,rgba(240,249,255,0.92)_32%,var(--background)_58%,color-mix(in_srgb,var(--muted)_75%,var(--background))_100%)] md:hidden"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-white/70 max-md:bg-white/[0.07]"
          aria-hidden
        />
        <LandingHeader />

        <section className="relative mx-auto w-full max-w-none px-4 pt-8 pb-24 text-center sm:px-6 sm:pt-16 sm:pb-20 md:pt-24 md:pb-32 lg:px-8 lg:pt-28 lg:pb-44 xl:pt-32 xl:pb-52 2xl:pb-60 2xl:pt-32">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl px-2">
            TideDesk
          </h1>
          {/* One line of copy on small screens; split headline + sub from md up */}
          <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-md mx-auto px-2 md:hidden">
            <span className="font-semibold text-foreground">
              Management software for surf schools
            </span>
            {" "}
            — bookings, equipment, instructors and revenue in one place.
          </p>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-2 hidden md:block">
            Management Software for Surf Schools
          </p>
          <p className="mt-2 sm:mt-2 text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto px-2 hidden md:block">
            Bookings, equipment tracking, instructors and revenue — all in one
            place.
          </p>
          <div className="mt-8 sm:mt-8 md:mt-10">
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

