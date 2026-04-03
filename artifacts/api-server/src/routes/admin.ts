import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray, gte } from "drizzle-orm";
import { db, usersTable, vendorsTable, listingsTable, listingPhotosTable, reviewsTable, reservationsTable, ordersTable, searchLogsTable } from "@workspace/db";
import { adminAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/admin/stats", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const [stats] = await db.select({
    totalListings: sql<number>`(select count(*) from listings)`,
    totalUsers: sql<number>`(select count(*) from users)`,
    totalVendors: sql<number>`(select count(*) from vendors)`,
    pendingVendors: sql<number>`(select count(*) from vendors where status = 'pending')`,
    totalReservations: sql<number>`(select count(*) from reservations)`,
    totalOrders: sql<number>`(select count(*) from orders)`,
    totalReviews: sql<number>`(select count(*) from reviews)`,
  }).from(sql`(select 1) as t`);

  res.json({
    totalListings: Number(stats.totalListings),
    totalUsers: Number(stats.totalUsers),
    totalVendors: Number(stats.totalVendors),
    pendingVendors: Number(stats.pendingVendors),
    totalReservations: Number(stats.totalReservations),
    totalOrders: Number(stats.totalOrders),
    totalReviews: Number(stats.totalReviews),
  });
});

router.get("/admin/vendors", adminAuthMiddleware, async (req, res): Promise<void> => {
  const conditions: any[] = [];
  if (req.query.status) conditions.push(eq(vendorsTable.status, req.query.status as string));

  const vendors = conditions.length > 0
    ? await db.select().from(vendorsTable).where(and(...conditions)).orderBy(desc(vendorsTable.createdAt))
    : await db.select().from(vendorsTable).orderBy(desc(vendorsTable.createdAt));

  res.json(vendors.map(v => ({
    id: v.id, businessName: v.businessName, email: v.email, phone: v.phone,
    status: v.status, plan: v.plan,
    planExpiresAt: v.planExpiresAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  })));
});

router.patch("/admin/vendors/:vendorId/approve", adminAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const [vendor] = await db.update(vendorsTable).set({ status: "approved" }).where(eq(vendorsTable.id, vendorId)).returning();
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }
  res.json({
    id: vendor.id, businessName: vendor.businessName, email: vendor.email, phone: vendor.phone,
    status: vendor.status, plan: vendor.plan, planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
    createdAt: vendor.createdAt.toISOString(),
  });
});

router.patch("/admin/vendors/:vendorId/reject", adminAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const [vendor] = await db.update(vendorsTable).set({ status: "rejected" }).where(eq(vendorsTable.id, vendorId)).returning();
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }
  res.json({
    id: vendor.id, businessName: vendor.businessName, email: vendor.email, phone: vendor.phone,
    status: vendor.status, plan: vendor.plan, planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
    createdAt: vendor.createdAt.toISOString(),
  });
});

router.patch("/admin/vendors/:vendorId/plan", adminAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = Array.isArray(req.params.vendorId) ? req.params.vendorId[0] : req.params.vendorId;
  const { plan, planExpiresAt } = req.body;
  const [vendor] = await db.update(vendorsTable).set({
    plan,
    planExpiresAt: planExpiresAt ? new Date(planExpiresAt) : null,
  }).where(eq(vendorsTable.id, vendorId)).returning();
  if (!vendor) { res.status(404).json({ error: "Vendor not found" }); return; }
  res.json({
    id: vendor.id, businessName: vendor.businessName, email: vendor.email, phone: vendor.phone,
    status: vendor.status, plan: vendor.plan, planExpiresAt: vendor.planExpiresAt?.toISOString() ?? null,
    createdAt: vendor.createdAt.toISOString(),
  });
});

