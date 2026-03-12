"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, LogOut, User } from "lucide-react";

function useMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function DashboardTopbar({ onOpenNav }: { onOpenNav: () => void }) {
  const mounted = useMounted();
  const { data } = useSession();
  const name = data?.user?.name ?? "User";
  const email = data?.user?.email ?? "";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex h-14 min-h-14 shrink-0 items-center justify-between border-b bg-background px-3 sm:px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="min-h-[44px] min-w-[44px] h-10 w-10 shrink-0 md:hidden touch-manipulation"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
        <div className="truncate text-sm font-medium">
          <span className="hidden sm:inline">TideDesk </span>Dashboard
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="min-h-[44px] min-w-[44px] h-10 gap-2 px-2 touch-manipulation">
            <Avatar className="size-8">
              {mounted && data?.user?.image ? (
                <AvatarImage src={data.user.image} alt={name} />
              ) : null}
              <AvatarFallback>{initials || "U"}</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start md:flex">
              <div className="text-sm leading-4">{name}</div>
              {email ? (
                <div className="text-xs text-muted-foreground">{email}</div>
              ) : null}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/account" className="flex cursor-pointer items-center gap-2">
              <User className="size-4" />
              Upload profile photo
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="gap-2"
          >
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

