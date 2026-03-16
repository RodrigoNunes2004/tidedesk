# Weather Engine – Implementation Summary

**Date:** March 8, 2026  
**Status:** Complete

---

## Scalable Architecture (March 2026)

**Users never trigger Stormglass.** All API calls happen in a scheduled cron job.

```
Stormglass API → Cron (hourly) → WeatherCache (DB) → Dashboard / Beach / Bookings
```

- **WeatherCache** – Location-based cache (rounded lat/lng ~11m). Nearby schools share one entry.
- **Cron** – Runs hourly (`0 * * * *`). Refreshes cache for all unique locations, then sends WEATHER_ALERT if needed.
- **Forecast API** – Reads from `getWeatherFromCache()` only. No Stormglass calls on page load.

**API usage:** `N locations × 24 refresh/day` instead of `N schools × users × page loads`. With 30 spots and 150 schools: **~720 calls/day** vs **7500+**.

---

## What Was Built

### 1. WeatherSnapshot model (Prisma)

- **Fields:** `windSpeed`, `swellHeight`, `tideLevel`, `timestamp`, plus `businessId`, `latitude`, `longitude`
- **Purpose:** Caches marine weather from Stormglass; 1-hour TTL to reduce API usage
- **Indexes:** Unique on `(businessId, latitude, longitude, timestamp)` to avoid duplicates

### 2. Business coordinates

- **Fields:** `latitude`, `longitude` (optional) on `Business`
- **Purpose:** Each business defines its beach/location for weather forecasts
- **UI:** Settings → Business → Latitude / Longitude (weather) inputs

### 3. Stormglass API integration

- **File:** `integrations/stormglass.ts`
- **Endpoints:** `/v2/marine/point` (wind, swell), `/v2/tide/sea-level/point` (tide)
- **Returns:** `WeatherPoint[]` with `timestamp`, `windSpeed`, `swellHeight`, `tideLevel`

### 4. Weather service with cache

- **File:** `modules/weather/weatherService.ts`
- **`getCachedOrFetchWeather(businessId, lat, lng, hours?)`**
  - Uses cache if recent data exists (1-hour TTL)
  - Otherwise fetches from Stormglass, stores in `WeatherSnapshot`, and returns
- **`buildWeatherAlertMessage(point, businessName?)`** – human-readable alert when conditions are bad

### 5. WEATHER_ALERT notifications

- **File:** `jobs/weatherJob.ts`
- **Trigger:** Cron every 6 hours (`0 */6 * * *`) at `/api/cron/weather`
- **Logic:**
  - Loads businesses with `latitude` and `longitude`
  - Fetches/caches 24h forecast
  - If `windSpeed >= 25kt` or `swellHeight >= 2m` → sends WEATHER_ALERT via SMS (or EMAIL when implemented)
  - Recipient: business `phone` or `contactEmail`
  - Dedupes by hour to avoid duplicate alerts

### 6. Vercel Cron

- **Path:** `/api/cron/weather`
- **Schedule:** Every 6 hours (to stay within Stormglass free tier: 10 req/day)

---

## What You Need to Do

### 1. Add `STORMGLASS_API_KEY`

