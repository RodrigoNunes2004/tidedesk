import type { RentalStatus as PrismaRentalStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/currency";
import { requireSession } from "@/lib/server/session";
import { CreateRentalDialog } from "@/components/rentals/create-rental-dialog";
import { PayRentalButton } from "@/components/rentals/pay-rental-button";
import { CancelRentalButton, ReturnRentalButton } from "@/components/rentals/rental-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type SearchParams = {
  status?: string;
  payment?: string;
};

const RENTAL_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  RETURNED: "RETURNED",
  OVERDUE: "OVERDUE",
  CANCELLED: "CANCELLED",
} as const;

type RentalStatusLike = (typeof RENTAL_STATUS)[keyof typeof RENTAL_STATUS] | string;

function statusBadge(status: RentalStatusLike) {
  if (status === RENTAL_STATUS.RETURNED) return <Badge variant="secondary">Returned</Badge>;
  if (status === RENTAL_STATUS.CANCELLED) return <Badge variant="secondary">Cancelled</Badge>;
  if (status === RENTAL_STATUS.OVERDUE) return <Badge variant="destructive">Overdue</Badge>;
  if (status === RENTAL_STATUS.PENDING) return <Badge variant="outline">Pending payment</Badge>;
  return <Badge>Active</Badge>;
}

type RentalRow = {
  id: string;
  customerId: string;
  equipmentId: string | null;
  equipmentCategoryId: string | null;
  equipmentVariantId: string | null;
  quantity: number;
  startAt: Date;
  endAt: Date;
  status: PrismaRentalStatus;
  priceTotal: number | null;
};

type CustomerMini = { id: string; firstName: string; lastName: string };
type EquipmentMini = { id: string; category: string; size: string | null };
type CategoryMini = { id: string; name: string };
type VariantMini = {
  id: string;
  label: string;
  categoryId: string;
  category: { name: string };
};

