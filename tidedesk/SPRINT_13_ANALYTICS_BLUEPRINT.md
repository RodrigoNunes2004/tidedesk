# Sprint 13 — Advanced Analytics Implementation Blueprint

**Purpose:** Concrete implementation guide for the `/analytics` page and analytics features.  
**Principle:** Analytics must drive decisions — every metric answers a question.  
**Tier:** Premium (gated via `analytics` feature).

---

## 1. Sprint 13 Scope (Build Now)

| # | Deliverable | Description |
|---|-------------|-------------|
| 1 | Analytics dashboard | `/analytics` page with overview cards |
| 2 | Revenue charts | Revenue by day, month, lesson (extend existing patterns) |
| 3 | Student retention | New, returning, at-risk students |
| 4 | Instructor performance | Lessons taught, revenue, utilization |
| 5 | Equipment utilization | Boards/wetsuits usage vs total |

---

## 2. Deferred (Phase 2)

- CAC (marketing spend / new customers)
- Predictive analytics / AI forecasting
- Marketing attribution
- Student skill tracking

---

## 3. Page Structure

```
/analytics
├── Overview (cards: revenue, bookings, utilization, new/returning students)
├── Revenue (charts: by day, month, by lesson)
├── Students (new, returning, at-risk)
├── Operations (instructor labor %, equipment utilization, capacity utilization)
└── Alerts (low bookings tomorrow, equipment shortage) — optional for Sprint 13
```

---

## 4. Database Schema

### 4.1 DailyAnalytics (Cached, Nightly Cron)

Prevents slow aggregation queries on page load. Populate via cron.

```prisma
model DailyAnalytics {
  id           String   @id @default(cuid())
  business     Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  businessId   String
  date         DateTime @db.Date

  bookings     Int      @default(0)
  revenue      Decimal  @db.Decimal(10, 2) @default(0)
  students     Int      @default(0)
  newStudents  Int      @default(0)
  utilization  Float    @default(0)

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@unique([businessId, date])
  @@index([businessId, date])
}
```

Add to `Business`:

```prisma
model Business {
  // ...existing
  dailyAnalytics DailyAnalytics[]
}
```

### 4.2 No New Tables for Sprint 13

All other metrics computed live from `Booking`, `Payment`, `Customer`, `Rental`, `Lesson`, `Instructor`, `EquipmentCategory`, `EquipmentVariant`.  
Optional: introduce `DailyAnalytics` if page load becomes slow; start with live queries.

---

## 5. Core Metrics & SQL Logic

### 5.1 Revenue Metrics

| Metric | Source | Query pattern |
|--------|--------|---------------|
| Today/Week/Month revenue | `Payment` | `status: PAID`, `paidAt` in range |
| Revenue by lesson | `Payment` + `Booking` + `Lesson` | Group by `lesson.title` |
| Revenue per lesson (avg) | Above ÷ bookings count | — |

Existing `revenue/page.tsx` already does most of this. Reuse or extract shared logic.

### 5.2 Booking Metrics

| Metric | Source | Query pattern |
|--------|--------|---------------|
| Total bookings (period) | `Booking` | `status` not CANCELLED |
| Capacity utilization | `Booking.participants` vs `Lesson.capacity` | Sum participants / sum (capacity × slots) |
| No-show rate | `Booking` | `status: NO_SHOW` / total |
| Today's utilization | Booked spots / total capacity for today | See `lib/lesson-hours.ts` patterns |

### 5.3 Student Metrics

| Metric | Source | Query pattern |
|--------|--------|---------------|
| New students (period) | `Customer` | `createdAt` in range, has ≥1 booking |
| Returning students | Distinct `customerId` with ≥2 bookings in period | `_count` grouping |
| Retention | returning / (new + returning) | — |
| At-risk students | No booking in 90 days OR missed last 3 | Subquery: last booking date, `status: NO_SHOW` |

**At-risk rule (implementation):**
- Last booking > 90 days ago → at risk
- Alternative: last 3 bookings all NO_SHOW → at risk (simplify to 90-day for Sprint 13)

### 5.4 Instructor Performance

