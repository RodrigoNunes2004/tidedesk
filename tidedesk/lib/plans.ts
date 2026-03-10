import { TIERS } from "./tiers";

export const PLANS = [
  {
    plan: TIERS.STARTER,
    name: "Starter",
    price: 69,
    description: "Core operations for surf schools getting started",
    features: [
      "CRM & customers",
      "Bookings & rentals",
      "Payments",
      "Dashboard",
      "Equipment tracking",
      "Instructor management",
      "Revenue charts",
    ],
  },
  {
    plan: TIERS.PRO,
    name: "Pro",
    price: 129,
    description: "Weather, notifications, booking widget & more",
    features: [
      "Everything in Starter",
      "Weather intelligence",
      "SMS notifications",
      "Booking widget (embeddable)",
      "Deposit payments",
      "Instructor portal",
      "CSV export",
    ],
    popular: true,
  },
  {
    plan: TIERS.PREMIUM,
    name: "Premium",
    price: 199,
    description: "Enterprise features for advanced use",
    features: [
      "Everything in Pro",
      "WindGuru integration",
      "Offline mode (planned)",
      "Advanced analytics",
      "POS beach mode (planned)",
      "API access (planned)",
      "White label (planned)",
      "Integrations",
    ],
  },
];
