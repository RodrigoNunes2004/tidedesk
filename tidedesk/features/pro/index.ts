/**
 * Pro tier feature package ($129)
 * Adds weather, notifications, booking widget, deposits, instructor portal.
 */

import { FEATURES_PRO } from "@/lib/tiers";

export const proFeatures = FEATURES_PRO;

export const PRO_FEATURE_META = {
  weather: { label: "Weather intelligence", description: "Stormglass API, marine forecast, alerts" },
  sms: { label: "SMS notifications", description: "Twilio: confirmation, 24h reminders" },
  "booking-widget": { label: "Booking widget", description: "Public /book/[slug], embeddable" },
  deposits: { label: "Deposit payments", description: "Pay deposit now, remainder later" },
  "instructor-portal": { label: "Instructor portal", description: "Restricted UI for instructors" },
  export: { label: "CSV Export", description: "Export customers, bookings, revenue" },
} as const;
