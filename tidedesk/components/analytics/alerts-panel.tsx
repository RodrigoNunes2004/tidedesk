import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { AnalyticsAlert } from "@/modules/analytics";
import { cn } from "@/lib/utils";

type Props = {
  alerts: AnalyticsAlert[];
};

function AlertIcon({ severity }: { severity: string }) {
  if (severity === "high")
    return <AlertTriangle className="size-4 text-destructive shrink-0" />;
  if (severity === "medium")
    return <AlertCircle className="size-4 text-amber-500 shrink-0" />;
  return <Info className="size-4 text-muted-foreground shrink-0" />;
}

export function AlertsPanel({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Alerts</CardTitle>
          <p className="text-sm text-muted-foreground">
            No alerts. Operations look healthy.
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Alerts</CardTitle>
        <p className="text-sm text-muted-foreground">
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""} need attention
        </p>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {alerts.map((a, i) => (
            <li
              key={i}
              className={cn(
                "flex min-h-[44px] items-start gap-3 rounded-lg border p-3",
                a.severity === "high"
                  ? "border-destructive/50 bg-destructive/5"
                  : a.severity === "medium"
                    ? "border-amber-500/50 bg-amber-500/5"
                    : "border-muted bg-muted/30"
              )}
            >
              <AlertIcon severity={a.severity} />
              <span className="text-sm">{a.message}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
