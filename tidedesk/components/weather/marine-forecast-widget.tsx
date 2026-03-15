"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Waves, Loader2 } from "lucide-react";
import { TidePanel, type TideExtreme } from "./tide-panel";
import { OceanStatusBar } from "@/components/ocean/OceanStatusBar";
import { SevenDayForecast } from "./SevenDayForecast";
import type { ForecastDay } from "@/lib/weather/aggregateSevenDay";

type ForecastPoint = {
  timestamp: string;
  windSpeed: number;
  swellHeight: number;
  tideLevel: number | null;
};

type OceanStatus = {
  weather: { icon: string; label: string };
  swell: number;
  windSpeed: number;
  windDirection: string;
  temperature: number;
  tideStatus: string | null;
  moon: { icon: string; label: string };
};

export function MarineForecastWidget({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const [windguruSpotId, setWindguruSpotId] = useState<string | null>(null);
  const [tides, setTides] = useState<TideExtreme[]>([]);
  const [timezone, setTimezone] = useState<string>("Pacific/Auckland");
  const [oceanStatus, setOceanStatus] = useState<OceanStatus | null>(null);
  const [sevenDayForecast, setSevenDayForecast] = useState<ForecastDay[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    fetch("/api/weather/forecast")
      .then((r) => r.json())
      .then((json: {
        data?: ForecastPoint[];
        message?: string;
        error?: string;
        windguruSpotId?: string | null;
        tides?: TideExtreme[];
        timezone?: string;
        oceanStatus?: OceanStatus | null;
        sevenDayForecast?: ForecastDay[];
        quotaExceeded?: boolean;
      }) => {
        if (json.error) {
          setMessage(json.error);
          return;
        }
        if (json.message && (!json.data || json.data.length === 0)) {
          setMessage(json.message);
          return;
        }
        setData(json.data ?? []);
        setWindguruSpotId(json.windguruSpotId ?? null);
        setTides(json.tides ?? []);
        setTimezone(json.timezone ?? "Pacific/Auckland");
        setOceanStatus(json.oceanStatus ?? null);
        setSevenDayForecast(json.sevenDayForecast ?? []);
        setQuotaExceeded(json.quotaExceeded ?? false);
      })
      .catch(() => setMessage("Failed to load forecast"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-6">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading forecast…</span>
        </CardContent>
      </Card>
    );
  }

  if (message) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            No forecast data available. Check Stormglass API key and coordinates in Settings → Business.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show first 12 hours in compact view, or all 24
  const toShow = compact ? data.slice(0, 12) : data.slice(0, 24);
  const now = new Date();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wind className="size-4 text-primary" />
          Surf conditions
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Wind (kt) · Swell (m) — next {toShow.length}h
        </p>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {quotaExceeded && (
          <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 mb-4">
            Stormglass API daily quota exceeded. Ocean status, tides, and 7-day forecast will show again when the quota resets (daily). Hourly data above may be from cache.
          </div>
        )}
        {oceanStatus && (
          <OceanStatusBar
            weather={oceanStatus.weather}
            swell={oceanStatus.swell}
            windSpeed={oceanStatus.windSpeed}
            windDirection={oceanStatus.windDirection}
            temperature={oceanStatus.temperature}
            tideStatus={oceanStatus.tideStatus}
            moon={oceanStatus.moon}
          />
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1">
          {toShow.map((point) => {
            const d = new Date(point.timestamp);
            const isToday = d.toDateString() === now.toDateString();
            const isPast = d < now;
            return (
              <div
                key={point.timestamp}
                className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 min-w-[72px] ${
                  isPast
                    ? "border-transparent bg-muted/50 opacity-60"
                    : "border-border bg-card"
                }`}
              >
                <span className="text-xs font-medium text-muted-foreground">
                  {isToday
                    ? d.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : d.toLocaleDateString(undefined, {
                        weekday: "short",
                        hour: "2-digit",
                      })}
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <Wind className="size-3.5 text-primary" />
                  <span className="text-sm font-semibold">
                    {point.windSpeed.toFixed(0)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Waves className="size-3.5 text-primary" />
                  <span className="text-sm font-semibold">
                    {point.swellHeight.toFixed(1)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            Data from Stormglass. Wind in knots, swell in metres.
          </p>
          {windguruSpotId && (
            <a
              href={`https://www.windguru.cz/${windguruSpotId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              View on WindGuru →
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mt-4 min-w-0">
          <div className="min-w-0">
            <TidePanel tides={tides} timezone={timezone} />
          </div>
          <div className="min-w-0">
            <SevenDayForecast forecast={sevenDayForecast} timezone={timezone} />
          </div>
        </div>
        {windguruSpotId && (
          <div className="mt-4 overflow-x-auto">
            <p className="text-xs text-muted-foreground mb-2">WindGuru forecast</p>
            <div className="rounded-lg border overflow-x-auto bg-muted/30 min-w-0">
              <iframe
                title="WindGuru forecast"
                src={`https://www.windguru.cz/widget-fcst-iframe.php?s=${encodeURIComponent(windguruSpotId)}&p=WINDSPD,GUST,MWINDSPD,SMER,TMP,FLHGT,RATING&wj=knots&tj=c&fhours=168&m=3&vt=forecasts&odh=0&doh=24`}
                className="w-full border-0"
                style={{ height: "280px", minHeight: "200px" }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
