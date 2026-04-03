import { Router, type IRouter } from "express";
import { EventEmitter } from "events";
import { eq, desc } from "drizzle-orm";
import { db, ordersTable, listingsTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";
import { sendEmail, orderConfirmationEmail, orderStatusUpdateEmail } from "../lib/email";

const router: IRouter = Router();
export const orderEvents = new EventEmitter();
orderEvents.setMaxListeners(100);

router.post("/orders", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { listingId, items, orderType, deliveryAddress, note, totalAmount } = req.body;

  const [order] = await db.insert(ordersTable).values({
    listingId,
    userId,
    items,
    orderType,
    deliveryAddress: deliveryAddress ?? null,
    note: note ?? null,
    totalAmount: totalAmount ?? null,
  }).returning();

  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (user && listing) {
    const emailContent = orderConfirmationEmail({
      customerName: user.name,
      orderType: order.orderType,
      listingName: listing.name,
      items: order.items as any[],
      totalAmount: order.totalAmount ? parseFloat(String(order.totalAmount)) : undefined,
      paymentMethod: 'whatsapp',
    });
    await sendEmail({ to: user.email, ...emailContent });
  }

  res.status(201).json({
    id: order.id,
    listingId: order.listingId,
    userId: order.userId,
    items: order.items,
    orderType: order.orderType,
    deliveryAddress: order.deliveryAddress,
    note: order.note,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    paymentReference: order.paymentReference,
    paymentChannel: order.paymentChannel,
    status: order.status,
    listingName: listing?.name ?? null,
    userName: user?.name ?? null,
    userPhone: user?.phone ?? null,
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
    totalAmount: o.order.totalAmount,
    paymentStatus: o.order.paymentStatus,
    paymentReference: o.order.paymentReference,
    paymentChannel: o.order.paymentChannel,
    status: o.order.status,
    listingName: o.listingName ?? null,
    userName: null,
    userPhone: null,
    createdAt: o.order.createdAt.toISOString(),
  })));
});

router.patch("/orders/:orderId/status", authMiddleware, async (req, res): Promise<void> => {
  const { orderId } = req.params;
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

  if (!status || !validStatuses.includes(status)) {
    res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const [existingOrder] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!existingOrder) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const reqUser = (req as any).user;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, existingOrder.listingId));
  const isVendorOwner = listing && reqUser.id === listing.vendorId;
  const isAdmin = reqUser.role === 'admin';

  if (!isVendorOwner && !isAdmin) {
    res.status(403).json({ error: "Only the vendor or admin can update order status" });
    return;
  }

  const [order] = await db.update(ordersTable)
    .set({ status })
    .where(eq(ordersTable.id, orderId))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, order.userId));

  if (user && listing) {
    const emailContent = orderStatusUpdateEmail({
      customerName: user.name,
      listingName: listing.name,
      orderId: order.id,
      newStatus: status,
    });
    await sendEmail({ to: user.email, ...emailContent });
  }

  orderEvents.emit(`order:${orderId}`, { status: order.status, updatedAt: new Date().toISOString() });

  res.json({
    id: order.id,
    listingId: order.listingId,
    userId: order.userId,
    items: order.items,
    orderType: order.orderType,
    status: order.status,
    totalAmount: order.totalAmount,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/orders/:orderId/stream", authMiddleware, async (req, res): Promise<void> => {
  const { orderId } = req.params;
  const reqUser = (req as any).user;

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const isOrderOwner = order.userId === reqUser.id;
  const isAdmin = reqUser.role === "admin";
  let isVendorOwner = false;
  if (order.listingId) {
    const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, order.listingId));
    isVendorOwner = listing && reqUser.id === listing.vendorId;
  }

  if (!isOrderOwner && !isVendorOwner && !isAdmin) {
    res.status(403).json({ error: "Not authorized to subscribe to this order" });
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

  const handler = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  orderEvents.on(`order:${orderId}`, handler);

  const heartbeat = setInterval(() => {
    res.write(": heartbeat\n\n");
  }, 30000);

  req.on("close", () => {
    orderEvents.off(`order:${orderId}`, handler);
    clearInterval(heartbeat);
  });
});

export default router;
