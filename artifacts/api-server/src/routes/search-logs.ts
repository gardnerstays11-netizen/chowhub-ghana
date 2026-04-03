import { Router, type IRouter } from "express";
import { db, searchLogsTable } from "@workspace/db";
import { optionalAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.post("/search-logs", optionalAuthMiddleware, async (req, res): Promise<void> => {
  const { query, city, category, filters, resultsCount, sessionId } = req.body;
  const normalizedQuery = (query || "").trim().toLowerCase();

  if (!normalizedQuery || normalizedQuery.length < 2) {
    res.status(200).json({ logged: false });
    return;
  }

  await db.insert(searchLogsTable).values({
    query: normalizedQuery,
    city: city || null,
    category: category || null,
    filters: filters || {},
    resultsCount: resultsCount || 0,
    userId: (req as any).userId || null,
    sessionId: sessionId || null,
  });

  res.status(201).json({ logged: true });
});

export default router;
