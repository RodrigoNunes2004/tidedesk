/**
 * Starter tier feature package ($69)
 * Core operations for surf schools.
 *
 * Features: CRM, bookings, rentals, payments, dashboard, equipment, instructors, revenue
 */

import { FEATURES_STARTER } from "@/lib/tiers";

export const starterFeatures = FEATURES_STARTER;

export const STARTER_FEATURE_META = {
  crm: { label: "CRM", description: "Customers, search, filter, archive, notes" },
  bookings: { label: "Bookings", description: "Create, check-in, complete, cancel" },
  rentals: { label: "Rentals", description: "Create, return, equipment allocation" },
  payments: { label: "Payments", description: "Manual + Stripe Connect for cards" },
  dashboard: { label: "Dashboard", description: "Today's metrics, revenue, equipment" },
  equipment: { label: "Equipment", description: "Categories, variants, availability" },
  instructors: { label: "Instructors", description: "Manage instructors, assign to lessons" },
  revenue: { label: "Revenue", description: "Daily, weekly, monthly revenue charts" },
} as const;
