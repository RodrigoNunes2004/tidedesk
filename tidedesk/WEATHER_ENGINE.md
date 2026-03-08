# Weather Engine – Implementation Summary

**Date:** March 8, 2026  
**Status:** Complete

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
