# TideDesk Implementation Tracker

Track what's done vs planned for each plan tier. Aligns with the three pricing cards (Starter, Pro, Premium).

**Legend:** ✅ Done | 🔶 Partial | 🔲 Planned  
**Effort:** S (1–2 days) | M (3–5 days) | L (1–2 weeks)

---

## Starter — $69 NZD/month

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | CRM & customers | ✅ | — | Search, filter, archive, notes |
| 2 | Bookings & rentals | ✅ | — | Create, check-in, complete, cancel, bulk actions |
| 3 | Payments | ✅ | — | Manual (cash, EFTPOS, card, transfer), Stripe Connect |
| 4 | Dashboard | ✅ | — | Today's metrics, revenue, equipment out |
| 5 | Equipment tracking | ✅ | — | Categories, variants, availability |
| 6 | Instructor management | ✅ | — | CRUD, assign to lessons |
| 7 | Revenue charts | ✅ | — | Daily, weekly, monthly views |

**Starter:** 7/7 done · **Maturity: 100%**

---

## Pro — $129 NZD/month

| # | Feature | Status | Priority | Effort | Notes |
|---|---------|--------|----------|--------|-------|
| 1 | Everything in Starter | ✅ | — | — | Inherited |
| 2 | Weather intelligence | ✅ | — | — | Stormglass API, marine forecast, WEATHER_ALERT cron |
| 3 | SMS notifications | ✅ | — | — | Twilio: confirmation, 24h reminders |
| 4 | Booking widget (embeddable) | ✅ | — | — | `/book/[slug]`, `?embed=1` |
| 5 | Deposit payments | ✅ | — | — | Lesson.depositAmount, Booking.depositPaid/balanceRemaining, Stripe sessions |
| 6 | Instructor portal | ✅ | — | — | Restricted UI for INSTRUCTOR role |
| 7 | CSV export | ✅ | — | — | Customers, bookings, revenue (Pro+ gated) |

**Pro:** 7/7 done · **Maturity: 100%**

**Technical Scope — Deposit payments (done):**
- Schema: `Lesson.depositAmount`, `Booking.depositPaid`, `Booking.balanceRemaining`
- Stripe: Separate Checkout sessions for deposit vs full vs balance
- Dashboard: Pay deposit / Pay full / Pay balance buttons
- Widget: Pay full vs Pay deposit now (rest on arrival) option

---

## Premium — $199 NZD/month

| # | Feature | Status | Priority | Effort | Notes |
|---|---------|--------|----------|--------|-------|
| 1 | Everything in Pro | ✅ | — | — | Inherited |
| 2 | WindGuru integration | 🔲 | Medium | S | WindGuru API; forecast in booking calendar |
| 3 | Offline mode | 🔲 | Medium | L | PWA service worker, work offline |
| 4 | Advanced analytics | 🔶 | Medium | M | Custom ranges, cohort reports, raw export |
| 5 | POS beach mode | 🔲 | High | M | Tablet UI for quick rental, check-in, return |
| 6 | API access | ✅ | High | L | REST API, webhooks; unlocks ecosystem integrations |
| 7 | White label | 🔲 | Low | M | Custom domain, remove TideDesk branding |
| 8 | Integrations (FareHarbor) | 🔲 | Low | L | External booking sync |

**Premium:** 2/8 done, 2 partial, 4 planned · **Maturity: ~35%**

---

## Recommended Sprint Order

Based on impact vs difficulty.

| Sprint | Scope | Status | Priority | Effort | Impact |
|--------|-------|--------|----------|--------|--------|
| ~~10~~ | ~~Deposit payments~~ | ✅ Done | — | — | Higher booking conversions |
| ~~11~~ | ~~API access~~ | ✅ Done | High | L | REST API (`/api/v1/*`), API keys, webhooks; `booking.created`, `payment.succeeded` |
| **12** | POS beach mode | Next | High | M | Tablet UI; huge daily usability for beach operations |
| **13** | Advanced analytics | 🔶 Partial | Medium | M | Revenue by lesson, CLV, repeat rate, instructor performance |
| **14** | WindGuru integration | — | Medium | S | Wind/swell next to calendar; surf condition awareness |
| **15** | White label | — | Low | M | Custom domain, branding; high perceived value |
| **16** | FareHarbor integration | — | Low | L | External booking imports; more bookings for schools |

---

## Product Maturity

| Plan | Status | Notes |
|------|--------|------|
| Starter | 100% | Core SaaS complete |
| Pro | 100% | All features complete |
| Premium | ~25% | Roadmap; launch with Starter + Pro |

**Product insight:** TideDesk's strongest differentiator is the combination of **booking + weather intelligence + equipment tracking**. Most booking platforms don't handle surf school logistics — that's the advantage.

---

## Product Metrics

Track these to measure SaaS growth:

| Metric | Description |
|--------|-------------|
| MRR | Monthly recurring revenue |
| Active schools | Paying businesses |
| Bookings processed | Total bookings across all schools |
| Revenue processed | Total payments through platform |

---

## Completed Sprints

- Starter: Full core (CRM, bookings, rentals, payments, dashboard, equipment, instructors, revenue)
- Pro: Weather, SMS, booking widget, instructor portal, CSV export
- Tier architecture: Trial = full access, gating, upgrade/downgrade, Stripe multi-plan
- Landing & pricing: All 3 plans with checkout
- Deposit payments: Lesson.depositAmount, pay deposit/full/balance via Stripe, Pro-gated
- API access: ApiKey/WebhookEndpoint models, Bearer/X-API-Key auth, v1 bookings/customers/payments, webhook dispatch, settings UI (Premium-gated)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-10 | Initial implementation tracker |
| 2026-03-10 | Added priority, effort, technical scope, sprint order, product metrics, maturity |
| 2026-03-11 | Deposit payments: schema, lesson CRUD, Stripe checkout (deposit/full/balance), booking widget, webhook |
| 2026-03-11 | API access: REST API v1, API keys, webhooks, settings API tab (Premium-gated) |
