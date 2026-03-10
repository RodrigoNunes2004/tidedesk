# TideDesk Architecture

## Tier-Based Feature Architecture

Features are organized by pricing tier (Starter, Pro, Premium) and gated via a central tier subsystem.

### Structure

```
lib/tiers/                    # Tier subsystem
├── index.ts                  # TIERS, FEATURE_TIERS, hasFeature()
├── get-business-tier.ts      # Resolve tier from Subscription
├── require-feature.ts        # API route guard (returns 403 if gated)
├── feature-gate.tsx         # UI component (hides/shows based on tier)
└── README.md

features/                     # Logical feature packages
├── starter/index.ts          # Starter features ($69)
├── pro/index.ts             # Pro features ($129)
├── premium/index.ts         # Premium features ($199)
└── index.ts                 # Barrel export
```

### Feature-to-Tier Mapping

| Tier | Features |
|------|----------|
| **Starter** | crm, bookings, rentals, payments, dashboard, equipment, instructors, revenue |
| **Pro** | weather, sms, booking-widget, deposits, instructor-portal, export |
| **Premium** | offline, analytics, pos, api, white-label, integrations |

See `lib/tiers/index.ts` (`FEATURE_TIERS`) for the canonical mapping.

### Usage

**API routes** – gate Pro/Premium features:

```ts
import { requireFeature } from "@/lib/tiers/require-feature";

const gated = await requireFeature(req, businessId, "export");
if (gated) return gated;
```

**UI** – wrap gated components (tier from `DashboardContext`):

```tsx
import { FeatureGate } from "@/lib/tiers/feature-gate";

<FeatureGate feature="export">
  <ExportButton type="customers" />
</FeatureGate>
```

**Server** – resolve tier:

```ts
import { getBusinessTier } from "@/lib/tiers/get-business-tier";

const tier = await getBusinessTier(businessId);
```

### Data Flow

- `Subscription.plan` stores `"starter" | "pro" | "premium"`
- Dashboard layout fetches tier via `getBusinessTier(businessId)` and passes to `DashboardShell`
- `DashboardProvider` exposes `tier` in context for `FeatureGate`
- APIs use `requireFeature(req, businessId, feature)` before gated logic

### Adding a New Gated Feature

1. Add the feature key to `FEATURE_TIERS` in `lib/tiers/index.ts`
2. Add metadata to the appropriate `features/*/index.ts` package
3. Wrap UI in `<FeatureGate feature="key">` or call `requireFeature` in the API route
