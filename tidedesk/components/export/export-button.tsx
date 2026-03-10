"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ExportType = "customers" | "bookings" | "revenue";

type Props = {
  type: ExportType;
};

function exportUrl(type: ExportType, status?: string): string {
  const u = new URL("/api/export", typeof window !== "undefined" ? window.location.origin : "");
  u.searchParams.set("type", type);
  if (type === "customers" && status) {
    u.searchParams.set("status", status);
  }
  return u.toString();
}

export function ExportButton({ type }: Props) {
  const href = exportUrl(type);

  if (type === "customers") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "active")} download>
              Active customers
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "archived")} download>
              Archived customers
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={exportUrl("customers", "all")} download>
              All customers
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button variant="outline" size="sm" asChild>
      <a href={href} download>
        <Download className="mr-2 size-4" />
        Export CSV
      </a>
    </Button>
  );
}
