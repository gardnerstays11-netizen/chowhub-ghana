import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, listingsTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.post("/orders", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { listingId, items, orderType, deliveryAddress, note } = req.body;

  const [order] = await db.insert(ordersTable).values({
    listingId,
    userId,
    items,
    orderType,
    deliveryAddress: deliveryAddress ?? null,
    note: note ?? null,
  }).returning();

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));

  res.status(201).json({
    id: order.id,
    listingId: order.listingId,
    userId: order.userId,
    items: order.items,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    note: order.note,
    status: order.status,
    listingName: listing?.name ?? null,
    userName: null,
    userPhone: null,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/orders/mine", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const orders = await db.select({
    order: ordersTable,
    listingName: listingsTable.name,
  }).from(ordersTable)
    .leftJoin(listingsTable, eq(ordersTable.listingId, listingsTable.id))
    .where(eq(ordersTable.userId, userId))
    .orderBy(desc(ordersTable.createdAt));

  res.json(orders.map(o => ({
    id: o.order.id,
    listingId: o.order.listingId,
    userId: o.order.userId,
    items: o.order.items,
    orderType: o.order.orderType,
    deliveryAddress: o.order.deliveryAddress,
    note: o.order.note,
    status: o.order.status,
    listingName: o.listingName ?? null,
    userName: null,
    userPhone: null,
    createdAt: o.order.createdAt.toISOString(),
  })));
});

export default router;