1. Sign up at [Stormglass](https://stormglass.io/).
2. Copy your API key from the dashboard.
3. Add to `.env`:

   ```
   STORMGLASS_API_KEY="your-key-here"
   ```

4. In Vercel: Project → Settings → Environment Variables → add `STORMGLASS_API_KEY` for Production/Preview.

### 2. Set your business coordinates

1. Go to **Settings → Business**.
2. Enter **Latitude** and **Longitude** for your main beach/location.
   - Example (Mount Maunganui): Lat `-37.639`, Lng `176.185`
3. Click **Save changes**.

### 3. (Optional) Test the weather cron

- Locally: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/weather`
- Vercel Cron will call this every 6 hours once deployed.

---

## Weather & WindGuru Flow (testing guide)

### End-to-end data flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 1. CONFIGURATION (Settings → Business)                                            │
│    • Latitude, Longitude → used for Stormglass API location                        │
│    • WindGuru spot ID (optional) → used only for "View on WindGuru" link           │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 2. TIER CHECK                                                                     │
│    • Marine forecast requires Premium (or active 30-day free trial)                │
│    • If Starter/Pro: widget hidden, API returns 403                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 3. MARINE FORECAST WIDGET (Dashboard, Bookings, Beach)                            │
│    • Calls GET /api/weather/forecast (client-side)                                │
│    • API: getBusinessTier → hasFeature(windguru) → business lat/lng                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 4. WEATHER SERVICE                                                                │
│    • getCachedOrFetchWeather(businessId, lat, lng, 24)                            │
│    • If cache fresh (< 1h): return WeatherSnapshot rows                           │
│    • Else: fetchWeatherForecast() → Stormglass API → upsert cache → return        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 5. STORMGLASS API                                                                 │
│    • /v2/marine/point (wind, swell) + /v2/tide/sea-level/point (tide)              │
│    • Returns hourly points for next 24h                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ 6. UI DISPLAY                                                                     │
│    • Hourly cards: wind (kt), swell (m), tide (when available)                    │
│    • If windguruSpotId set: "View on WindGuru →" link to windguru.cz/{spotId}      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Note:** We do **not** call WindGuru’s API. Forecast data comes from Stormglass. WindGuru spot ID is only used to build a direct link to the matching spot on windguru.cz.

---

### How to test the flow

| Step | What to do |
|------|------------|
| 1. Prerequisites | Ensure `STORMGLASS_API_KEY` is in `.env` (and Vercel env in production). |
| 2. Premium/Trial | Business must be Premium or on 30-day trial. Check `subscription` table or start a trial. |
| 3. Coordinates | Settings → Business → set Latitude (`-37.639`) and Longitude (`176.185`) for Mount Maunganui, Save. |
| 4. WindGuru link (optional) | Settings → Business → WindGuru spot ID: `53` (Mount Maunganui). Save. |
| 5. View widget | Go to Dashboard, Bookings, or Beach page. The "Surf conditions" card should appear. |
| 6. Inspect API | While logged in, open DevTools → Network. Filter for `forecast`. You should see `GET /api/weather/forecast` returning `{ data: [...], windguruSpotId: "53" }`. |
| 7. Test cron (optional) | `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/weather` |

### Expected responses

- **403** – `"WindGuru / marine forecast requires Premium"` – business is Starter/Pro and not trialing.
- **Empty data + message** – `"Set latitude and longitude in Settings → Business to see forecast"` – coordinates missing.
- **200 + data** – Array of hourly `{ timestamp, windSpeed, swellHeight, tideLevel }` plus optional `windguruSpotId`.

### Where the widget appears

- **Dashboard** (`/dashboard`)
- **Bookings** (`/bookings`)
- **Beach** (`/beach`) – requires `pos` feature (Premium) and `windguru` feature

---

## Testing Weather & WindGuru (Flow & Test Steps)

### Flow overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  1. User visits Dashboard / Bookings / Beach                                │
│     (must have Premium or active trial for windguru feature)                 │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  2. MarineForecastWidget mounts → GET /api/weather/forecast                  │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  3. API checks: authenticated? Premium/trial? business lat/lng set?         │
│     • 401 if not logged in                                                   │
│     • 403 if not Premium (or trial)                                          │
│     • { data: [], message } if lat/lng missing                               │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  4. getCachedOrFetchWeather(businessId, lat, lng)                           │
│     • Uses WeatherSnapshot cache if recent (1h TTL)                          │
│     • Otherwise calls Stormglass (marine + tide) → saves to cache            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  5. Response: { data: [...], windguruSpotId }                                 │
│     • data: hourly wind (kt), swell (m), tide for 24h                        │
│     • windguruSpotId: from Business (optional) for "View on WindGuru" link    │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  6. Widget shows: hourly cards (wind, swell) + "View on WindGuru →" link     │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** TideDesk uses **Stormglass** for forecast data (wind, swell, tide). WindGuru is not called as an API. The `windguruSpotId` is only used to add a link to windguru.cz so users can open that spot there.

---

### Prerequisites

| Requirement | Where | Notes |
|-------------|-------|-------|
| `STORMGLASS_API_KEY` | `.env` or Vercel env vars | Get from [stormglass.io](https://stormglass.io/) |
| Premium tier or active trial | Subscription | During 30-day trial, business gets Premium |
| Latitude & longitude | Settings → Business | e.g. Mount Maunganui: `-37.639`, `176.185` |
| WindGuru spot ID (optional) | Settings → Business | Find on windguru.cz (e.g. `/53` → `53`) |

---

### Test steps

#### 1. Configure env & business

1. Add `STORMGLASS_API_KEY` to `.env` (or Vercel).
2. Log in and go to **Settings → Business**.
3. Set **Latitude** and **Longitude** (e.g. Mount Maunganui: `-37.639`, `176.185`).
4. Optionally set **WindGuru spot ID** (e.g. `53` for Mount Maunganui).

#### 2. Ensure Premium/trial access

- **New business:** Has 30-day trial → Premium → windguru enabled.
- **Existing business:** Needs Premium subscription, or seed a trial in `Subscription`:

  ```sql
  -- In prisma studio or raw SQL, ensure subscription exists with trial
  UPDATE "Subscription" SET "trialEndsAt" = NOW() + INTERVAL '30 days' WHERE "businessId" = 'your-business-id';
  ```

#### 3. Test the widget in the UI

1. Go to **Dashboard** — the "Surf conditions" card appears at the top (Premium).
2. Go to **Bookings** — same widget in the sidebar/tab area.
3. Go to **Beach** (requires POS) — same widget when you have Premium.

If you see "Loading forecast…" then "Set latitude and longitude in Settings → Business to see forecast", lat/lng are missing.

#### 4. Test the API directly

```bash
# While logged in (or use a session cookie), call:
curl -b "next-auth.session-token=YOUR_SESSION" http://localhost:3000/api/weather/forecast
```

Expected when everything is configured:

```json
{
  "data": [
    { "timestamp": "2026-03-11T...", "windSpeed": 12, "swellHeight": 1.2, "tideLevel": 0.8 },
    ...
  ],
  "windguruSpotId": "53"
}
```

#### 5. Test the weather cron (WEATHER_ALERT)

```bash
# If CRON_SECRET is set:
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/weather
```

Response:

```json
{ "businesses": 1, "alertsSent": 0 }
```

Alerts are sent only when `windSpeed >= 25kt` or `swellHeight >= 2m`. To test alerts, you’d need to mock those values or wait for real conditions.

---

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "WindGuru / marine forecast requires Premium" | Business not Premium or trial | Check subscription / trialEndsAt |
| "Set latitude and longitude in Settings…" | Business lat/lng null | Add lat/lng in Settings → Business |
| "Failed to load forecast" | Network or Stormglass error | Check STORMGLASS_API_KEY and Stormglass status |
| Empty `data` array | Stormglass returns no data or API key invalid | Verify key and coordinates |

---

## Next Features (recap)

| Feature                     | Status   | Notes                                                                 |
|----------------------------|----------|-----------------------------------------------------------------------|
| **Weather Engine**         | Done     | Stormglass, cache, WEATHER_ALERT                                      |
| **Email notifications**    | Pending  | Resend or SendGrid for booking confirmation/reminders               |
| **Online booking settings**| Pending  | Enable/disable per business, custom messages, business hours         |
| **Sprint 1 audit**        | Complete | Race conditions, validation, confirmation fixes applied               |

---

## Stormglass limits

- **Free tier:** 10 requests/day – use sparingly; 6-hour cron keeps usage low
- **Paid:** €19/month for 500 req/day if you need more
