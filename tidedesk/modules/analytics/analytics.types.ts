/**
 * Analytics module type definitions.
 * All analytics responses are scoped by businessId.
 */

export type AnalyticsRange = 7 | 30 | 90;

export type ChartPoint = {
  label: string;
  amount: number;
  date: string;
};

export type RevenueByLessonPoint = {
  lessonId: string;
  lessonTitle: string;
  count: number;
  revenue: number;
};

export type RevenueByInstructorPoint = {
  instructorId: string;
  instructorName: string;
  lessons: number;
  revenue: number;
};

export type InstructorPerformance = {
  instructorId: string;
  instructorName: string;
  lessonsTaught: number;
  revenueGenerated: number;
  utilizationPercent: number;
};

export type EquipmentUtilization = {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  inUse: number;
  utilizationPercent: number;
};

export type StudentMetrics = {
  newStudents: number;
  returningStudents: number;
  atRiskStudents: number;
  retentionPercent: number;
  atRiskList: AtRiskStudent[];
};

export type AtRiskStudent = {
  customerId: string;
  name: string;
  email: string | null;
  lastSessionAt: Date;
  daysSinceLastSession: number;
};

export type UtilizationHeatmapRow = {
  weekLabel: string;
  mon: number | null;
  tue: number | null;
  wed: number | null;
  thu: number | null;
  fri: number | null;
  sat: number | null;
  sun: number | null;
};

export type UtilizationHeatmap = {
  rows: UtilizationHeatmapRow[];
};

export type AlertType =
  | "LOW_BOOKING"
  | "EQUIPMENT_SHORTAGE"
  | "REVENUE_DROP";

export type AlertSeverity = "low" | "medium" | "high";

export type AnalyticsAlert = {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
};

export type AnalyticsResponse = {
  revenue: {
    byDay: ChartPoint[];
    byLesson: RevenueByLessonPoint[];
    byInstructor: RevenueByInstructorPoint[];
    total: number;
    revenueLessons: number;
    revenueRentals: number;
  };
  bookings: {
    byDay: { label: string; count: number; date: string }[];
    total: number;
    utilizationPercent: number;
  };
  students: StudentMetrics;
  instructors: InstructorPerformance[];
  equipment: EquipmentUtilization[];
  utilizationHeatmap: UtilizationHeatmap;
  alerts: AnalyticsAlert[];
};
