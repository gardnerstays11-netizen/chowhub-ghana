import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, pushTokensTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.post("/push-tokens", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { token, platform } = req.body;

  if (!token) {
    res.status(400).json({ error: "Push token is required" });
    return;
  }

  const [existing] = await db
    .select()
    .from(pushTokensTable)
    .where(and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.token, token)));

  if (existing) {
    res.json({ message: "Token already registered" });
    return;
  }

  await db.insert(pushTokensTable).values({
    userId,
    token,
    platform: platform || "unknown",
  });

  res.json({ message: "Push token registered" });
});

router.delete("/push-tokens", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const { token } = req.body;

  if (!token) {
    res.status(400).json({ error: "Push token is required" });
    return;
  }

  await db
    .delete(pushTokensTable)
    .where(and(eq(pushTokensTable.userId, userId), eq(pushTokensTable.token, token)));

  res.json({ message: "Push token removed" });
});

export default router;
