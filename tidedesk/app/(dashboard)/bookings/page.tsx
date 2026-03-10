import Link from "next/link";
import { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/server/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateLessonBookingDialog } from "@/components/bookings/create-lesson-booking-dialog";
import { ExportButton } from "@/components/export/export-button";
import { BookingsTableWithBulkActions } from "@/components/bookings/bookings-table-with-bulk-actions";
import { LessonsTabContent } from "@/components/bookings/lessons-tab-content";

type SearchParams = {
  status?: string;
  payment?: string;
  tab?: string;
};

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  const isInstructor = session.user.role === "INSTRUCTOR";

  const sp = await searchParams;
  const statusRaw = (sp.status ?? "booked").toLowerCase();
  const statusFilter =
    statusRaw === "completed"
      ? [BookingStatus.COMPLETED]
      : statusRaw === "cancelled"
        ? [BookingStatus.CANCELLED]
        : statusRaw === "history"
          ? [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.NO_SHOW]
          : [BookingStatus.BOOKED, BookingStatus.CHECKED_IN];

  const [business, customers, lessons, instructors, categories, variants, bookings] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { chargesEnabled: true, stripeAccountId: true, currency: true, timezone: true },
    }),
    prisma.customer.findMany({
      where: { businessId, archivedAt: null } as never,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
      select: { id: true, firstName: true, lastName: true, phone: true, email: true },
    }),
    prisma.lesson.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, title: true, durationMinutes: true, capacity: true, price: true },
    }),
    prisma.instructor.findMany({
      where: { businessId, isActive: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 100,
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.equipmentCategory.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, totalQuantity: true },
    }),
    prisma.equipmentVariant.findMany({
      where: { businessId },
      orderBy: [{ category: { name: "asc" } }, { label: "asc" }],
      take: 500,
      select: { id: true, label: true, categoryId: true, category: { select: { id: true, name: true } } },
    }),
    prisma.booking.findMany({
      where: { businessId, status: { in: statusFilter } },
      orderBy: { startAt: "desc" },
      take: 50,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        instructor: { select: { firstName: true, lastName: true } },
        lesson: { select: { title: true, durationMinutes: true, price: true } },
        rental: { select: { id: true } },
        payments: {
          where: { provider: "STRIPE", status: "PAID" },
          select: { id: true },
        },
      },
    }),
  ]);

  const now = new Date();

  const paymentSuccess = sp.payment === "success";
  const activeTab = (sp.tab ?? "bookings").toLowerCase();
  const showLessons = activeTab === "lessons";

  const lessonsForClient = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    durationMinutes: l.durationMinutes,
    capacity: l.capacity,
    price: Number(l.price),
  }));

  return (
    <div className="min-w-0 grid gap-4">
      {!isInstructor && (
        <div className="flex min-w-0 gap-1 overflow-x-auto border-b -mx-3 px-3 sm:mx-0 sm:px-0">
          <Link
            href="/bookings"
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors min-h-11 flex items-center ${
              !showLessons
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Bookings
          </Link>
          <Link
            href="/bookings?tab=lessons"
            className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors min-h-11 flex items-center ${
              showLessons
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Lessons
          </Link>
        </div>
      )}

      {showLessons && !isInstructor ? (
        <LessonsTabContent lessons={lessonsForClient} />
      ) : (
        <>
          {paymentSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
              Payment successful. The booking has been marked as paid.
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xl font-semibold tracking-tight">Bookings</div>
              <div className="text-sm text-muted-foreground">
                Lesson bookings share the same engine as rentals (time windows + status).
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isInstructor && <ExportButton type="bookings" />}
              <CreateLessonBookingDialog
                customers={customers}
                lessons={lessonsForClient}
              instructors={instructors}
              categories={categories}
              variants={variants}
              businessTimezone={business?.timezone}
              />
            </div>
          </div>

          <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Recent bookings</CardTitle>
            <div className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">
                {statusRaw === "history"
                  ? "History"
                  : statusRaw === "completed"
                    ? "Completed"
                    : statusRaw === "cancelled"
                      ? "Cancelled"
                      : "Booked"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BookingsTableWithBulkActions
            bookings={bookings}
            business={business}
            now={now}
          />
        </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