type PrismaHack = typeof prisma & {
  rental: { findMany: (args: unknown) => Promise<RentalRow[]> };
  equipmentCategory: { findMany: (args: unknown) => Promise<CategoryMini[]> };
  equipmentVariant: { findMany: (args: unknown) => Promise<VariantMini[]> };
};

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireSession();
  const businessId = session.user.businessId;
  const prismaHack = prisma as unknown as PrismaHack;

  const sp = await searchParams;
  const statusRaw = (sp.status ?? "active").toLowerCase();
  const statusFilter: string[] =
    statusRaw === "returned"
      ? ["RETURNED"]
      : statusRaw === "cancelled"
        ? ["CANCELLED"]
        : statusRaw === "history"
          ? ["RETURNED", "CANCELLED"]
          : ["PENDING", "ACTIVE", "OVERDUE"];

  const customerWhere = { businessId } as Record<string, unknown>;
  customerWhere.archivedAt = null;

  const [business, customers, _equipment, categories, variants, rentals] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: { stripeAccountId: true, chargesEnabled: true, currency: true },
    }),
    prisma.customer.findMany({
      where: customerWhere as never,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      take: 200,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
      },
    }),
    prisma.equipment.findMany({
      where: { businessId, status: "AVAILABLE" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, category: true, size: true, description: true },
    }),
    prismaHack.equipmentCategory.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prismaHack.equipmentVariant.findMany({
      where: { businessId },
      orderBy: [{ category: { name: "asc" } }, { label: "asc" }],
      select: { id: true, label: true, categoryId: true, category: { select: { name: true } } },
    }),
    // Cast is intentional to avoid stale editor Prisma types.
    // Runtime and Next build use the generated client correctly.
    prismaHack.rental.findMany({
      where: { businessId, status: { in: statusFilter } },
      orderBy: { startAt: "desc" },
      take: 50,
      select: {
        id: true,
        customerId: true,
        equipmentId: true,
        equipmentCategoryId: true,
        equipmentVariantId: true,
        quantity: true,
        startAt: true,
        endAt: true,
        status: true,
        priceTotal: true,
      },
    }) as Promise<RentalRow[]>,
  ]);

  const customerIds = Array.from(new Set(rentals.map((r) => r.customerId)));
  const equipmentIds = Array.from(
    new Set(rentals.map((r) => r.equipmentId).filter(Boolean) as string[]),
  );
  const categoryIds = Array.from(
    new Set(
      rentals.map((r) => r.equipmentCategoryId).filter(Boolean) as string[],
    ),
  );
  const variantIds = Array.from(
    new Set(
      rentals.map((r) => r.equipmentVariantId).filter(Boolean) as string[],
    ),
  );

  const [rentalCustomers, rentalEquipment, rentalCategories, rentalVariants] = await Promise.all([
    prisma.customer.findMany({
      where: { businessId, id: { in: customerIds } },
      select: { id: true, firstName: true, lastName: true },
    }),
    equipmentIds.length
      ? prisma.equipment.findMany({
          where: { businessId, id: { in: equipmentIds } },
          select: { id: true, category: true, size: true },
        })
      : Promise.resolve([]),
    categoryIds.length
      ? prismaHack.equipmentCategory.findMany({
          where: { businessId, id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
    variantIds.length
      ? prismaHack.equipmentVariant.findMany({
          where: { businessId, id: { in: variantIds } },
          select: { id: true, label: true, categoryId: true, category: { select: { name: true } } },
        })
      : Promise.resolve([]),
  ]);

  const customerById = new Map<string, CustomerMini>(
    (rentalCustomers as CustomerMini[]).map((c) => [c.id, c]),
  );
  const equipmentById = new Map<string, EquipmentMini>(
    (rentalEquipment as EquipmentMini[]).map((e) => [e.id, e]),
  );
  const categoryById = new Map<string, CategoryMini>(
    (rentalCategories as CategoryMini[]).map((c) => [c.id, c]),
  );
  const variantById = new Map<string, VariantMini>(
    (rentalVariants as VariantMini[]).map((v) => [v.id, v]),
  );

  const now = new Date();
  const paymentSuccess = sp.payment === "success";

  return (
    <div className="min-w-0 grid gap-4">
      {paymentSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950/30 dark:text-green-200">
          Payment successful. The rental is now active.
        </div>
      )}
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">Rentals</div>
          <div className="text-sm text-muted-foreground">
            Create rentals, return equipment, and keep an audit trail.
          </div>
        </div>
        <CreateRentalDialog
          customers={customers}
          categories={categories as CategoryMini[]}
          variants={variants as VariantMini[]}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Recent rentals</CardTitle>
            <div className="text-sm text-muted-foreground">
              Status:{" "}
              <span className="font-medium text-foreground">
                {statusRaw === "history"
                  ? "History"
                  : statusRaw === "returned"
                    ? "Returned"
                    : statusRaw === "cancelled"
                      ? "Cancelled"
                      : "Active"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="min-w-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rentals.map((r) => {
                  const status = String(r.status);
                  const canCancel =
                    status === RENTAL_STATUS.PENDING ||
                    (status === RENTAL_STATUS.ACTIVE && r.startAt > now);
                  const canReturn =
                    status === RENTAL_STATUS.ACTIVE ||
                    status === RENTAL_STATUS.OVERDUE;
                  const canPay =
                    status === RENTAL_STATUS.PENDING &&
                    !!business?.chargesEnabled &&
                    !!business?.stripeAccountId &&
                    (r.priceTotal ?? 0) > 0;

                  const c = customerById.get(r.customerId);
                  const eq = r.equipmentId ? equipmentById.get(r.equipmentId) : null;
                  const cat = r.equipmentCategoryId
                    ? categoryById.get(r.equipmentCategoryId)
                    : null;
                  const v = r.equipmentVariantId
                    ? variantById.get(r.equipmentVariantId)
                    : null;

                  const equipmentLabel = v
                    ? `${v.category.name} ${v.label}`
                    : cat?.name ?? eq?.category ?? "—";
                  const sizeLabel = !v && eq?.size ? ` • ${eq.size}` : "";

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {c ? `${c.firstName} ${c.lastName}` : "—"}
                      </TableCell>
                      <TableCell>
                        {equipmentLabel}
                        {sizeLabel}
                        {typeof r.quantity === "number" ? ` • x${r.quantity}` : ""}
                      </TableCell>
                      <TableCell>{new Date(r.startAt).toLocaleString()}</TableCell>
                      <TableCell>{new Date(r.endAt).toLocaleString()}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
                          {canPay ? (
                            <PayRentalButton
                              rentalId={r.id}
                              amount={formatCurrency(r.priceTotal ?? 0, business?.currency)}
                            />
                          ) : null}
                          {canReturn ? <ReturnRentalButton rentalId={r.id} /> : null}
                          <CancelRentalButton rentalId={r.id} disabled={!canCancel} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {rentals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center">
                      No rentals found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

