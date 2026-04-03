import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import rateLimit from "express-rate-limit";
import { eq, and, gt, isNull } from "drizzle-orm";
import { db, usersTable, vendorsTable, passwordResetsTable } from "@workspace/db";
import { signToken, authMiddleware, vendorAuthMiddleware } from "../lib/auth";
import { sendEmail, passwordResetEmail } from "../lib/email";

const router: IRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many password reset requests. Please try again later." },
});

router.post("/auth/register", authLimiter, async (req, res): Promise<void> => {
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

router.post("/auth/login", authLimiter, async (req, res): Promise<void> => {
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

router.post("/auth/forgot-password", forgotPasswordLimiter, async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetsTable).values({
    email,
    token: resetToken,
    expiresAt,
  });

  if (user) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://chowhub.gh";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    const emailContent = passwordResetEmail({ name: user.name, resetUrl });
    await sendEmail({ to: email, ...emailContent });
  }

  res.json({ message: "If an account exists with that email, a password reset link has been sent." });
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [resetRecord] = await db.select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.token, token),
        gt(passwordResetsTable.expiresAt, new Date()),
        isNull(passwordResetsTable.usedAt)
      )
    );

  if (!resetRecord) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [user] = await db.update(usersTable)
    .set({ password: hashedPassword })
    .where(eq(usersTable.email, resetRecord.email))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db.update(passwordResetsTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetsTable.id, resetRecord.id));

  res.json({ message: "Password reset successfully. You can now log in with your new password." });
});

router.post("/auth/vendor/forgot-password", forgotPasswordLimiter, async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.email, email));

  const resetToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetsTable).values({
    email,
    token: resetToken,
    expiresAt,
  });

  if (vendor) {
    const baseUrl = process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "https://chowhub.gh";
    const resetUrl = `${baseUrl}/vendor/reset-password?token=${resetToken}`;
    const emailContent = passwordResetEmail({ name: vendor.businessName, resetUrl });
    await sendEmail({ to: email, ...emailContent });
  }

  res.json({ message: "If an account exists with that email, a password reset link has been sent." });
});

router.post("/auth/vendor/reset-password", async (req, res): Promise<void> => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const [resetRecord] = await db.select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.token, token),
        gt(passwordResetsTable.expiresAt, new Date()),
        isNull(passwordResetsTable.usedAt)
      )
    );

  if (!resetRecord) {
    res.status(400).json({ error: "Invalid or expired reset token" });
    return;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  const [vendor] = await db.update(vendorsTable)
    .set({ password: hashedPassword })
    .where(eq(vendorsTable.email, resetRecord.email))
    .returning();

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  await db.update(passwordResetsTable)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetsTable.id, resetRecord.id));

  res.json({ message: "Password reset successfully. You can now log in with your new password." });
});

router.post("/auth/vendor/register", authLimiter, async (req, res): Promise<void> => {
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

router.post("/auth/vendor/login", authLimiter, async (req, res): Promise<void> => {
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

router.post("/auth/admin/login", authLimiter, async (req, res): Promise<void> => {
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
