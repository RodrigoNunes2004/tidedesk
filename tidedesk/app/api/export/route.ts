import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { resolveSession, rejectIfInstructor } from "../_lib/tenant";
import { requireFeature } from "@/lib/tiers/require-feature";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";
import { buildCSV } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const { businessId, role } = await resolveSession(req);
  if (!businessId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const forbidden = rejectIfInstructor(role);
  if (forbidden) return forbidden;

  const gated = await requireFeature(req, businessId, "export");
  if (gated) return gated;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "customers";

  if (type === "customers") {
    const status = searchParams.get("status") ?? "active";
    const archivedWhere =
      status === "archived" ? { archivedAt: { not: null } } : status === "all" ? {} : { archivedAt: null };

    const customers = await prisma.customer.findMany({
      where: { businessId, ...archivedWhere },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        dob: true,
        notes: true,
        archivedAt: true,
        createdAt: true,
      },
    });

    const headers = [
      "First name",
      "Last name",
      "Email",
      "Phone",
      "Date of birth",
      "Notes",
      "Archived",
      "Created",
    ];
    const rows = customers.map((c) => [
      c.firstName,
      c.lastName,
      c.email ?? "",
      c.phone ?? "",
      c.dob ? new Date(c.dob).toISOString().slice(0, 10) : "",
      c.notes ?? "",
      c.archivedAt ? "Yes" : "No",
      new Date(c.createdAt).toISOString(),
    ]);

    const csv = buildCSV(headers, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "bookings") {
    const bookings = await prisma.booking.findMany({
      where: { businessId, lessonId: { not: null } },
      orderBy: { startAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
        instructor: { select: { firstName: true, lastName: true } },
        lesson: { select: { title: true, price: true, durationMinutes: true } },
      },
    });

    const headers = [
      "Date",
      "Start",
      "End",
      "Customer",
      "Email",
      "Phone",
      "Lesson",
      "Instructor",
      "Participants",
      "Status",
      "Created",
    ];
    const rows = bookings.map((b) => [
      b.startAt ? new Date(b.startAt).toISOString().slice(0, 10) : "",
      b.startAt ? new Date(b.startAt).toISOString() : "",
      b.endAt ? new Date(b.endAt).toISOString() : "",
      `${b.customer.firstName} ${b.customer.lastName}`.trim(),
      b.customer.email ?? "",
      b.customer.phone ?? "",
      b.lesson?.title ?? "",
      b.instructor ? `${b.instructor.firstName} ${b.instructor.lastName}`.trim() : "",
      String(b.participants),
      b.status,
      b.createdAt ? new Date(b.createdAt).toISOString() : "",
    ]);

    const csv = buildCSV(headers, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  if (type === "revenue") {
    const payments = await prisma.payment.findMany({
      where: { businessId, status: PaymentStatus.PAID },
      orderBy: { paidAt: "desc" },
      include: {
        booking: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
            lesson: { select: { title: true } },
          },
        },
        rental: {
          include: {
            customer: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    const headers = ["Date", "Amount", "Currency", "Method", "Type", "Customer", "Reference", "Created"];
    const rows = payments.map((p) => {
      const type = p.bookingId ? "Lesson" : p.rentalId ? "Rental" : "Other";
      const customer = p.booking?.customer
        ? `${p.booking.customer.firstName} ${p.booking.customer.lastName}`.trim()
        : p.rental?.customer
          ? `${p.rental.customer.firstName} ${p.rental.customer.lastName}`.trim()
          : "";
      return [
        p.paidAt ? new Date(p.paidAt).toISOString().slice(0, 10) : "",
        Number(p.amount).toFixed(2),
        p.currency,
        p.method,
        type,
        customer,
        p.externalReference ?? "",
        p.createdAt ? new Date(p.createdAt).toISOString() : "",
      ];
    });

    const csv = buildCSV(headers, rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="revenue-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
}
