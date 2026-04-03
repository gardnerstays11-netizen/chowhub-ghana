import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, paymentsTable, ordersTable, subscriptionsTable, vendorsTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";
import crypto from "crypto";

const router: IRouter = Router();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE_URL = "https://api.paystack.co";

async function paystackRequest(endpoint: string, method: string, body?: any) {
  const res = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

router.post("/payments/initialize", authMiddleware, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const { amount, email, paymentType, orderId, subscriptionId, callbackUrl, metadata } = req.body;

  if (!amount || !email || !paymentType) {
    res.status(400).json({ error: "amount, email, and paymentType are required" });
    return;
  }

  const reference = `chow_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const paystackData = await paystackRequest("/transaction/initialize", "POST", {
    amount: Math.round(amount * 100),
    email,
    reference,
    currency: "GHS",
    callback_url: callbackUrl || undefined,
    metadata: {
      paymentType,
      orderId: orderId || null,
      subscriptionId: subscriptionId || null,
      userId: user.id,
      ...metadata,
    },
  });

  if (!paystackData.status) {
    res.status(400).json({ error: paystackData.message || "Failed to initialize payment" });
    return;
  }

  await db.insert(paymentsTable).values({
    reference,
    amount,
    currency: "GHS",
    status: "pending",
    paymentType,
    orderId: orderId || null,
    subscriptionId: subscriptionId || null,
    userId: user.id,
    vendorId: null,
    email,
  });

  if (orderId) {
    await db.update(ordersTable)
      .set({ paymentReference: reference, paymentStatus: "pending", totalAmount: amount })
      .where(eq(ordersTable.id, orderId));
  }

  res.json({
    authorization_url: paystackData.data.authorization_url,
    access_code: paystackData.data.access_code,
    reference,
  });
});

router.post("/payments/initialize-subscription", authMiddleware, async (req, res): Promise<void> => {
  const reqUser = (req as any).user;
  const vendorId = reqUser.id;
  const { packageSlug, amount, email, callbackUrl } = req.body;

  if (!packageSlug || !amount || !email) {
    res.status(400).json({ error: "packageSlug, amount, and email are required" });
    return;
  }

  const reference = `chow_sub_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  const paystackData = await paystackRequest("/transaction/initialize", "POST", {
    amount: Math.round(amount * 100),
    email,
    reference,
    currency: "GHS",
    callback_url: callbackUrl || undefined,
    metadata: {
      paymentType: "subscription",
      vendorId,
      packageSlug,
    },
  });

  if (!paystackData.status) {
    res.status(400).json({ error: paystackData.message || "Failed to initialize payment" });
    return;
  }

  await db.insert(paymentsTable).values({
    reference,
    amount,
    currency: "GHS",
    status: "pending",
    paymentType: "subscription",
    vendorId,
    email,
  });

  res.json({
    authorization_url: paystackData.data.authorization_url,
    access_code: paystackData.data.access_code,
    reference,
  });
});

router.get("/payments/verify/:reference", authMiddleware, async (req, res): Promise<void> => {
  const { reference } = req.params;

  const paystackData = await paystackRequest(`/transaction/verify/${reference}`, "GET");

  if (!paystackData.status) {
    res.status(400).json({ error: paystackData.message || "Verification failed" });
    return;
  }

  const txn = paystackData.data;
  const status = txn.status === "success" ? "success" : txn.status === "failed" ? "failed" : "pending";

  await db.update(paymentsTable)
    .set({
      status,
      channel: txn.channel || null,
      paidAt: txn.paid_at ? new Date(txn.paid_at) : null,
      metadata: JSON.stringify(txn.metadata || {}),
    })
    .where(eq(paymentsTable.reference, reference));

  const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference));

  if (status === "success" && payment) {
    if (payment.paymentType === "order" && payment.orderId) {
      await db.update(ordersTable)
        .set({ paymentStatus: "paid", paymentChannel: txn.channel })
        .where(eq(ordersTable.id, payment.orderId));
    }

    if (payment.paymentType === "subscription" && payment.vendorId) {
      const meta = txn.metadata || {};
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await db.update(vendorsTable)
        .set({ plan: meta.packageSlug || "premium", planExpiresAt: endDate })
        .where(eq(vendorsTable.id, payment.vendorId));
    }
  }

  res.json({
    reference,
    status,
    amount: txn.amount / 100,
    currency: txn.currency,
    channel: txn.channel,
    paidAt: txn.paid_at,
    paymentType: payment?.paymentType,
  });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const hash = crypto.createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const txn = event.data;
    const reference = txn.reference;

    await db.update(paymentsTable)
      .set({
        status: "success",
        channel: txn.channel || null,
        paidAt: txn.paid_at ? new Date(txn.paid_at) : null,
        metadata: JSON.stringify(txn.metadata || {}),
      })
      .where(eq(paymentsTable.reference, reference));

    const [payment] = await db.select().from(paymentsTable).where(eq(paymentsTable.reference, reference));

    if (payment) {
      if (payment.paymentType === "order" && payment.orderId) {
        await db.update(ordersTable)
          .set({ paymentStatus: "paid", paymentChannel: txn.channel })
          .where(eq(ordersTable.id, payment.orderId));
      }

      if (payment.paymentType === "subscription" && payment.vendorId) {
        const meta = txn.metadata || {};
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await db.update(vendorsTable)
          .set({ plan: meta.packageSlug || "premium", planExpiresAt: endDate })
          .where(eq(vendorsTable.id, payment.vendorId));
      }
    }
  }

  res.status(200).json({ received: true });
});

router.get("/payments/mine", authMiddleware, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const payments = await db.select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, user.id))
    .orderBy(desc(paymentsTable.createdAt));

  res.json(payments.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() || null,
  })));
});

export default router;