router.get("/admin/listings", adminAuthMiddleware, async (req, res): Promise<void> => {
  const conditions: any[] = [];
  if (req.query.city) conditions.push(eq(listingsTable.city, req.query.city as string));
  if (req.query.category) conditions.push(eq(listingsTable.category, req.query.category as string));
  if (req.query.status) conditions.push(eq(listingsTable.status, req.query.status as string));

  const listings = conditions.length > 0
    ? await db.select().from(listingsTable).where(and(...conditions)).orderBy(desc(listingsTable.createdAt))
    : await db.select().from(listingsTable).orderBy(desc(listingsTable.createdAt));

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));

  res.json(listings.map(l => ({
    id: l.id, vendorId: l.vendorId, name: l.name, slug: l.slug, category: l.category,
    cuisineType: l.cuisineType, diningStyle: l.diningStyle, mealPeriod: l.mealPeriod,
    priceRange: l.priceRange, city: l.city, area: l.area,
    averageRating: l.averageRating, totalReviews: l.totalReviews,
    isFeatured: l.isFeatured, isVerified: l.isVerified, status: l.status,
    coverPhoto: coverMap.get(l.id) ?? null, phone: l.phone, whatsapp: l.whatsapp,
    acceptsReservations: l.acceptsReservations, acceptsOrders: l.acceptsOrders,
    openingHours: l.openingHours, lat: l.lat, lng: l.lng, distance: null,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.patch("/admin/listings/:listingId/feature", adminAuthMiddleware, async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.id, listingId));
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

  const [updated] = await db.update(listingsTable).set({ isFeatured: !listing.isFeatured })
    .where(eq(listingsTable.id, listingId)).returning();

  res.json({
    id: updated.id, vendorId: updated.vendorId, name: updated.name, slug: updated.slug,
    category: updated.category, cuisineType: updated.cuisineType, diningStyle: updated.diningStyle,
    mealPeriod: updated.mealPeriod, priceRange: updated.priceRange, city: updated.city,
    area: updated.area, averageRating: updated.averageRating, totalReviews: updated.totalReviews,
    isFeatured: updated.isFeatured, isVerified: updated.isVerified, status: updated.status,
    coverPhoto: null, phone: updated.phone, whatsapp: updated.whatsapp,
    acceptsReservations: updated.acceptsReservations, acceptsOrders: updated.acceptsOrders,
    openingHours: updated.openingHours, lat: updated.lat, lng: updated.lng, distance: null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.patch("/admin/listings/:listingId/status", adminAuthMiddleware, async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const [updated] = await db.update(listingsTable).set({ status: req.body.status })
    .where(eq(listingsTable.id, listingId)).returning();
  if (!updated) { res.status(404).json({ error: "Listing not found" }); return; }

  res.json({
    id: updated.id, vendorId: updated.vendorId, name: updated.name, slug: updated.slug,
    category: updated.category, cuisineType: updated.cuisineType, diningStyle: updated.diningStyle,
    mealPeriod: updated.mealPeriod, priceRange: updated.priceRange, city: updated.city,
    area: updated.area, averageRating: updated.averageRating, totalReviews: updated.totalReviews,
    isFeatured: updated.isFeatured, isVerified: updated.isVerified, status: updated.status,
    coverPhoto: null, phone: updated.phone, whatsapp: updated.whatsapp,
    acceptsReservations: updated.acceptsReservations, acceptsOrders: updated.acceptsOrders,
    openingHours: updated.openingHours, lat: updated.lat, lng: updated.lng, distance: null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/admin/users", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(users.map(u => ({
    id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city, role: u.role,
    createdAt: u.createdAt.toISOString(),
  })));
});

router.get("/admin/reviews", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const reviews = await db.select({
    review: reviewsTable,
    userName: usersTable.name,
    listingName: listingsTable.name,
  }).from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .leftJoin(listingsTable, eq(reviewsTable.listingId, listingsTable.id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(r => ({
    id: r.review.id, listingId: r.review.listingId, userId: r.review.userId,
    rating: r.review.rating, foodRating: r.review.foodRating, serviceRating: r.review.serviceRating,
    ambienceRating: r.review.ambienceRating, valueRating: r.review.valueRating,
    comment: r.review.comment, visitedFor: r.review.visitedFor,
    userName: r.userName ?? null, listingName: r.listingName ?? null,
    createdAt: r.review.createdAt.toISOString(),
  })));
});

router.get("/admin/search-analytics", adminAuthMiddleware, async (req, res): Promise<void> => {
  const days = parseInt(req.query.days as string) || 30;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const topSearches = await db.select({
    query: searchLogsTable.query,
    count: sql<number>`count(*)`,
    avgResults: sql<number>`avg(${searchLogsTable.resultsCount})`,
    lastSearched: sql<string>`max(${searchLogsTable.createdAt})`,
  }).from(searchLogsTable)
    .where(gte(searchLogsTable.createdAt, since))
    .groupBy(searchLogsTable.query)
    .orderBy(sql`count(*) desc`)
    .limit(limit);

  const topCategories = await db.select({
    category: searchLogsTable.category,
    count: sql<number>`count(*)`,
  }).from(searchLogsTable)
    .where(and(gte(searchLogsTable.createdAt, since), sql`${searchLogsTable.category} is not null`))
    .groupBy(searchLogsTable.category)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  const topCities = await db.select({
    city: searchLogsTable.city,
    count: sql<number>`count(*)`,
  }).from(searchLogsTable)
    .where(and(gte(searchLogsTable.createdAt, since), sql`${searchLogsTable.city} is not null`))
    .groupBy(searchLogsTable.city)
    .orderBy(sql`count(*) desc`)
    .limit(20);

  const [totalStats] = await db.select({
    totalSearches: sql<number>`count(*)`,
    uniqueQueries: sql<number>`count(distinct ${searchLogsTable.query})`,
    uniqueUsers: sql<number>`count(distinct ${searchLogsTable.userId})`,
    zeroResultSearches: sql<number>`count(*) filter (where ${searchLogsTable.resultsCount} = 0)`,
  }).from(searchLogsTable)
    .where(gte(searchLogsTable.createdAt, since));

  const dailyVolume = await db.select({
    date: sql<string>`date(${searchLogsTable.createdAt})`,
    count: sql<number>`count(*)`,
  }).from(searchLogsTable)
    .where(gte(searchLogsTable.createdAt, since))
    .groupBy(sql`date(${searchLogsTable.createdAt})`)
    .orderBy(sql`date(${searchLogsTable.createdAt}) desc`)
    .limit(30);

  res.json({
    period: { days, since: since.toISOString() },
    stats: {
      totalSearches: Number(totalStats.totalSearches),
      uniqueQueries: Number(totalStats.uniqueQueries),
      uniqueUsers: Number(totalStats.uniqueUsers),
      zeroResultSearches: Number(totalStats.zeroResultSearches),
    },
    topSearches: topSearches.map(s => ({
      query: s.query,
      count: Number(s.count),
      avgResults: Math.round(Number(s.avgResults)),
      lastSearched: s.lastSearched,
    })),
    topCategories: topCategories.map(c => ({
      category: c.category,
      count: Number(c.count),
    })),
    topCities: topCities.map(c => ({
      city: c.city,
      count: Number(c.count),
    })),
    dailyVolume: dailyVolume.map(d => ({
      date: d.date,
      count: Number(d.count),
    })),
  });
});

router.delete("/admin/reviews/:reviewId", adminAuthMiddleware, async (req, res): Promise<void> => {
  const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
  await db.delete(reviewsTable).where(eq(reviewsTable.id, reviewId));
  res.sendStatus(204);
});

export default router;
