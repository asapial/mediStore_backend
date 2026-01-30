import { prisma } from "../../lib/prisma";
import { CreateOrderType } from "./order.types";

const postOrderQuery = async (
  userId: string,
  data: CreateOrderType
) => {
  return await prisma.$transaction(async (tx) => {

    // 1️⃣ Fetch medicines
    const medicineIds = data.items.map((i) => i.medicineId);

    const medicines = await tx.medicine.findMany({
      where: { id: { in: medicineIds } },
    });

    if (medicines.length !== medicineIds.length) {
      throw new Error("One or more medicines not found");
    }

    // 2️⃣ Create order
    const order = await tx.order.create({
      data: {
        userId,
        address: data.address,
      },
    });

    // 3️⃣ Create order items
    const orderItemsData = data.items.map((item) => {
      const medicine = medicines.find((m) => m.id === item.medicineId)!;

      return {
        orderId: order.id,
        medicineId: medicine.id,
        quantity: item.quantity,
        price: medicine.price, // price snapshot
      };
    });

    await tx.orderItem.createMany({
      data: orderItemsData,
    });

    return order;
  });
};

const getUserOrdersQuery = async (userId:string)=>{

    const result = await prisma.order.findMany({
        where:{
            userId
        },
        include:{
            items:{
                include:{
                    medicine:{
                        select:{
                            name:true,
                            description:true,
                            price:true,
                            image:true,
                        }
                    }
                }
            }
        }
    })

    return result;
}






export const orderService={
postOrderQuery,
getUserOrdersQuery
}