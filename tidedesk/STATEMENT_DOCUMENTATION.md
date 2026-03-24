# TideDesk — Full Statement Documentation

**Product:** TideDesk — Management Software for Surf Schools  
**Version:** 0.1.0  
**Document Type:** Comprehensive statement of features, design, implementation, UX, and benefits  
**Audiences:** Developers, product managers, UX designers, surf school operators

---

## 1. Executive Summary

TideDesk is a SaaS application built for surf schools and water sports operators. It centralizes **bookings**, **equipment tracking**, **instructor management**, **payments**, **weather intelligence**, and **revenue analytics** in a single platform. The product is differentiated by its combination of booking logistics, marine weather integration, and equipment tracking—features rarely offered together in typical booking platforms.

---

## 2. User Personas & Interaction Overview

### 2.1 User Types

| Persona | Description | Primary Access | Key Activities |
|---------|-------------|---------------|----------------|
| **Owner** | Surf school owner/operator | Full dashboard, Settings, Billing | Business setup, revenue review, billing, API config |
| **Staff** | Office or beach staff | Dashboard, Bookings, Rentals, Equipment, Beach mode | Day-to-day bookings, check-ins, rentals, POS |
| **Instructor** | Surf instructor | Dashboard, Bookings, Customers | View today's lessons, check-in students, limited CRM |
| **Customer** | End consumer (student or renter) | Public booking widget only | Book lessons, pay deposits/full, receive confirmations |

### 2.2 How Users Interact with the Software

- **Owners/Staff**: Log in → Dashboard → Navigate via sidebar (Dashboard, Customers, Rentals, Beach, Bookings, Equipment, Instructors, Revenue, Analytics) → Perform CRUD on customers, bookings, rentals, equipment.
- **Instructors**: Log in → See restricted sidebar (no Rentals, Equipment, Revenue, Settings) → View Bookings and Customers relevant to their role.
- **Customers**: Visit `/book/[school-slug]` (or embed) → Choose lesson/rental → Select date/time → Fill contact info → Pay via Stripe (deposit or full) → Receive confirmation (email + optional SMS).

---

## 3. Features — Complete Inventory

### 3.1 Core (Starter — $69 NZD/month)

| # | Feature | Description | Implementation Notes |
|---|---------|-------------|----------------------|
| 1 | **CRM & Customers** | Customer records with search, filter, archive, notes | `Customer` model; `customers/page.tsx`; archive via `archivedAt` |
| 2 | **Bookings & Rentals** | Lesson bookings and equipment rentals with status workflow | `Booking`, `Rental` models; `bookings/page.tsx`; status: BOOKED → CHECKED_IN → COMPLETED |
| 3 | **Payments** | Manual (Cash, EFTPOS, Card, Transfer) + Stripe Connect | `Payment` model; `payments/route.ts`; Stripe Connect for card |
| 4 | **Dashboard** | Today's metrics: customers, active rentals, today's bookings, revenue, equipment out | `dashboard/page.tsx`; aggregate queries |
| 5 | **Equipment Tracking** | Categories, variants, availability, quantity | `EquipmentCategory`, `EquipmentVariant`, `Equipment` models; `/equipment` |
| 6 | **Instructor Management** | CRUD, assign to lessons, hourly rate, active status | `Instructor` model; `/instructors`; invite flow |
| 7 | **Revenue Charts** | Daily, weekly, monthly revenue views | `/revenue`; Recharts; `revenue/page.tsx` |

### 3.2 Pro ($129 NZD/month)

