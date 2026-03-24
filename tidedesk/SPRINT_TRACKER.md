# TideDesk — Sprint Tracker

**Last updated:** March 24, 2026

_Aligned with [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) (Premium roadmap sprints 10–16)._

---

## ✅ Completed Sprints & Work

### Sprint 1 — Public Booking Page (Audit)
- **Status:** Complete
- **Scope:** Audit of public booking flow (`/book/[slug]`)
- **Delivered:** Race-condition fixes (transaction-scoped overlap/equipment checks), past-date rejection, N+1 fix on slots API, Stripe session validation, empty-lessons/equipment UI messages
- **Doc:** [SPRINT1_AUDIT.md](./SPRINT1_AUDIT.md)

### Sprint 2 — Weather Engine
- **Status:** Complete
- **Scope:** Marine weather for surf schools (wind, swell, tide)
- **Delivered:** Stormglass API, WeatherSnapshot model, weather service with 1h cache, WEATHER_ALERT notifications, cron jobs (daily for Hobby plan)
- **Doc:** [WEATHER_ENGINE.md](./WEATHER_ENGINE.md)

### Sprint 3 — Advanced Analytics (Premium)
- **Status:** Complete
- **Aligns with:** IMPLEMENTATION_TRACKER **Sprint 13**
- **Scope:** Premium analytics dashboard and scheduled rollups
- **Delivered:** `/analytics` (revenue by day/lesson, bookings chart, student metrics, instructor labor %, equipment utilization, smart alerts); `modules/analytics`; DailyAnalytics data + cron; Premium-gated
- **Doc:** [IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md) · changelog 2026-03-16

### Roadmap sprints 10–12 & 14 (Premium) — complete
Cross-reference only; detail lives in IMPLEMENTATION_TRACKER.
- **Sprint 10 — Deposit payments:** Lesson/booking deposit fields, Stripe deposit/full/balance, widget + dashboard pay flows
- **Sprint 11 — API access:** REST `/api/v1/*`, API keys, webhooks (`booking.created`, `payment.succeeded`), settings UI (Premium)
- **Sprint 12 — POS beach mode:** `/beach` tablet UI; check-in, returns, quick rental (Premium)
- **Sprint 14 — WindGuru integration:** Marine forecast widget (Dashboard, Bookings, Beach); optional WindGuru spot in Settings; Premium-gated

### Infrastructure & UX
- **Vercel deployment:** Linked to `tidedesk`; crons set to once daily (Hobby plan limit)
- **Rental cancel fix:** PENDING and ACTIVE rentals can be cancelled
- **Business profile form:** Layout sections, labels (City/Region, lat/lng), validation for coordinates, alignment fixes

---

## 🎯 Next Sprint Candidates

### Option A — Email Notifications ✅ (Done)
- **Delivered:** Resend — confirmation, receipt, 24h reminder (see Quick Reference)

### Option B — Online Booking Settings ✅ (Done)
- **Goal:** Control how public booking behaves per business
- **Scope:** Enable/disable online booking, custom messages, business hours
- **Deps:** DB fields on Business, settings UI

### Option C — Public API & Performance ✅ (Done)
- **Goal:** Harden public booking for production load
- **Scope:** Rate limiting (Upstash, optional), slots API caching (60s), idempotency, timezone clarity
- **Delivered:** Middleware rate limit for /api/public/* (30 req/min per IP when Upstash configured); slots bookings cached 60s via unstable_cache; idempotency keys for booking creation (Upstash, 24h TTL); timezone note on booking form for multi-region clarity

### Option D — Stripe Payments Polish ✅ (Done)
- **Goal:** Finish payment flow for rentals/bookings
- **Scope:** Payment settings form, Connect flow, default payment method
- **Delivered:** Pay buttons show inline errors instead of alert; currency-aware amount formatting (NZD, USD, EUR, GBP, AUD); Payment Settings hint when Stripe not connected; canAcceptPayments now requires payoutsEnabled for public booking

---

## 🚀 Premium roadmap — next up

| Sprint | Scope | Status | Notes |
|--------|--------|--------|--------|
| **15** | White label | Planned | Custom domain, remove TideDesk branding ([IMPLEMENTATION_TRACKER.md](./IMPLEMENTATION_TRACKER.md)) |
| **16** | FareHarbor integration | Planned | External booking sync |

**Premium gaps still open:** Offline mode (PWA) — tracked in IMPLEMENTATION_TRACKER Premium table, not assigned a sprint number there.

---

## Quick Reference

| Area            | Status       | Notes                                            |
|-----------------|-------------|--------------------------------------------------|
| Public booking  | Done + audit | Race fixes, validation, confirmation fixes       |
| Rate limiting   | Done        | Upstash middleware 30/min (optional)             |
| Slots cache     | Done        | 60s cache for bookings queries                   |
| Idempotency     | Done        | Booking creation (Upstash, optional)            |
| Timezone        | Done        | Clear note on booking form                       |
| Weather engine  | Done        | Stormglass, WEATHER_ALERT, daily cron            |
| SMS reminders   | Done        | 24h booking reminder via Twilio (if configured) |
| Email reminders | Done        | Resend, confirmation, receipt, 24h reminder     |
| Vercel deploy   | Done        | Crons: notifications 8am UTC, weather 6am UTC    |
| Business form   | Done        | Sections, validation, lat/lng                   |
| Stripe polish   | Done        | Inline errors, currency formatting, payment hints |
| Advanced analytics | Done   | `/analytics`, DailyAnalytics cron, Premium (Sprint 13) |
| Deposits / API / Beach / WindGuru | Done | IMPLEMENTATION_TRACKER sprints 10–12, 14 |

---

## Suggested Order

1. ~~**Email notifications**~~ — Done (Resend)
2. ~~**Online booking settings**~~ — Done (enable/disable, message, business hours)
3. ~~**Rate limiting + slots optimization**~~ — Done (Upstash middleware, slots cache 60s)
4. ~~**Stripe payments polish**~~ — Done (inline errors, currency, hints, canAcceptPayments)
5. ~~**Upgrade from Settings**~~ — Done (Subscribe to Premium in Billing when no subscription; /api/stripe/checkout/upgrade; webhook links subscription to existing business)
6. ~~**Advanced analytics**~~ — Done (Sprint 13; `/analytics`, DailyAnalytics cron, Premium-gated)
7. **White label** (Sprint 15) or **FareHarbor** (Sprint 16) — see IMPLEMENTATION_TRACKER priority; **Offline PWA** remains Premium backlog
