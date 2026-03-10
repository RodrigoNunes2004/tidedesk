import { prisma } from "@/lib/prisma";
import { requireStaffOrOwner } from "@/lib/server/role";
import { CreateCategoryDialog } from "@/components/equipment/create-category-dialog";
import { CreateVariantDialog } from "@/components/equipment/create-variant-dialog";
import { DeleteCategoryButton } from "@/components/equipment/delete-category-button";
import { EquipmentVariantsTable } from "@/components/equipment/variants-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { getInUseByVariant } from "@/lib/equipment-availability";
import Link from "next/link";

const CATEGORIES_PAGE_SIZE = 12;
const VARIANTS_PAGE_SIZE = 15;

type SearchParams = { category?: string; catPage?: string; varPage?: string };

type VariantWithAvailability = {
  id: string;
  label: string;
  totalQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  category: { id: string; name: string };
  availableNow: number;
  inUse: number;
};

type PrismaWithCategory = typeof prisma & {
  equipmentCategory: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown | null>;
  };
  equipmentVariant: { findMany: (args: unknown) => Promise<unknown[]> };
};

async function getVariantsWithAvailability(
  businessId: string,
  categoryId: string,
  page: number,
  pageSize: number,
) {
  const prismaCat = prisma as unknown as PrismaWithCategory;
  const skip = (page - 1) * pageSize;
  const [variants, total] = await Promise.all([
    prismaCat.equipmentVariant.findMany({
      where: { businessId, categoryId },
      orderBy: { label: "asc" },
      skip,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true } },
      },
    }) as Promise<{ id: string; label: string; totalQuantity: number; lowStockThreshold: number; isActive: boolean; category: { id: string; name: string } }[]>,
    prisma.equipmentVariant.count({ where: { businessId, categoryId } }),
  ]);

  const variantIds = variants.map((v) => v.id);
  const now = new Date();
  const inUseMap = await getInUseByVariant(businessId, variantIds, now, now);

  const withAvailability = variants.map((v) => {
    const inUse = inUseMap.get(v.id) ?? 0;
    const availableNow = Math.max(0, v.totalQuantity - inUse);
    return {
      ...v,
      availableNow,
      inUse,
      lowStockThreshold: v.lowStockThreshold ?? 2,
    };
  });

  return { variants: withAvailability, total };
}

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireStaffOrOwner();
  const businessId = session.user.businessId;

  const sp = await searchParams;
  const selectedCategoryId = sp.category?.trim() || null;
  const catPage = Math.max(1, parseInt(sp.catPage ?? "1", 10) || 1);
  const varPage = Math.max(1, parseInt(sp.varPage ?? "1", 10) || 1);

  const prismaCat = prisma as unknown as PrismaWithCategory;
  const catSkip = (catPage - 1) * CATEGORIES_PAGE_SIZE;
  const [categoriesResult, categoriesTotal, selectedCategory, variantsResult] =
    await Promise.all([
      prismaCat.equipmentCategory.findMany({
        where: { businessId },
        orderBy: { name: "asc" },
        skip: catSkip,
        take: CATEGORIES_PAGE_SIZE,
        include: {
          _count: { select: { variants: true } },
        },
      }),
      prisma.equipmentCategory.count({ where: { businessId } }),
      selectedCategoryId
        ? prismaCat.equipmentCategory.findFirst({
            where: { id: selectedCategoryId, businessId },
            include: { variants: { where: { isActive: true }, orderBy: { label: "asc" } } },
          })
        : Promise.resolve(null),
      selectedCategoryId
        ? getVariantsWithAvailability(
            businessId,
            selectedCategoryId,
            varPage,
            VARIANTS_PAGE_SIZE,
          )
        : Promise.resolve({ variants: [], total: 0 }),
    ]);

  const categories = categoriesResult as { id: string; name: string; trackSizes: boolean; _count: { variants: number } }[];
  const { variants, total: variantsTotal } = variantsResult;

  return (
    <div className="min-w-0 grid gap-4">
      <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight">Equipment</div>
          <div className="text-sm text-muted-foreground">
            Manage inventory by type and variant. Adjust quantities when you buy
            or retire equipment.
          </div>
        </div>
        <CreateCategoryDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Categories</CardTitle>
          <p className="text-sm text-muted-foreground">
            Click a category to view and edit variants (sizes).
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Link href="/equipment">
              <div
                className={`rounded-lg border px-4 py-3 transition-colors ${
                  !selectedCategoryId
                    ? "border-primary bg-primary/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="font-medium">All</span>
              </div>
            </Link>
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Link
                    href={`/equipment?category=${cat.id}`}
                    className="flex min-w-0 flex-1 items-center gap-2"
                  >
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {cat._count.variants} sizes
                    </Badge>
                    {!cat.trackSizes ? (
                      <Badge variant="outline" className="text-xs shrink-0">
                        No sizes
                      </Badge>
                    ) : null}
                  </Link>
                  <DeleteCategoryButton
                    categoryId={cat.id}
                    categoryName={cat.name}
                    variantCount={cat._count.variants}
                  />
                </div>
              );
            })}
          </div>
          <Pagination
            totalItems={categoriesTotal}
            pageSize={CATEGORIES_PAGE_SIZE}
            currentPage={catPage}
            paramKey="catPage"
          />
        </CardContent>
      </Card>

      {selectedCategory ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">
                {(selectedCategory as { id: string; name: string }).name} — variants
              </CardTitle>
              <CreateVariantDialog
                categoryId={(selectedCategory as { id: string; name: string }).id}
                categoryName={(selectedCategory as { id: string; name: string }).name}
              />
            </div>
          </CardHeader>
          <CardContent>
            <EquipmentVariantsTable variants={variants as VariantWithAvailability[]} />
            <Pagination
              totalItems={variantsTotal}
              pageSize={VARIANTS_PAGE_SIZE}
              currentPage={varPage}
              paramKey="varPage"
            />
          </CardContent>
        </Card>
      ) : selectedCategoryId ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Category not found.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Select a category above to view variants.
          </CardContent>
        </Card>
      )}

    </div>
  );
}
