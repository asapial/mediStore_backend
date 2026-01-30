import { prisma } from "../../lib/prisma";
import { postMedicineType, postMedicineSchema, updateMedicineType } from "./seller.types";
import { string, z, ZodError } from "zod";

const postMedicineQuery = async (data: postMedicineType) => {
    try {
        // 1️⃣ Validate input using Zod
        const validatedData = postMedicineSchema.parse(data);

        // 2️⃣ Transform undefined image to null for Prisma
        const prismaData = {
            ...validatedData,
            sellerId: "uEfEn65DfNiK2pD9a1krMZPAomg5WolQ",
            image: validatedData.image ?? null, // Prisma expects string | null
        };

        // 3️⃣ Insert into DB
        const result = await prisma.medicine.create({
            data: prismaData,
        });

        return result;
    } catch (err: unknown) {
        // 4️⃣ Properly check if it's a ZodError
        if (err instanceof ZodError) {
            const messages = err.issues.map(issue => issue.message).join(", "); // use `issues` not `errors`
            throw new Error("Validation failed: " + messages);
        }

        // 5️⃣ Re-throw other errors
        throw err;
    }
};


const updateMedicineQuery = async (id: string, data: updateMedicineType) => {
    try {

        const prismaData: any = {};

        // Only include fields if they are defined
        if (data.name !== undefined) prismaData.name = { set: data.name };
        if (data.description !== undefined) prismaData.description = { set: data.description };
        if (data.price !== undefined) prismaData.price = { set: data.price };
        if (data.stock !== undefined) prismaData.stock = { set: data.stock };
        if (data.manufacturer !== undefined) prismaData.manufacturer = { set: data.manufacturer };
        if (data.category !== undefined) prismaData.category = { set: data.category };

        // Special case for image: can be null
        if (data.image !== undefined) prismaData.image = { set: data.image };

        // Update medicine
        const result = await prisma.medicine.update({
            where: { id },
            data: prismaData
        });

        return result;
    } catch (err: unknown) {
        if (err instanceof ZodError) {
            const messages = err.issues.map((issue) => issue.message).join(", ");
            throw new Error("Validation failed: " + messages);
        }
        throw err;
    }
};

const deleteMedicineQuery = async (id: string) => {

    const result = await prisma.medicine.delete({
        where: {
            id
        }
    })

    if (!result) {
        throw new Error("Medicine not found or could not be deleted");
        return;
    }

    return result;
}


const getSellerOrderQuery = async (id: string) => {

    const result = await prisma.order.findMany({
        where: {
            items: {
                some: {
                    medicine: {
                        sellerId: id
                    }
                }
            }
        },
        include: {
            items: {
                where: {
                    medicine: {
                        sellerId: id
                    }
                },
                include: {
                    medicine: {
                        select: {
                            name: true,
                            description: true,
                            price: true,
                            image: true,
                            seller: true
                        }
                    },
                }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true
                }
            }
        }

    })

    console.log(result)


    return result;
}


export const sellerService = {
    postMedicineQuery,
    updateMedicineQuery,
    deleteMedicineQuery,
    getSellerOrderQuery
};
