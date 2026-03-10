# Tier Subsystem

Central configuration and gating for TideDesk pricing tiers (Starter, Pro, Premium).

## Usage

**API routes** – gate Pro/Premium features:

```ts
import { resolveSession } from "@/app/api/_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";

const { businessId } = await resolveSession(req);
if (!businessId) return NextResponse.json({ error: "Unauthorized" }, 401);

const gated = await requireFeature(req, businessId, "export");
if (gated) return gated;

// ... proceed with export logic
```

**UI components** – wrap gated features:

```tsx
import { FeatureGate } from "@/lib/tiers/feature-gate";
import { ExportButton } from "@/components/export/export-button";

<FeatureGate feature="export">
  <ExportButton type="customers" />
</FeatureGate>
```

**Server-side** – resolve business tier:

```ts
import { getBusinessTier } from "@/lib/tiers/get-business-tier";

const tier = await getBusinessTier(businessId);
```

## Feature Keys

See `lib/tiers/index.ts` (`FEATURE_TIERS`) and `features/*/index.ts` for the full list.
