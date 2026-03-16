import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentMetrics as StudentMetricsType } from "@/modules/analytics";

type Props = StudentMetricsType;

export function StudentMetrics({
  newStudents,
  returningStudents,
  atRiskStudents,
  retentionPercent,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            New Students
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {newStudents}
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          First booking in range
        </p>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Returning Students
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {returningStudents}
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          Had booking before range, booked again
        </p>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Retention
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {retentionPercent}%
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          Returning / (New + Returning)
        </p>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            At-Risk Students
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {atRiskStudents}
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          No booking in 90 days
        </p>
      </Card>
    </div>
  );
}
