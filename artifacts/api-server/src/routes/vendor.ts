import { Router, type IRouter } from "express";
import { eq, and, desc, sql, asc, gte } from "drizzle-orm";
import { db, listingsTable, listingPhotosTable, menuItemsTable, reservationsTable, ordersTable, reviewsTable, usersTable, listingViewsTable } from "@workspace/db";
import { vendorAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

function slugify(name: string, city: string): string {
  return `${name}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

router.get("/vendor/listing", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) {
    res.status(404).json({ error: "No listing found" });
    return;
  }

  const photos = await db.select().from(listingPhotosTable)
    .where(eq(listingPhotosTable.listingId, listing.id))
    .orderBy(asc(listingPhotosTable.displayOrder));

  res.json({
    id: listing.id,
    vendorId: listing.vendorId,
    name: listing.name,
    slug: listing.slug,
    description: listing.description,
    category: listing.category,
    cuisineType: listing.cuisineType,
    diningStyle: listing.diningStyle,
    mealPeriod: listing.mealPeriod,
    priceRange: listing.priceRange,
    city: listing.city,
    area: listing.area,
    neighbourhood: listing.neighbourhood,
    address: listing.address,
    landmark: listing.landmark,
    lat: listing.lat,
    lng: listing.lng,
    phone: listing.phone,
    whatsapp: listing.whatsapp,
    website: listing.website,
    instagram: listing.instagram,
    twitter: listing.twitter,
    facebook: listing.facebook,
    tiktok: listing.tiktok,
    openingHours: listing.openingHours,
    features: listing.features,
    dressCode: listing.dressCode,
    acceptsReservations: listing.acceptsReservations,
    acceptsOrders: listing.acceptsOrders,
    averageRating: listing.averageRating,
    totalReviews: listing.totalReviews,
    isFeatured: listing.isFeatured,
    isVerified: listing.isVerified,
    metaTitle: listing.metaTitle,
    metaDescription: listing.metaDescription,
    status: listing.status,
    photos: photos.map(p => ({ id: p.id, listingId: p.listingId, url: p.url, isCover: p.isCover, displayOrder: p.displayOrder })),
    createdAt: listing.createdAt.toISOString(),
  });
});

router.post("/vendor/listing", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const data = req.body;

  const slug = slugify(data.name, data.city);

  const [listing] = await db.insert(listingsTable).values({
    vendorId,
    name: data.name,
    slug,
    description: data.description,
    category: data.category,
    cuisineType: data.cuisineType,
    diningStyle: data.diningStyle,
    mealPeriod: data.mealPeriod,
    priceRange: data.priceRange,
    city: data.city,
    area: data.area,
    neighbourhood: data.neighbourhood || "",
    address: data.address,
    landmark: data.landmark || "",
    lat: data.lat || 0,
    lng: data.lng || 0,
    phone: data.phone,
    whatsapp: data.whatsapp,
    website: data.website,
    instagram: data.instagram,
    twitter: data.twitter,
    facebook: data.facebook,
    tiktok: data.tiktok,
    openingHours: data.openingHours,
    features: data.features || [],
    dressCode: data.dressCode || "casual",
    acceptsReservations: data.acceptsReservations || false,
    acceptsOrders: data.acceptsOrders || false,
    metaTitle: data.metaTitle || "",
    metaDescription: data.metaDescription || "",
  }).returning();

  res.status(201).json({
    ...listing,
    photos: [],
    createdAt: listing.createdAt.toISOString(),
  });
});

router.patch("/vendor/listing", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.update(listingsTable).set(req.body)
    .where(eq(listingsTable.vendorId, vendorId)).returning();

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  const photos = await db.select().from(listingPhotosTable)
    .where(eq(listingPhotosTable.listingId, listing.id));

  res.json({
    ...listing,
    photos: photos.map(p => ({ id: p.id, listingId: p.listingId, url: p.url, isCover: p.isCover, displayOrder: p.displayOrder })),
    createdAt: listing.createdAt.toISOString(),
  });
});

router.get("/vendor/photos", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.json([]); return; }
  const photos = await db.select().from(listingPhotosTable).where(eq(listingPhotosTable.listingId, listing.id)).orderBy(asc(listingPhotosTable.displayOrder));
  res.json(photos.map(p => ({ id: p.id, listingId: p.listingId, url: p.url, isCover: p.isCover, displayOrder: p.displayOrder })));
});

router.post("/vendor/photos", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.status(404).json({ error: "No listing found" }); return; }

  const [photo] = await db.insert(listingPhotosTable).values({
    listingId: listing.id,
    url: req.body.url,
    isCover: req.body.isCover || false,
    displayOrder: req.body.displayOrder || 0,
  }).returning();

  res.status(201).json({ id: photo.id, listingId: photo.listingId, url: photo.url, isCover: photo.isCover, displayOrder: photo.displayOrder });
});

router.delete("/vendor/photos/:photoId", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const photoId = Array.isArray(req.params.photoId) ? req.params.photoId[0] : req.params.photoId;
  await db.delete(listingPhotosTable).where(eq(listingPhotosTable.id, photoId));
  res.sendStatus(204);
});

router.get("/vendor/menu", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.json([]); return; }
  const items = await db.select().from(menuItemsTable).where(eq(menuItemsTable.listingId, listing.id));
  res.json(items.map(item => ({
    id: item.id, listingId: item.listingId, name: item.name, description: item.description,
    price: item.price, category: item.category, photoUrl: item.photoUrl, isAvailable: item.isAvailable, isPopular: item.isPopular,
  })));
});

router.post("/vendor/menu", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.status(404).json({ error: "No listing found" }); return; }

  const [item] = await db.insert(menuItemsTable).values({
    listingId: listing.id,
    name: req.body.name,
    description: req.body.description || "",
    price: req.body.price ?? null,
    category: req.body.category,
    photoUrl: req.body.photoUrl ?? null,
    isAvailable: req.body.isAvailable ?? true,
    isPopular: req.body.isPopular ?? false,
  }).returning();

  res.status(201).json({
    id: item.id, listingId: item.listingId, name: item.name, description: item.description,
    price: item.price, category: item.category, photoUrl: item.photoUrl, isAvailable: item.isAvailable, isPopular: item.isPopular,
  });
});

router.patch("/vendor/menu/:itemId", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const [item] = await db.update(menuItemsTable).set(req.body).where(eq(menuItemsTable.id, itemId)).returning();
  if (!item) { res.status(404).json({ error: "Item not found" }); return; }
  res.json({
    id: item.id, listingId: item.listingId, name: item.name, description: item.description,
    price: item.price, category: item.category, photoUrl: item.photoUrl, isAvailable: item.isAvailable, isPopular: item.isPopular,
  });
});

router.delete("/vendor/menu/:itemId", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  await db.delete(menuItemsTable).where(eq(menuItemsTable.id, itemId));
  res.sendStatus(204);
});

router.get("/vendor/reservations", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.json([]); return; }

  const conditions: any[] = [eq(reservationsTable.listingId, listing.id)];
  if (req.query.status) conditions.push(eq(reservationsTable.status, req.query.status as string));

  const reservations = await db.select({
    reservation: reservationsTable,
    userName: usersTable.name,
    userPhone: usersTable.phone,
  }).from(reservationsTable)
    .leftJoin(usersTable, eq(reservationsTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(reservationsTable.createdAt));

  res.json(reservations.map(r => ({
    id: r.reservation.id, listingId: r.reservation.listingId, userId: r.reservation.userId,
    date: r.reservation.date, time: r.reservation.time, partySize: r.reservation.partySize,
    occasion: r.reservation.occasion, specialRequests: r.reservation.specialRequests,
    status: r.reservation.status, listingName: listing.name,
    userName: r.userName ?? null, userPhone: r.userPhone ?? null,
    createdAt: r.reservation.createdAt.toISOString(),
  })));
});

router.patch("/vendor/reservations/:reservationId/status", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const reservationId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const [reservation] = await db.update(reservationsTable).set({ status: req.body.status })
    .where(eq(reservationsTable.id, reservationId)).returning();
  if (!reservation) { res.status(404).json({ error: "Reservation not found" }); return; }
  res.json({
    id: reservation.id, listingId: reservation.listingId, userId: reservation.userId,
    date: reservation.date, time: reservation.time, partySize: reservation.partySize,
    occasion: reservation.occasion, specialRequests: reservation.specialRequests,
    status: reservation.status, listingName: null, userName: null, userPhone: null,
    createdAt: reservation.createdAt.toISOString(),
  });
});

router.get("/vendor/orders", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.json([]); return; }

  const conditions: any[] = [eq(ordersTable.listingId, listing.id)];
  if (req.query.status) conditions.push(eq(ordersTable.status, req.query.status as string));

  const orders = await db.select({
    order: ordersTable,
    userName: usersTable.name,
    userPhone: usersTable.phone,
  }).from(ordersTable)
    .leftJoin(usersTable, eq(ordersTable.userId, usersTable.id))
    .where(and(...conditions))
    .orderBy(desc(ordersTable.createdAt));

  res.json(orders.map(o => ({
    id: o.order.id, listingId: o.order.listingId, userId: o.order.userId,
    items: o.order.items, orderType: o.order.orderType,
    deliveryAddress: o.order.deliveryAddress, note: o.order.note,
    status: o.order.status, listingName: listing.name,
    userName: o.userName ?? null, userPhone: o.userPhone ?? null,
    createdAt: o.order.createdAt.toISOString(),
  })));
});

router.patch("/vendor/orders/:orderId/status", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const orderId = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
  const [order] = await db.update(ordersTable).set({ status: req.body.status })
    .where(eq(ordersTable.id, orderId)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({
    id: order.id, listingId: order.listingId, userId: order.userId,
    items: order.items, orderType: order.orderType,
    deliveryAddress: order.deliveryAddress, note: order.note,
    status: order.status, listingName: null, userName: null, userPhone: null,
    createdAt: order.createdAt.toISOString(),
  });
});

router.get("/vendor/reviews", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) { res.json([]); return; }

  const reviews = await db.select({
    review: reviewsTable,
    userName: usersTable.name,
  }).from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.listingId, listing.id))
    .orderBy(desc(reviewsTable.createdAt));

  res.json(reviews.map(r => ({
    id: r.review.id, listingId: r.review.listingId, userId: r.review.userId,
    rating: r.review.rating, foodRating: r.review.foodRating, serviceRating: r.review.serviceRating,
    ambienceRating: r.review.ambienceRating, valueRating: r.review.valueRating,
    comment: r.review.comment, visitedFor: r.review.visitedFor,
    userName: r.userName ?? null, listingName: listing.name,
    createdAt: r.review.createdAt.toISOString(),
  })));
});

router.get("/vendor/stats", vendorAuthMiddleware, async (req, res): Promise<void> => {
  const vendorId = (req as any).user.id;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.vendorId, vendorId));
  if (!listing) {
    res.json({
      totalReservationsToday: 0, totalOrdersToday: 0, pendingReservations: 0, pendingOrders: 0,
      averageRating: 0, totalReviews: 0, profileViews: 0, uniqueProfileViews: 0,
      totalOrders: 0, totalReservations: 0, viewsThisWeek: 0, viewsThisMonth: 0,
      ordersThisWeek: 0, ordersThisMonth: 0, dailyViews: [], dailyOrders: [],
    });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [reservationStats] = await db.select({
    todayCount: sql<number>`count(*) filter (where ${reservationsTable.date} = ${today})`,
    pendingCount: sql<number>`count(*) filter (where ${reservationsTable.status} = 'pending')`,
    totalCount: sql<number>`count(*)`,
  }).from(reservationsTable).where(eq(reservationsTable.listingId, listing.id));

  const [orderStats] = await db.select({
    todayCount: sql<number>`count(*) filter (where ${ordersTable.createdAt}::date = current_date)`,
    pendingCount: sql<number>`count(*) filter (where ${ordersTable.status} = 'pending')`,
    totalCount: sql<number>`count(*)`,
    weekCount: sql<number>`count(*) filter (where ${ordersTable.createdAt} >= ${weekAgo})`,
    monthCount: sql<number>`count(*) filter (where ${ordersTable.createdAt} >= ${monthAgo})`,
  }).from(ordersTable).where(eq(ordersTable.listingId, listing.id));

  const [viewStats] = await db.select({
    totalViews: sql<number>`count(*)`,
    uniqueViews: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
    weekViews: sql<number>`count(*) filter (where ${listingViewsTable.createdAt} >= ${weekAgo})`,
    monthViews: sql<number>`count(*) filter (where ${listingViewsTable.createdAt} >= ${monthAgo})`,
  }).from(listingViewsTable).where(eq(listingViewsTable.listingId, listing.id));

  const dailyViews = await db.select({
    date: sql<string>`date(${listingViewsTable.createdAt})`,
    views: sql<number>`count(*)`,
    uniqueViews: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
  }).from(listingViewsTable)
    .where(and(eq(listingViewsTable.listingId, listing.id), gte(listingViewsTable.createdAt, monthAgo)))
    .groupBy(sql`date(${listingViewsTable.createdAt})`)
    .orderBy(sql`date(${listingViewsTable.createdAt}) asc`)
    .limit(30);

  const dailyOrders = await db.select({
    date: sql<string>`date(${ordersTable.createdAt})`,
    count: sql<number>`count(*)`,
  }).from(ordersTable)
    .where(and(eq(ordersTable.listingId, listing.id), gte(ordersTable.createdAt, monthAgo)))
    .groupBy(sql`date(${ordersTable.createdAt})`)
    .orderBy(sql`date(${ordersTable.createdAt}) asc`)
    .limit(30);

  res.json({
    totalReservationsToday: Number(reservationStats.todayCount),
    totalOrdersToday: Number(orderStats.todayCount),
    pendingReservations: Number(reservationStats.pendingCount),
    pendingOrders: Number(orderStats.pendingCount),
    averageRating: listing.averageRating,
    totalReviews: listing.totalReviews,
    profileViews: Number(viewStats.totalViews),
    uniqueProfileViews: Number(viewStats.uniqueViews),
    totalOrders: Number(orderStats.totalCount),
    totalReservations: Number(reservationStats.totalCount),
    viewsThisWeek: Number(viewStats.weekViews),
    viewsThisMonth: Number(viewStats.monthViews),
    ordersThisWeek: Number(orderStats.weekCount),
    ordersThisMonth: Number(orderStats.monthCount),
    dailyViews: dailyViews.map(d => ({ date: d.date, views: Number(d.views), uniqueViews: Number(d.uniqueViews) })),
    dailyOrders: dailyOrders.map(d => ({ date: d.date, count: Number(d.count) })),
  });
});

export default router;
