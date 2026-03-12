"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { StartTrialButton } from "@/components/landing/start-trial-button";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
];

function useMounted() {
  return useSyncExternalStore(() => () => {}, () => true, () => false);
}

export function LandingHeader() {
  const mounted = useMounted();
  const [open, setOpen] = useState(false);
  const [bfcacheKey, setBfcacheKey] = useState(0);

  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) {
        setOpen(false);
        setBfcacheKey((k) => k + 1);
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <header className="relative border-b border-black/5">
      <div className="container mx-auto flex h-16 min-w-0 items-center justify-between gap-2 px-4 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/TD_logo.png"
            alt="TideDesk"
            width={40}
            height={40}
            className="h-10 w-auto shrink-0"
          />
          <span className="font-semibold text-lg">TideDesk</span>
        </Link>

        {/* Desktop nav - hidden below lg to avoid overlap on tablets/small desktops */}
        <nav className="hidden lg:flex items-center gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/login" className="text-sm font-medium">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Sign up
          </Link>
          <StartTrialButton />
        </nav>

        {/* Mobile menu - only render after mount to avoid Radix aria-controls hydration mismatch */}
        {/* key forces remount when restored from bfcache (e.g. back from Stripe) */}
        {mounted && (
        <Sheet key={bfcacheKey} open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden shrink-0 min-h-[44px] min-w-[44px]"
              aria-label="Open menu"
            >
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 pt-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="py-3 px-3 text-base text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/login"
                className="py-3 px-3 text-base font-medium rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="py-3 px-3 text-base text-muted-foreground hover:text-foreground rounded-lg transition-colors hover:bg-muted/50"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>
              <div className="mt-4 pt-4 border-t">
                <StartTrialButton className="w-full" />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        )}
        {/* Placeholder to prevent layout shift before Sheet mounts */}
        {!mounted && (
          <div className="lg:hidden size-11 shrink-0" aria-hidden />
        )}
      </div>
    </header>
  );
}