| Metric | Source | Query pattern |
|--------|--------|---------------|
| Lessons taught | `Booking` | Group by `instructorId`, count |
| Revenue generated | `Payment` via `Booking` | Group by `instructorId` |
| Utilization | Booked slots / available slots | Depends on business hours; can defer to Phase 2 |
| Instructor labor % | Instructor pay / revenue | Need `Instructor.hourlyRate` × hours; hours from `Booking` duration |

**Labor % formula:**
```
laborCost = sum(booking.duration × instructor.hourlyRate) for completed bookings
laborPct = (laborCost / revenue) × 100
```

### 5.5 Equipment Utilization

Reuse `lib/equipment-availability.ts` patterns:

- **In-use:** `getInUseByVariant()` for active rentals + booking allocations
- **Total:** `EquipmentVariant.totalQuantity` (or `EquipmentCategory` sum)
- **Utilization:** inUse / total × 100

Per category (e.g. "Boards", "Wetsuits"):

```
boardsInUse = sum(variant inUse for category "Boards")
boardsTotal = sum(variant.totalQuantity for category "Boards")
utilization = boardsInUse / boardsTotal
```

---

## 6. API Design

### Option A: Server Components (Recommended)

Follow `revenue/page.tsx` — fetch data in the page, pass to client chart components. No new API routes for Sprint 13.

### Option B: API Route for Client Fetch

If you need client-side date range switching:

```
GET /api/analytics/overview?from=YYYY-MM-DD&to=YYYY-MM-DD
GET /api/analytics/revenue?from=&to=&groupBy=day|month|lesson
GET /api/analytics/students?from=&to=
GET /api/analytics/instructors?from=&to=
GET /api/analytics/equipment?date=YYYY-MM-DD
```

Response shapes:

```ts
// overview
{ revenue: number; bookings: number; utilization: number; newStudents: number; returningStudents: number; atRisk: number }

// revenue by lesson
{ lessonId: string; lessonTitle: string; revenue: number; bookings: number }[]

// instructors
{ instructorId: string; name: string; lessonsTaught: number; revenue: number; laborCost: number }[]

// equipment
{ categoryId: string; categoryName: string; inUse: number; total: number; utilization: number }[]
```

---

## 7. File Structure

```
tidedesk/
├── app/(dashboard)/analytics/
│   └── page.tsx              # Main analytics page (Premium-gated)
├── components/analytics/
│   ├── analytics-overview-cards.tsx   # Today/period cards
│   ├── analytics-revenue-charts.tsx   # Revenue by day/month/lesson (extend RevenueChart)
│   ├── analytics-students-section.tsx # New, returning, at-risk
│   ├── analytics-instructors-section.tsx
│   ├── analytics-equipment-section.tsx
│   └── analytics-alerts.tsx           # Optional: smart alerts
├── lib/analytics/
│   ├── overview.ts           # computeOverview(businessId, from, to)
│   ├── revenue-by-lesson.ts
│   ├── students.ts          # new, returning, at-risk
│   ├── instructors.ts      # lessons, revenue, labor
│   └── equipment-utilization.ts  # or extend lib/equipment-availability.ts
└── jobs/
    └── analyticsCron.ts     # Optional: populate DailyAnalytics
```

---

## 8. Implementation Order

| Step | Task | Files | Depends |
|------|------|-------|---------|
| 1 | Add `/analytics` nav link (Premium-gated) | `sidebar.tsx` | — |
| 2 | Create `app/(dashboard)/analytics/page.tsx` with FeatureGate | `analytics/page.tsx` | — |
| 3 | `lib/analytics/overview.ts` — revenue, bookings, utilization | `lib/analytics/` | — |
| 4 | `lib/analytics/students.ts` — new, returning, at-risk | `lib/analytics/` | — |
| 5 | `lib/analytics/revenue-by-lesson.ts` | `lib/analytics/` | — |
| 6 | `lib/analytics/instructors.ts` — lessons, revenue, labor % | `lib/analytics/` | — |
| 7 | Equipment utilization (extend `equipment-availability`) | `lib/analytics/` or `equipment-availability.ts` | — |
| 8 | Overview cards component | `components/analytics/` | Steps 3–4 |
| 9 | Revenue charts (reuse `RevenueChart`, add by-lesson) | `components/analytics/` | Step 5 |
| 10 | Students section | `components/analytics/` | Step 4 |
| 11 | Instructors section | `components/analytics/` | Step 6 |
| 12 | Equipment section | `components/analytics/` | Step 7 |
| 13 | (Optional) DailyAnalytics model + cron | `prisma/`, `jobs/` | — |

