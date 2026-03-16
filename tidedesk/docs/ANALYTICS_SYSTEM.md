# TideDesk Analytics System

**Sprint 13 — Advanced Analytics**

## Overview

The Analytics dashboard provides surf school owners with actionable business insights: revenue performance, booking trends, student retention, instructor performance, equipment utilization, and operational alerts. Analytics are **Premium-tier only** and follow the project's modular architecture.

---

## Metric Definitions

### Revenue

| Metric | Formula | Source |
|--------|---------|--------|
| Revenue by day | Sum of `Payment.amount` where `status=PAID`, grouped by `paidAt` date | `Payment` |
| Revenue by lesson | Sum of paid amounts per `Lesson` | `Payment` + `Booking` |
| Revenue by instructor | Sum of paid amounts per `Instructor` | `Payment` + `Booking` |
| Total revenue | Sum of all paid payments in range | `Payment` |

### Bookings

| Metric | Formula | Source |
|--------|---------|--------|
| Bookings per day | Count of bookings (BOOKED, CHECKED_IN, COMPLETED) per day | `Booking` |
| Capacity utilization | `(booked spots / total capacity) × 100` | `Booking.participants` + `Lesson.capacity` |

**Utilization formula:** `utilization = sum(participants) / sum(lesson.capacity)` across all lessons and bookings in range.

### Students

| Metric | Definition | Source |
|--------|------------|--------|
| New students | Customers with first booking in range | `Booking` + `Customer` |
| Returning students | Customers with first booking before range, at least one booking in range | `Booking` + `Customer` |
| At-risk students | Customers with last booking > 90 days ago | `Booking` + `Customer` |
| Retention % | `returning / (new + returning) × 100` | Derived |

### Instructors

| Metric | Formula | Source |
|--------|---------|--------|
| Lessons taught | Count of bookings assigned to instructor | `Booking` |
| Revenue generated | Sum of paid amounts for instructor's bookings | `Payment` + `Booking` |
| Labor % | `(instructor cost / revenue) × 100` | `Instructor.hourlyRate` + `Lesson.durationMinutes` + payments |

**Healthy range:** 22–30% labor cost of revenue.

### Equipment

| Metric | Formula | Source |
|--------|---------|--------|
| Utilization % | `(in use / total) × 100` per category | `EquipmentVariant` + `getInUseByVariant()` |

**In use** = active rentals + booking allocations overlapping the time window.

---

## Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Low booking | Tomorrow's utilization < 70% | Medium |
| Equipment shortage | Available quantity < low-stock threshold (default 3) | High |
| Revenue drop | This week revenue < 70% of last week | High |

---

## Cron Job

**Path:** `/api/cron/analytics`  
**Schedule:** 02:00 UTC daily (`0 2 * * *`)  
**Auth:** `Authorization: Bearer CRON_SECRET`

### Flow

1. For each business, compute yesterday's metrics:
   - Bookings count
   - Revenue (sum of paid payments)
   - Unique students (customers with bookings)
   - Capacity utilization
2. Upsert into `DailyAnalytics`

### DailyAnalytics Model

```prisma
model DailyAnalytics {
  id         String   @id @default(cuid())
  businessId String
  date       DateTime @db.Date
  bookings   Int
  revenue    Float
  students   Int
  utilization Float
  createdAt  DateTime @default(now())
  @@unique([businessId, date])
}
```

---

## API Usage

### GET /api/analytics

**Auth:** Session required (OWNER/STAFF)  
**Feature gate:** Premium plan

**Query params:**

| Param | Values | Default |
|-------|--------|---------|
| `range` | `7`, `30`, `90` | `30` |

**Response:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "byDay": [...],
      "byLesson": [...],
      "byInstructor": [...],
      "total": 1234.56
    },
    "bookings": {
      "byDay": [...],
      "total": 42,
      "utilizationPercent": 82
    },
    "students": {
      "newStudents": 22,
      "returningStudents": 41,
      "atRiskStudents": 12,
      "retentionPercent": 65
    },
    "instructors": [...],
    "equipment": [...],
    "alerts": [...]
  }
}
```

---

## Architecture

```
app/(dashboard)/analytics/page.tsx   → Page (Premium-gated)
app/api/analytics/route.ts          → API (session + feature gate)
app/api/cron/analytics/route.ts     → Cron endpoint
modules/analytics/
  analytics.service.ts              → Revenue, bookings, students, instructors, equipment
  alerts.service.ts                 → Alert generation
  analytics.types.ts                → Type definitions
jobs/analyticsJob.ts                → Nightly aggregation into DailyAnalytics
components/analytics/               → UI components
```

---

## Performance Rules

- **Live queries** used for current range (7/30/90 days)
- **DailyAnalytics** used by cron for historical caching (future optimization)
- Avoid expensive aggregations in API; use batched queries and indexed filters
- All queries include `businessId` (multi-tenant isolation)
