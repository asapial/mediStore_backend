import { prisma } from "../../lib/prisma";

interface GetAllMedicinesFilters {
  categoryId?: string;
  sellerId?: string;
  name?: string;
  minPrice?: number | string;
  maxPrice?: number | string;
}

const getAllMedicines = async (filters: GetAllMedicinesFilters) => {
  const { categoryId, sellerId, name, minPrice, maxPrice } = filters;

  // Build Prisma "where" object dynamically
  const where: any = {};

  if (categoryId) where.categoryId = categoryId;
  if (sellerId) where.sellerId = sellerId;
  if (name) where.name = { contains: String(name), mode: "insensitive" };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  const medicines = await prisma.medicine.findMany({
    where,
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return medicines;
};

const getMyMedicines = async (sellerId:string) => {

  const medicines = await prisma.medicine.findMany({
    where:{
      sellerId:sellerId
    },
    include:{
      category:{
        select:{
          name:true
        }
      },
      seller:{
        select:{
          name:true
        }
      }
    }

  });

  console.log(medicines)

  return medicines;
};

const getMedicineById = async (id: string) => {
  const medicine = await prisma.medicine.findUnique({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  return medicine;
};


export const medicineService = {
  getAllMedicines,
  getMedicineById,
  getMyMedicines


  
};