---

## 9. UI Components (Concrete)

### 9.1 Analytics Overview Cards

```tsx
// Similar to revenue page cards
<Card>
  <CardHeader><CardTitle>Revenue (30 days)</CardTitle></CardHeader>
  <CardContent>{symbol}{revenue}</CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>Bookings</CardTitle></CardHeader>
  <CardContent>{bookings}</CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>Capacity utilization</CardTitle></CardHeader>
  <CardContent>{utilization}%</CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>Students</CardTitle></CardHeader>
  <CardContent>New: {newStudents} · Returning: {returningStudents}</CardContent>
</Card>
<Card>
  <CardHeader><CardTitle>At-risk students</CardTitle></CardHeader>
  <CardContent>{atRisk}</CardContent>
</Card>
```

### 9.2 Revenue by Lesson

Reuse `RevenueChart` pattern with `BarChart`:

```tsx
<BarChart data={revenueByLesson} dataKey="lessonTitle" valueKey="revenue" />
```

### 9.3 Instructor Table

| Instructor | Lessons | Revenue | Labor % |
|------------|---------|---------|---------|
| John | 42 | $3,780 | 24% |
| Jane | 28 | $2,520 | 26% |

### 9.4 Equipment Utilization

| Category | In use | Total | Utilization |
|----------|--------|-------|-------------|
| Boards | 32 | 40 | 80% |
| Wetsuits | 18 | 25 | 72% |

---

## 10. Smart Alerts (Sprint 13 Optional)

If time permits, add an alerts section:

| Alert | Condition | Action hint |
|-------|-----------|-------------|
| Low bookings tomorrow | Utilization < 70% for tomorrow | Send promo |
| Equipment shortage | Available < lowStockThreshold | Restock / delay rentals |
| Revenue down | Revenue down 30% vs same period last week | — |

Implementation: compute conditions in overview, render `analytics-alerts.tsx` with warning badges.

---

## 11. Competitive Differentiators (Build Correctly)

These three make TideDesk strong for surf schools:

1. **Session utilization rate** — booked spots / total capacity
2. **Instructor labor %** — instructor cost / revenue (22–30% healthy)
3. **Equipment utilization** — boards/wetsuits in use vs total

Most booking systems do not track these. Ensure they are accurate and prominent.

---

## 12. Feature Gate

Analytics is Premium. Use existing pattern:

```tsx
<FeatureGate feature="analytics">
  {/* Analytics content */}
</FeatureGate>
```

Nav: add Analytics link to sidebar with `feature: "analytics"` (already in `FEATURE_TIERS`).

---

## 13. Acceptance Criteria

- [ ] `/analytics` page loads for Premium users
- [ ] Overview cards: revenue, bookings, utilization, new/returning students, at-risk
- [ ] Revenue charts: by day, month, by lesson
- [ ] Students: new, returning, at-risk count (90-day rule)
- [ ] Instructors: lessons taught, revenue, labor %
- [ ] Equipment: per-category utilization
- [ ] Non-Premium sees upgrade CTA (or no nav link)
- [ ] Uses business timezone for date ranges
- [ ] Uses business currency for revenue display

---

## 14. References

- `app/(dashboard)/revenue/page.tsx` — aggregation patterns, chart data prep
- `components/revenue/revenue-chart.tsx` — Recharts usage
- `lib/equipment-availability.ts` — equipment in-use logic
- `lib/tiers/index.ts` — `hasFeature`, `FEATURE_TIERS`
- `prisma/schema.prisma` — Booking, Payment, Customer, Lesson, Instructor, Rental, EquipmentVariant
