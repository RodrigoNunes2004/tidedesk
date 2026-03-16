"use client";

import type { UserRole } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useDashboardContext } from "@/lib/dashboard-context";
import { hasFeature } from "@/lib/tiers";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBag,
  Sun,
  User,
  Users,
  UserCircle,
  Waves,
} from "lucide-react";

const fullNav: { href: string; label: string; icon: typeof LayoutDashboard; roles: UserRole[]; feature?: string }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "STAFF", "INSTRUCTOR"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["OWNER", "STAFF", "INSTRUCTOR"] },
  { href: "/rentals", label: "Rentals", icon: ShoppingBag, roles: ["OWNER", "STAFF"] },
  { href: "/beach", label: "Beach", icon: Sun, roles: ["OWNER", "STAFF"], feature: "pos" },
  { href: "/bookings", label: "Bookings", icon: CalendarDays, roles: ["OWNER", "STAFF", "INSTRUCTOR"] },
  { href: "/equipment", label: "Equipment", icon: Waves, roles: ["OWNER", "STAFF"] },
  { href: "/instructors", label: "Instructors", icon: UserCircle, roles: ["OWNER", "STAFF"] },
  { href: "/revenue", label: "Revenue", icon: Receipt, roles: ["OWNER", "STAFF"] },
  { href: "/analytics", label: "Analytics", icon: BarChart3, roles: ["OWNER", "STAFF"], feature: "analytics" },
];

export function DashboardSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const ctx = useDashboardContext();

  return (
    <aside className="flex h-full w-full min-w-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-200 md:w-64">
      <div className="flex items-center justify-between gap-2 px-4 py-4 min-w-0">
        <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2">
          <Image
            src="/TD_logo.png"
            alt="TideDesk"
            width={48}
            height={48}
            className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
          />
          <span className="truncate font-semibold tracking-tight">TideDesk</span>
        </Link>
        <Badge variant="secondary" className="shrink-0 text-xs bg-slate-800 text-slate-300">
          Internal
        </Badge>
      </div>
      <Separator className="bg-slate-700" />
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {fullNav
          .filter((item) => item.roles.includes(role))
          .filter((item) => !item.feature || hasFeature(ctx?.tier ?? "", item.feature))
          .map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => ctx?.closeSidebar()}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors group",
                active
                  ? "bg-sky-500 text-white"
                  : "hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0 group-hover:text-sky-400" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Separator className="bg-slate-700" />
      <div className="p-2 space-y-1">
        <Link
          href="/account"
          onClick={() => ctx?.closeSidebar()}
          className={cn(
            "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors group",
            pathname?.startsWith("/account")
              ? "bg-sky-500 text-white"
              : "hover:bg-slate-800 hover:text-white",
          )}
        >
          <User className="size-4 shrink-0 group-hover:text-sky-400" />
          Account
        </Link>
        {role !== "INSTRUCTOR" && (
          <Link
            href="/settings"
            onClick={() => ctx?.closeSidebar()}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors group",
              pathname?.startsWith("/settings")
                ? "bg-sky-500 text-white"
                : "hover:bg-slate-800 hover:text-white",
            )}
          >
            <Settings className="size-4 shrink-0 group-hover:text-sky-400" />
            Settings
          </Link>
        )}
      </div>
    </aside>
  );
}

