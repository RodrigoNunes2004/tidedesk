import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InstructorPerformance, EquipmentUtilization } from "@/modules/analytics";

type Props = {
  instructors: InstructorPerformance[];
  equipment: EquipmentUtilization[];
  capacityUtilization: number;
};

export function OperationsMetrics({
  instructors,
  equipment,
  capacityUtilization,
}: Props) {
  const avgLabor =
    instructors.length > 0
      ? Math.round(
          instructors.reduce((s, i) => s + i.utilizationPercent, 0) /
            instructors.length
        )
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Instructor Labor %
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {avgLabor}%
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          Avg cost / revenue · Healthy 22–30%
        </p>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">
          {capacityUtilization}%
        </CardContent>
        <p className="px-6 pb-4 text-xs text-muted-foreground">
          Booked spots / total capacity
        </p>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Equipment Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {equipment.length === 0 ? (
              <p className="text-sm text-muted-foreground">No equipment tracked</p>
            ) : (
              equipment.map((e) => (
                <div
                  key={e.categoryId}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{e.categoryName}</span>
                  <span className="font-semibold">
                    {e.utilizationPercent}% ({e.inUse}/{e.totalQuantity})
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
