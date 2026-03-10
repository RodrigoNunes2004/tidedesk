# TideDesk Pricing Strategy

**Version:** 1.0  
**Purpose:** Single source of truth for plan tiers and feature organization.

---

## Plan Tiers

| Plan | Price | Target |
|------|-------|--------|
| **Starter** | $69 NZD/month | New surf schools, basics only |
| **Pro** | $129 NZD/month | Growing schools needing intelligence & outreach |
| **Premium** | $199 NZD/month | Multi-location, high-volume, white-label |

---

## Starter — $69

Core operations for surf schools getting started.

| Feature | Description | Status |
|---------|-------------|--------|
| **CRM** | Customers, search, filter, archive, notes | ✅ Implemented |
| **Bookings** | Create, check-in, complete, cancel, no-show, bulk actions | ✅ Implemented |
| **Rentals** | Create, return, cancel, equipment allocation | ✅ Implemented |
| **Payments** | Manual (cash, EFTPOS, card, transfer), Stripe Connect for card | ✅ Implemented |
| **Dashboard** | Today's metrics, customers, rentals, bookings, revenue, equipment out | ✅ Implemented |

---

## Pro — $129

Adds weather, notifications, booking widget, deposits, and instructor portal.

| Feature | Description | Status |
|---------|-------------|--------|
| **Weather intelligence** | Stormglass API, marine forecast, WEATHER_ALERT cron (unsafe conditions) | ✅ Implemented |
| **SMS notifications** | Twilio: booking confirmation, 24h reminders | ✅ Implemented |
| **Booking widget** | Public `/book/[slug]`, embeddable (?embed=1) | ✅ Implemented |
| **Deposit payments** | Pay deposit now, remainder later | 🔲 Planned |
| **Instructor portal** | Restricted UI for INSTRUCTOR role (dashboard, customers read-only, bookings, account) | ✅ Implemented |

---

## Premium — $199

Enterprise features for advanced use cases.

| Feature | Description | Status |
|---------|-------------|--------|
| **WindGuru integration** | Sync forecasts and conditions from WindGuru | 🔲 Planned |
| **Offline mode** | PWA, service worker, work offline | 🔲 Planned |
| **Advanced analytics** | Custom date ranges, cohort reports, export raw data | 🔲 Partial (export CSV exists) |
| **POS beach mode** | Optimized UI for tablets, quick check-in/return on beach | 🔲 Planned |
| **API access** | Public API for external integrations, webhooks | 🔲 Planned |
| **White label** | Custom domain, remove TideDesk branding | 🔲 Planned |

---

## Implementation Notes

### Trial: full access

- **30-day free trial** – All features (Premium-level) accessible during trial
- `getBusinessTier` returns Premium when `trialEndsAt > now`
- **Trial end alert** – In-app banner (7 days before + after end) + email via cron `/api/cron/trial-reminders` (daily 09:00 UTC)
- Banner links to Settings → Billing to choose plan

### Upgrade / downgrade

- **Pricing page** – 3 plans with "Start trial" each; checkout accepts `plan` body param
- **Stripe checkout** – Uses `STRIPE_PRICE_ID_STARTER/PRO/PREMIUM`; subscription metadata stores `plan`
- **Onboarding** – Reads plan from Stripe subscription metadata or price ID
- **Webhook** – `customer.subscription.updated` syncs plan; `customer.subscription.deleted` marks canceled
- **Billing portal** – Stripe Customer Portal; enable "Customers can switch plans" in Dashboard → Settings → Billing
- Feature filters apply immediately after plan change (tier from `Subscription.plan`)

### Subscription model (Prisma)

```prisma
model Subscription {
  plan         String    @default("starter")  // "starter" | "pro" | "premium"
  trialEndsAt  DateTime?                     // null = no trial or trial ended
  ...
}
```

### Feature gating

- During trial: full access (Premium)
- After trial: filters by `Subscription.plan`
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for `lib/tiers/`, `requireFeature`, `FeatureGate`

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-09 | Initial pricing strategy document |
