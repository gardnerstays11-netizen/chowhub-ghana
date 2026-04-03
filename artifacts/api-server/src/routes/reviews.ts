import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, reviewsTable, listingsTable, usersTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/listings/:listingId/reviews", async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const reviews = await db.select({
    review: reviewsTable,
    userName: usersTable.name,
  }).from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.listingId, listingId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(limit).offset(offset);

  const [stats] = await db.select({
    total: sql<number>`count(*)`,
    avgRating: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)`,
    avgFood: sql<number>`coalesce(avg(${reviewsTable.foodRating}), 0)`,
    avgService: sql<number>`coalesce(avg(${reviewsTable.serviceRating}), 0)`,
    avgAmbience: sql<number>`coalesce(avg(${reviewsTable.ambienceRating}), 0)`,
    avgValue: sql<number>`coalesce(avg(${reviewsTable.valueRating}), 0)`,
  }).from(reviewsTable).where(eq(reviewsTable.listingId, listingId));

  res.json({
    reviews: reviews.map(r => ({
      id: r.review.id,
      listingId: r.review.listingId,
      userId: r.review.userId,
      rating: r.review.rating,
      foodRating: r.review.foodRating,
      serviceRating: r.review.serviceRating,
      ambienceRating: r.review.ambienceRating,
      valueRating: r.review.valueRating,
      comment: r.review.comment,
      visitedFor: r.review.visitedFor,
      userName: r.userName ?? null,
      listingName: null,
      createdAt: r.review.createdAt.toISOString(),
    })),
    averageRating: Math.round(Number(stats.avgRating) * 10) / 10,
    avgFood: Math.round(Number(stats.avgFood) * 10) / 10,
    avgService: Math.round(Number(stats.avgService) * 10) / 10,
    avgAmbience: Math.round(Number(stats.avgAmbience) * 10) / 10,
    avgValue: Math.round(Number(stats.avgValue) * 10) / 10,
    total: Number(stats.total),
  });
});

router.post("/listings/:listingId/reviews", authMiddleware, async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const userId = (req as any).user.id;

  const existing = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.listingId, listingId), eq(reviewsTable.userId, userId)));
  if (existing.length > 0) {
    res.status(400).json({ error: "You have already reviewed this listing" });
    return;
  }

  const { rating, foodRating, serviceRating, ambienceRating, valueRating, comment, visitedFor } = req.body;

  const [review] = await db.insert(reviewsTable).values({
    listingId,
    userId,
    rating,
    foodRating,
    serviceRating,
    ambienceRating,
    valueRating,
    comment,
    visitedFor,
  }).returning();

  const [stats] = await db.select({
    avgRating: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)`,
    total: sql<number>`count(*)`,
  }).from(reviewsTable).where(eq(reviewsTable.listingId, listingId));

  await db.update(listingsTable).set({
    averageRating: Math.round(Number(stats.avgRating) * 10) / 10,
    totalReviews: Number(stats.total),
  }).where(eq(listingsTable.id, listingId));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  res.status(201).json({
    id: review.id,
    listingId: review.listingId,
    userId: review.userId,
    rating: review.rating,
    foodRating: review.foodRating,
    serviceRating: review.serviceRating,
    ambienceRating: review.ambienceRating,
    valueRating: review.valueRating,
    comment: review.comment,
    visitedFor: review.visitedFor,
    userName: user?.name ?? null,
    listingName: null,
    createdAt: review.createdAt.toISOString(),
  });
});

router.get("/reviews/mine", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const reviews = await db.select({
    review: reviewsTable,
    listingName: listingsTable.name,
  }).from(reviewsTable)
    .leftJoin(listingsTable, eq(reviewsTable.listingId, listingsTable.id))
    .where(eq(reviewsTable.userId, userId))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(r => ({
    id: r.review.id,
    listingId: r.review.listingId,
    userId: r.review.userId,
    rating: r.review.rating,
    foodRating: r.review.foodRating,
    serviceRating: r.review.serviceRating,
    ambienceRating: r.review.ambienceRating,
    valueRating: r.review.valueRating,
    comment: r.review.comment,
    visitedFor: r.review.visitedFor,
    userName: null,
    listingName: r.listingName ?? null,
    createdAt: r.review.createdAt.toISOString(),
  })));
});

export default router;
