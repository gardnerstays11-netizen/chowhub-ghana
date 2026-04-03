import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, vendorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export interface JwtPayload {
  id: string;
  email: string;
  role: "user" | "vendor" | "admin";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  (req as any).user = payload;
  next();
}

export function vendorAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== "vendor") {
    res.status(401).json({ error: "Vendor authentication required" });
    return;
  }
  (req as any).user = payload;
  next();
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    if (payload) {
      (req as any).user = payload;
      (req as any).userId = payload.id;
    }
  }
  next();
}

export async function requireApprovedVendor(req: Request, res: Response, next: NextFunction): Promise<void> {
  const vendorId = (req as any).user?.id;
  if (!vendorId) {
    res.status(401).json({ error: "Vendor authentication required" });
    return;
  }
  const [vendor] = await db.select({ status: vendorsTable.status }).from(vendorsTable).where(eq(vendorsTable.id, vendorId));
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }
  if (vendor.status !== "approved") {
    res.status(403).json({ error: "Your vendor account is pending approval. This feature is available once approved." });
    return;
  }
  next();
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = authHeader.split(" ")[1];
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "Admin authentication required" });
    return;
  }
  (req as any).user = payload;
  next();
}