| # | Feature | Description | Implementation Notes |
|---|---------|-------------|----------------------|
| 1 | **Weather Intelligence** | Stormglass API, marine forecast, WEATHER_ALERT cron | `integrations/stormglass.ts`; `MarineForecastWidget`; cron `/api/cron/weather` |
| 2 | **SMS Notifications** | Twilio: confirmation, 24h reminders | `notificationService`; Twilio integration |
| 3 | **Booking Widget** | Public `/book/[slug]`; embeddable via `?embed=1` | `PublicBookingForm`; slots API; Stripe checkout |
| 4 | **Deposit Payments** | `Lesson.depositAmount`, pay deposit/full/balance | Stripe sessions for deposit vs full vs balance |
| 5 | **Instructor Portal** | Restricted UI for INSTRUCTOR role | `DashboardSidebar` role filter; limited nav |
| 6 | **CSV Export** | Export customers, bookings, revenue | `ExportButton`; `/api/export`; Pro+ gated |

### 3.3 Premium ($199 NZD/month)

| # | Feature | Description | Implementation Notes |
|---|---------|-------------|----------------------|
| 1 | **WindGuru Integration** | Marine forecast widget, optional WindGuru spot link | `MarineForecastWidget`; `Business.windguruSpotId` |
| 2 | **Advanced Analytics** | Revenue, bookings, students, instructors, equipment, alerts | `/analytics`; `analytics.service.ts`; DailyAnalytics cron |
| 3 | **POS Beach Mode** | Tablet UI for check-in, returns, quick rental | `/beach`; `BeachCheckInSection`, `BeachReturnSection`, `BeachQuickRentalSection` |
| 4 | **API Access** | REST API v1, API keys, webhooks | `/api/v1/*`; `ApiKey`, `WebhookEndpoint`; Bearer/X-API-Key auth |
| 5 | **Offline Mode** | PWA service worker (planned) | Not yet implemented |
| 6 | **White Label** | Custom domain, remove TideDesk branding (planned) | Not yet implemented |
| 7 | **FareHarbor Integration** | External booking sync (planned) | Not yet implemented |

---

## 4. Developer Perspective — Architecture & Implementation

### 4.1 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19 |
| Database | PostgreSQL (Neon serverless), Prisma 7 |
| Auth | NextAuth.js (JWT, credentials) |
| Payments | Stripe (Connect + Subscriptions) |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts |
| Email | React Email, Resend |
| SMS | Twilio |
| Weather | Stormglass API |
| Rate Limiting | Upstash Redis |

### 4.2 Project Structure

