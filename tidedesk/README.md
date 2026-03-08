# TideDesk

Management software for surf schools and equipment rental businesses.

---

## What TideDesk Provides

**TideDesk** is a multi-tenant SaaS platform for surf schools and equipment rental businesses. It provides:

- **Customer management (CRM)** — Create, edit, search, and archive customers with contact info and notes; paginated lists with filters and sorting.
- **Rental management** — Create rentals (legacy equipment or category-based variants like Softboard, Wetsuit, Hardboard); track status (Active, Returned, Overdue, Cancelled); process returns and cancellations.
- **Lesson booking management** — Schedule lesson bookings with time windows; assign customers, lessons, instructors, and optional equipment allocations; lifecycle (Booked → Checked in → Completed) with no-show handling.
- **Equipment inventory** — Manage categories and variants (e.g. sizes); track quantities and low-stock thresholds; view availability from active rentals; support for legacy per-item equipment.
- **Instructor management** — Add instructors with certification, assign to lessons and bookings.
- **Revenue tracking** — Today / week / month summaries, rental vs lesson breakdown, daily revenue chart (14 or 30 days), activity counts and averages.
- **Stripe subscription billing** — 30-day free trial, 69 NZD/month Starter plan.
- **Public online booking page** — `/book/[school-slug]` — Lesson selection, time slots, customer form, pay now (Stripe) or pay later; embeddable iframe (`?embed=1`).
- **Multi-tenant architecture** — Data scoped by business; users belong to a business and operate within that scope.
- **Authentication and roles** — Credential-based sign-in (NextAuth), JWT sessions, roles (Owner, Staff, Instructor) with business-scoped access.

Built with Next.js 16, React 19, Tailwind, shadcn/ui, Prisma, PostgreSQL (Neon), and Stripe.

---

## How This App Works

### Access

1. **Landing page** — `/` shows TideDesk marketing site with Hero, Features, and Pricing.
2. **Sign up** — "Start 30-Day Free Trial" redirects to Stripe Checkout.
3. **Onboarding** — After checkout, complete business setup at `/onboarding`.
4. **Login** — Sign in at `/login` for returning users.
5. **Dashboard** — All app routes require authentication and redirect to login when there is no session.

### Navigation

- **Marketing** — `/` (home), `/pricing`, `/features`
- **Auth** — `/login`, `/register`
- **Public booking** — `/book/[school-slug]` — Customers book lessons online (no login required)
- **Dashboard** — Dashboard, Customers, Rentals, Bookings, Equipment, Instructors, Revenue, Settings

### Data Flow

- Pages load data in server components.
- API routes use `session.user.businessId` for tenant scoping.
- All database queries include `businessId` for tenant isolation.

---

## Getting Started

1. Install dependencies: `npm install`
2. Set up env vars (see `.env.example`):
   - `DATABASE_URL` — Neon PostgreSQL connection string
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` — optional, for SMS (booking confirmation + 24h reminders)
   - `NEXTAUTH_SECRET` — NextAuth secret (required)
   - `NEXTAUTH_URL` — App URL (e.g. `http://localhost:3000`, required for production)
   - `NEXT_PUBLIC_APP_URL` — App URL (Stripe redirects)
   - `STRIPE_SECRET_KEY` — Stripe secret key
   - `STRIPE_PRICE_ID` — Stripe price ID for 69 NZD/month
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
3. Run migrations: `npx prisma migrate dev`
4. Seed the database: `npm run db:seed`
5. Start the dev server: `npm run dev`
6. Open [http://localhost:3000](http://localhost:3000)

**Seed credentials** (after `npm run db:seed`): `owner@tidedesk.local` / `ChangeMe123!`

---

## Deployment

- **Platform**: Vercel
- **Database**: Neon PostgreSQL

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for Stripe setup and Auth/Vercel configuration.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org)
- [Stripe Billing](https://stripe.com/docs/billing)
