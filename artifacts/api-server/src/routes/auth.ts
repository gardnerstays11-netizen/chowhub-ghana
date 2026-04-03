import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, usersTable, vendorsTable } from "@workspace/db";
import { signToken, authMiddleware, vendorAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { name, email, phone, password, city } = req.body;
  if (!name || !email || !password || !phone || !city) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({
    name,
    email,
    phone,
    password: hashedPassword,
    city,
  }).returning();

  const token = signToken({ id: user.id, email: user.email, role: "user" });
  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role as "user" | "admin" });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/auth/me/update", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { name, phone, city, avatarUrl } = req.body;
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (city !== undefined) updates.city = city;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    city: user.city,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/vendor/register", async (req, res): Promise<void> => {
  const { businessName, email, phone, password } = req.body;
  if (!businessName || !email || !password || !phone) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const existing = await db.select().from(vendorsTable).where(eq(vendorsTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [vendor] = await db.insert(vendorsTable).values({
    businessName,
    email,
    phone,
    password: hashedPassword,
  }).returning();

  const token = signToken({ id: vendor.id, email: vendor.email, role: "vendor" });
  res.status(201).json({
    token,
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      plan: vendor.plan,
      planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
      createdAt: vendor.createdAt.toISOString(),
    },
  });
});

router.post("/auth/vendor/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.email, email));
  if (!vendor) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, vendor.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ id: vendor.id, email: vendor.email, role: "vendor" });
  res.json({
    token,
    vendor: {
      id: vendor.id,
      businessName: vendor.businessName,
      email: vendor.email,
      phone: vendor.phone,
      status: vendor.status,
      plan: vendor.plan,
      planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
      createdAt: vendor.createdAt.toISOString(),
    },
  });
});

router.get("/auth/vendor/me", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  res.json({
    id: vendor.id,
    businessName: vendor.businessName,
    email: vendor.email,
    phone: vendor.phone,
    status: vendor.status,
    plan: vendor.plan,
    planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
    createdAt: vendor.createdAt.toISOString(),
  });
});

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user || user.role !== "admin") {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: "admin" });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      city: user.city,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

export default router;