```
tidedesk/
├── app/
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── rentals/
│   │   ├── beach/          # POS beach mode (Premium)
│   │   ├── bookings/
│   │   ├── equipment/
│   │   ├── instructors/
│   │   ├── revenue/
│   │   ├── analytics/      # Premium
│   │   ├── account/
│   │   └── settings/
│   ├── (legal)/            # Terms, privacy, refund, cookie policy
│   ├── book/[businessSlug]/ # Public booking flow
│   ├── api/                # API routes
│   │   ├── auth/
│   │   ├── public/         # Public school endpoints (rate limited)
│   │   ├── v1/             # REST API (Premium)
│   │   ├── cron/           # Scheduled jobs
│   │   └── ...
│   ├── login/
│   ├── register/
│   ├── onboarding/
│   ├── pricing/
│   └── ...
├── components/
│   ├── analytics/
│   ├── beach/
│   ├── bookings/
│   ├── book/               # Public booking form
│   ├── customers/
│   ├── dashboard/
│   ├── equipment/
│   ├── weather/
│   ├── ocean/
│   └── ui/                 # shadcn components
├── lib/
│   ├── auth.ts
│   ├── prisma.ts
│   ├── tiers/              # Feature gating
│   ├── rate-limit.ts
│   ├── currency.ts
│   └── weather/
├── modules/
│   ├── analytics/
│   ├── weather/
│   └── notifications/
├── integrations/
│   └── stormglass.ts
├── emails/                 # React Email templates
├── jobs/                    # Background jobs (e.g. weather)
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

### 4.3 Key Implementation Patterns

- **Feature Gating**: `hasFeature(tier, feature)` in `lib/tiers`; `FeatureGate` component for UI; server-side checks on API routes.
- **Role-Based Access**: `requireSession`, `requireStaffOrOwner`; sidebar filtered by `UserRole` (OWNER, STAFF, INSTRUCTOR).
- **Tenant Isolation**: All queries scoped by `businessId` from session.
- **Multi-Currency**: Business-level `currency`; `formatCurrency` in `lib/currency`.
- **Timezone**: Business-level `timezone`; used for slots, forecasts, display.

### 4.4 API Design

| Endpoint Pattern | Auth | Purpose |
|------------------|------|---------|
| `/api/auth/[...nextauth]` | — | NextAuth session |
| `/api/public/schools/[slug]/*` | None (rate limited) | Slots, bookings, confirmation |
| `/api/v1/bookings`, `/customers`, `/payments` | Bearer or X-API-Key | REST API (Premium) |
| `/api/*` (internal) | Session | CRUD for dashboard |

### 4.5 Data Model Highlights

- **Business**: Central tenant; has `slug`, `timezone`, `currency`, `latitude/longitude`, `windguruSpotId`, Stripe Connect fields.
- **Booking**: Links Customer, Lesson, Instructor; `depositPaid`, `balanceRemaining`; status workflow.
- **Rental**: Links Customer; can use `EquipmentVariant` or `EquipmentCategory` (generic).
- **Payment**: Amount, status, provider (MANUAL/STRIPE); links to Booking or Rental.
- **Equipment**: Category → Variant → individual items; status (RENTED, AVAILABLE).
- **DailyAnalytics**: Pre-aggregated by date for analytics dashboard.
- **WeatherCache**: Location-based cache (lat/lng rounded) to reduce Stormglass API usage.

---

## 5. UX Perspective — Design & User Flows

### 5.1 Design System

- **Fonts**: Geist Sans, Geist Mono (Google Fonts).
- **Color**: Light/dark support; dashboard uses slate-900 sidebar, sky-500/600 topbar.
- **Components**: shadcn/ui (Card, Button, Dialog, Tabs, Dropdown, Sheet, etc.).
- **Responsiveness**: Mobile-first; sidebar collapses to Sheet on small screens; touch-friendly targets (min 44px).
- **Accessibility**: Semantic HTML, ARIA where needed, keyboard navigation, color contrast.

### 5.2 Key User Flows

#### A. New School Onboarding
1. User clicks "Start 30-Day Free Trial" on landing.
2. Redirects to Stripe Checkout (plan selection).
3. After payment → redirect to `/onboarding?session_id=...`.
4. Form: business name, owner name, email, password, timezone, currency.
5. POST `/api/onboarding` creates Business, User; signs in; redirects to `/dashboard`.

#### B. Staff Creating a Booking
1. Navigate to Bookings → "New booking".
2. Dialog: select customer (or create), lesson, date/time slot, instructor, participants.
3. Optional: deposit vs full payment.
4. Submit → Booking created; optionally open Stripe Checkout for payment.

#### C. Customer Booking Online
1. Visit `yoursite.com/book/my-surf-school` (or embed).
2. Choose lesson or rental; select date; scroll hour/minute pickers for time.
3. Enter name, email, phone; optional board/wetsuit add-ons.
4. Choose "Pay full" or "Pay deposit" (Pro).
5. Redirect to Stripe Checkout; return to confirmation page.

#### D. Beach POS Flow
1. Staff opens `/beach` on tablet.
2. **Check-in**: View today's bookings; tap "Check in" to mark BOOKED → CHECKED_IN.
3. **Return**: View active rentals; tap "Return" to complete.
4. **Quick rental**: Select customer, category/variant, quantity; create rental; optionally pay.

#### E. Analytics Review
1. Navigate to Analytics (Premium).
2. Overview cards: revenue, bookings, utilization, new/returning students.
3. Charts: revenue by day, bookings, revenue donut (lessons vs rentals).
4. Student metrics; operations (instructor labor, equipment utilization).
5. Alerts panel for anomalies (e.g. low utilization).

### 5.3 UX Principles Applied

- **Progressive disclosure**: Tabs in Settings; expandable sections where appropriate.
- **Feedback**: Success banners after payment; loading spinners; error messages in forms.
- **Consistency**: Same card/dialog patterns across modules; sidebar always present in dashboard.
- **Efficiency**: Bulk actions on bookings; quick rental on beach; CSV export for offline analysis.

---

## 6. Benefits of Using TideDesk

### 6.1 For Surf School Operators

| Benefit | How TideDesk Delivers |
|---------|------------------------|
| **Single source of truth** | All bookings, rentals, customers, and revenue in one place |
| **Weather-informed decisions** | Marine forecast (wind, swell, tide) reduces no-shows and cancellations |
| **Equipment visibility** | Know what’s out, what’s due, and utilization for planning |
| **Online bookings** | Customers can book and pay 24/7; reduces phone/email load |
| **Deposit payments** | Secure commitment without full upfront payment |
| **Revenue clarity** | Daily/weekly/monthly charts; lessons vs rentals breakdown |

### 6.2 For Staff

| Benefit | How TideDesk Delivers |
|---------|------------------------|
| **Fast check-in/return** | Beach mode for tablet use at the beach |
| **Customer lookup** | CRM with search, filter, and notes |
| **Lesson management** | Create, check-in, complete, cancel; bulk actions |
| **Payment flexibility** | Manual methods + Stripe; deposit/balance flows |

### 6.3 For Instructors

| Benefit | How TideDesk Delivers |
|---------|------------------------|
| **Today’s schedule** | See and check-in students for their lessons |
| **Customer context** | View customer details for their bookings |

### 6.4 For Customers

| Benefit | How TideDesk Delivers |
|---------|------------------------|
| **Convenience** | Book and pay online; optional deposit |
| **Confirmation** | Email + SMS reminders (Pro) |
| **Transparency** | Clear lesson details and pricing |

---

## 7. Feature Gating by Plan

| Feature | Starter | Pro | Premium |
|---------|---------|-----|---------|
| CRM & Customers | ✅ | ✅ | ✅ |
| Bookings & Rentals | ✅ | ✅ | ✅ |
| Payments (manual + Stripe) | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Equipment | ✅ | ✅ | ✅ |
| Instructors | ✅ | ✅ | ✅ |
| Revenue charts | ✅ | ✅ | ✅ |
| Weather intelligence | — | ✅ | ✅ |
| SMS notifications | — | ✅ | ✅ |
| Booking widget | — | ✅ | ✅ |
| Deposit payments | — | ✅ | ✅ |
| Instructor portal | — | ✅ | ✅ |
| CSV export | — | ✅ | ✅ |
| WindGuru integration | — | — | ✅ |
| Advanced analytics | — | — | ✅ |
| POS beach mode | — | — | ✅ |
| API & webhooks | — | — | ✅ |
| Offline mode | — | — | 🔲 Planned |
| White label | — | — | 🔲 Planned |
| FareHarbor integration | — | — | 🔲 Planned |

---

## 8. Security & Reliability

- **Authentication**: Scrypt password hashing; JWT sessions.
- **Authorization**: Role-based; business-scoped queries.
- **Rate limiting**: Upstash Redis for `/api/public/*`.
- **Stripe**: PCI-compliant; no card data stored.
- **Environment**: Secrets in `.env`; no hardcoded keys.

---

## 9. Deployment & Operations

- **Database**: Neon PostgreSQL (serverless).
- **Hosting**: Vercel-compatible (Next.js).
- **Cron**: `/api/cron/weather`, `/api/cron/analytics`, `/api/cron/notifications`, `/api/cron/trial-reminders` for scheduled tasks.
- **Webhooks**: Stripe webhooks for payments; TideDesk webhooks for `booking.created`, `payment.succeeded`.

---

## 10. Document Revision

| Date | Change |
|------|--------|
| 2026-03-16 | Initial full statement documentation |

---

*This document describes TideDesk as of the stated revision date. For implementation details, see the codebase; for product roadmap, see `IMPLEMENTATION_TRACKER.md`.*
