import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray, gte, asc } from "drizzle-orm";
import { db, usersTable, vendorsTable, listingsTable, listingPhotosTable, reviewsTable, reservationsTable, ordersTable, searchLogsTable, subscriptionPackagesTable, listingViewsTable } from "@workspace/db";
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

router.get("/subscription-packages", async (_req, res): Promise<void> => {
  const packages = await db.select().from(subscriptionPackagesTable).orderBy(asc(subscriptionPackagesTable.sortOrder));
  res.json(packages.filter(p => p.isActive).map(p => ({
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    price: p.price, billingCycle: p.billingCycle,
    maxPhotos: p.maxPhotos, maxMenuItems: p.maxMenuItems,
    isFeaturedIncluded: p.isFeaturedIncluded, prioritySupport: p.prioritySupport,
    analyticsAccess: p.analyticsAccess,
  })));
});

router.get("/admin/subscription-packages", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const packages = await db.select().from(subscriptionPackagesTable).orderBy(asc(subscriptionPackagesTable.sortOrder));
  res.json(packages.map(p => ({
    id: p.id, name: p.name, slug: p.slug, description: p.description,
    price: p.price, billingCycle: p.billingCycle, features: p.features,
    maxPhotos: p.maxPhotos, maxMenuItems: p.maxMenuItems,
    isFeaturedIncluded: p.isFeaturedIncluded, prioritySupport: p.prioritySupport,
    analyticsAccess: p.analyticsAccess, sortOrder: p.sortOrder, isActive: p.isActive,
    createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString(),
  })));
});

router.post("/admin/subscription-packages", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { name, slug, description, price, billingCycle, features, maxPhotos, maxMenuItems, isFeaturedIncluded, prioritySupport, analyticsAccess, sortOrder, isActive } = req.body;
  const [pkg] = await db.insert(subscriptionPackagesTable).values({
    name, slug, description, price: parseFloat(price), billingCycle,
    features: features || [], maxPhotos: maxPhotos || 5, maxMenuItems: maxMenuItems || 20,
    isFeaturedIncluded: isFeaturedIncluded || false, prioritySupport: prioritySupport || false,
    analyticsAccess: analyticsAccess || "basic", sortOrder: sortOrder || 0, isActive: isActive !== false,
  }).returning();

  res.status(201).json({
    id: pkg.id, name: pkg.name, slug: pkg.slug, description: pkg.description,
    price: pkg.price, billingCycle: pkg.billingCycle, features: pkg.features,
    maxPhotos: pkg.maxPhotos, maxMenuItems: pkg.maxMenuItems,
    isFeaturedIncluded: pkg.isFeaturedIncluded, prioritySupport: pkg.prioritySupport,
    analyticsAccess: pkg.analyticsAccess, sortOrder: pkg.sortOrder, isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(), updatedAt: pkg.updatedAt.toISOString(),
  });
});

router.put("/admin/subscription-packages/:packageId", adminAuthMiddleware, async (req, res): Promise<void> => {
  const packageId = Array.isArray(req.params.packageId) ? req.params.packageId[0] : req.params.packageId;
  const { name, slug, description, price, billingCycle, features, maxPhotos, maxMenuItems, isFeaturedIncluded, prioritySupport, analyticsAccess, sortOrder, isActive } = req.body;

  const updateData: any = { updatedAt: new Date() };
  if (name !== undefined) updateData.name = name;
  if (slug !== undefined) updateData.slug = slug;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (billingCycle !== undefined) updateData.billingCycle = billingCycle;
  if (features !== undefined) updateData.features = features;
  if (maxPhotos !== undefined) updateData.maxPhotos = maxPhotos;
  if (maxMenuItems !== undefined) updateData.maxMenuItems = maxMenuItems;
  if (isFeaturedIncluded !== undefined) updateData.isFeaturedIncluded = isFeaturedIncluded;
  if (prioritySupport !== undefined) updateData.prioritySupport = prioritySupport;
  if (analyticsAccess !== undefined) updateData.analyticsAccess = analyticsAccess;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
  if (isActive !== undefined) updateData.isActive = isActive;

  const [pkg] = await db.update(subscriptionPackagesTable).set(updateData).where(eq(subscriptionPackagesTable.id, packageId)).returning();
  if (!pkg) { res.status(404).json({ error: "Package not found" }); return; }

  res.json({
    id: pkg.id, name: pkg.name, slug: pkg.slug, description: pkg.description,
    price: pkg.price, billingCycle: pkg.billingCycle, features: pkg.features,
    maxPhotos: pkg.maxPhotos, maxMenuItems: pkg.maxMenuItems,
    isFeaturedIncluded: pkg.isFeaturedIncluded, prioritySupport: pkg.prioritySupport,
    analyticsAccess: pkg.analyticsAccess, sortOrder: pkg.sortOrder, isActive: pkg.isActive,
    createdAt: pkg.createdAt.toISOString(), updatedAt: pkg.updatedAt.toISOString(),
  });
});

router.delete("/admin/subscription-packages/:packageId", adminAuthMiddleware, async (req, res): Promise<void> => {
  const packageId = Array.isArray(req.params.packageId) ? req.params.packageId[0] : req.params.packageId;
  await db.delete(subscriptionPackagesTable).where(eq(subscriptionPackagesTable.id, packageId));
  res.sendStatus(204);
});

router.get("/admin/platform-analytics", adminAuthMiddleware, async (req, res): Promise<void> => {
  const days = parseInt(req.query.days as string) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [viewStats] = await db.select({
    totalViews: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
  }).from(listingViewsTable)
    .where(gte(listingViewsTable.createdAt, since));

  const dailyPageViews = await db.select({
    date: sql<string>`date(${listingViewsTable.createdAt})`,
    views: sql<number>`count(*)`,
    uniqueVisitors: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
  }).from(listingViewsTable)
    .where(gte(listingViewsTable.createdAt, since))
    .groupBy(sql`date(${listingViewsTable.createdAt})`)
    .orderBy(sql`date(${listingViewsTable.createdAt}) asc`)
    .limit(30);

  const topListings = await db.select({
    listingId: listingViewsTable.listingId,
    listingName: listingsTable.name,
    views: sql<number>`count(*)`,
    uniqueViews: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
  }).from(listingViewsTable)
    .leftJoin(listingsTable, eq(listingViewsTable.listingId, listingsTable.id))
    .where(gte(listingViewsTable.createdAt, since))
    .groupBy(listingViewsTable.listingId, listingsTable.name)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  const [orderStats] = await db.select({
    totalOrders: sql<number>`count(*)`,
    recentOrders: sql<number>`count(*) filter (where ${ordersTable.createdAt} >= ${since})`,
  }).from(ordersTable);

  res.json({
    period: { days, since: since.toISOString() },
    views: {
      total: Number(viewStats.totalViews),
      uniqueVisitors: Number(viewStats.uniqueVisitors),
    },
    orders: {
      total: Number(orderStats.totalOrders),
      recent: Number(orderStats.recentOrders),
    },
    dailyPageViews: dailyPageViews.map(d => ({
      date: d.date, views: Number(d.views), uniqueVisitors: Number(d.uniqueVisitors),
    })),
    topListings: topListings.map(l => ({
      listingId: l.listingId, listingName: l.listingName,
      views: Number(l.views), uniqueViews: Number(l.uniqueViews),
    })),
  });
});

export default router;
