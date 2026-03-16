import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  revenue: number;
  revenueLessons: number;
  revenueRentals: number;
  bookings: number;
  utilizationPercent: number;
  newStudents: number;
  returningStudents: number;
  currencySymbol: string;
  range: number;
};

export function AnalyticsOverviewCards({
  revenue,
  revenueLessons,
  revenueRentals,
  bookings,
  utilizationPercent,
  newStudents,
  returningStudents,
  currencySymbol,
  range,
}: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Revenue ({range}d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">
            {currencySymbol}{revenue.toFixed(2)}
          </div>
          {(revenueLessons > 0 || revenueRentals > 0) && (
            <div className="mt-1 text-xs text-muted-foreground">
              Lessons: {currencySymbol}{revenueLessons.toFixed(0)} · Rentals: {currencySymbol}{revenueRentals.toFixed(0)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {bookings}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {utilizationPercent}%
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Students
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          New: {newStudents} · Returning: {returningStudents}
        </CardContent>
      </Card>
    </div>
  );
}
