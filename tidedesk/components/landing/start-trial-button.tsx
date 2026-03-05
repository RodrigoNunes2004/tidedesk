"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function StartTrialButton({
  size,
  className,
}: {
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
        alert(data.error ?? "Failed to start checkout");
      }
    } catch {
      setLoading(false);
      alert("Failed to start checkout");
    }
  }

  return (
    <Button
      type="button"
      size={size}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "Redirecting…" : "Start 30-Day Free Trial"}
    </Button>
  );
}
