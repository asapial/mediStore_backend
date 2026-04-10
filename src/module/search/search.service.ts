import { prisma } from "../../lib/prisma";

interface AdvancedSearchFilters {
  name?: string;
  genericName?: string;
  manufacturer?: string;
  categoryId?: string;
  minPrice?: string | number;
  maxPrice?: string | number;
  inStock?: string;           // "true" | "false"
  sortBy?: "price_asc" | "price_desc" | "name_asc" | "newest";
}

// ─── Advanced Medicine Search ─────────────────────────────────────────────────
const advancedSearch = async (filters: AdvancedSearchFilters) => {
  const {
    name,
    genericName,
    manufacturer,
    categoryId,
    minPrice,
    maxPrice,
    inStock,
    sortBy = "newest",
  } = filters;

  const where: any = {};

  if (name) where.name = { contains: String(name), mode: "insensitive" };
  if (genericName) where.genericName = { contains: String(genericName), mode: "insensitive" };
  if (manufacturer) where.manufacturer = { contains: String(manufacturer), mode: "insensitive" };
  if (categoryId) where.categoryId = categoryId;
  if (inStock === "true") where.stock = { gt: 0 };

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const orderBy: any =
    sortBy === "price_asc"
      ? { price: "asc" }
      : sortBy === "price_desc"
      ? { price: "desc" }
      : sortBy === "name_asc"
      ? { name: "asc" }
      : { createdAt: "desc" };

  const medicines = await prisma.medicine.findMany({
    where,
    include: {
      category: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
    orderBy,
  });

  return medicines;
};

// ─── Generic Alternatives ─────────────────────────────────────────────────────
// Given a medicine ID, find other medicines with the same genericName
const getGenericAlternatives = async (medicineId: string) => {
  const source = await prisma.medicine.findUnique({
    where: { id: medicineId },
    select: { genericName: true, name: true, id: true },
  });

  if (!source || !source.genericName) {
    return { source, alternatives: [] };
  }

  const alternatives = await prisma.medicine.findMany({
    where: {
      genericName: { equals: source.genericName, mode: "insensitive" },
      id: { not: medicineId },
      stock: { gt: 0 },
    },
    include: {
      category: { select: { name: true } },
      seller: { select: { name: true } },
    },
    orderBy: { price: "asc" },
  });

  return { source, alternatives };
};

export const searchService = {
  advancedSearch,
  getGenericAlternatives,
};
