import { prisma } from './src/lib/prisma';

async function main() {
  console.log('🧹 Clearing all data except users and medicines...');

  try {
    await prisma.$transaction([
      // ── Fulfillment / Shipping ──────────────────────────────────────────────
      prisma.packingSlip.deleteMany({}),
      prisma.fulfillmentTask.deleteMany({}),
      prisma.shipmentLeg.deleteMany({}),
      prisma.orderTracking.deleteMany({}),
      prisma.returnRequest.deleteMany({}),

      // ── Order items / sub-orders / orders ──────────────────────────────────
      prisma.orderItem.deleteMany({}),
      prisma.subOrder.deleteMany({}),
      prisma.order.deleteMany({}),

      // ── Cart ───────────────────────────────────────────────────────────────
      prisma.cartItem.deleteMany({}),
      prisma.cart.deleteMany({}),

      // ── Wishlist ───────────────────────────────────────────────────────────
      prisma.wishlistItem.deleteMany({}),
      prisma.wishlist.deleteMany({}),

      // ── Wallet ─────────────────────────────────────────────────────────────
      prisma.walletTransaction.deleteMany({}),
      prisma.withdrawalRequest.deleteMany({}),
      prisma.wallet.deleteMany({}),

      // ── Reviews ────────────────────────────────────────────────────────────
      prisma.review.deleteMany({}),

      // ── Flash Sales ────────────────────────────────────────────────────────
      prisma.flashSale.deleteMany({}),

      // ── Coupon usage ───────────────────────────────────────────────────────
      prisma.couponUsage.deleteMany({}),

      // ── Prescriptions ──────────────────────────────────────────────────────
      prisma.prescription.deleteMany({}),

      // ── Notifications ──────────────────────────────────────────────────────
      prisma.notification.deleteMany({}),

      // ── Warehouse operations ───────────────────────────────────────────────
      prisma.gRNItem.deleteMany({}),
      prisma.goodsReceiptNote.deleteMany({}),
      prisma.stockTransferItem.deleteMany({}),
      prisma.stockTransfer.deleteMany({}),
      prisma.binAllocation.deleteMany({}),
      prisma.locationStock.deleteMany({}),
      prisma.storageBin.deleteMany({}),
      prisma.warehouseLocation.deleteMany({}),
      prisma.expiryAlert.deleteMany({}),
      prisma.temperatureLog.deleteMany({}),

      // ── Supplier shipments ─────────────────────────────────────────────────
      prisma.supplierShipment.deleteMany({}),

      // ── Stock / Batches / Alerts ───────────────────────────────────────────
      prisma.medicineBatch.deleteMany({}),
      prisma.stockAlert.deleteMany({}),

      // ── Subscriptions ──────────────────────────────────────────────────────
      prisma.subscription.deleteMany({}),
    ]);

    console.log('✅ Done! Users, medicines, categories, warehouses, coupons, and suppliers preserved.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();


// npx ts-node clear-orders.ts