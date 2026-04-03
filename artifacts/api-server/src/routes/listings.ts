import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql, desc, asc, inArray, gte } from "drizzle-orm";
import { db, listingsTable, listingPhotosTable, ordersTable, reviewsTable, listingViewsTable } from "@workspace/db";
import crypto from "crypto";

const router: IRouter = Router();

function slugify(name: string, city: string): string {
  return `${name}-${city}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatListingCard(listing: any, coverPhoto?: string | null, distance?: number | null) {
  return {
    id: listing.id,
    vendorId: listing.vendorId,
    name: listing.name,
    slug: listing.slug,
    category: listing.category,
    cuisineType: listing.cuisineType,
    diningStyle: listing.diningStyle,
    mealPeriod: listing.mealPeriod,
    priceRange: listing.priceRange,
    city: listing.city,
    area: listing.area,
    averageRating: listing.averageRating,
    totalReviews: listing.totalReviews,
    isFeatured: listing.isFeatured,
    isVerified: listing.isVerified,
    status: listing.status,
    coverPhoto: coverPhoto ?? null,
    phone: listing.phone,
    whatsapp: listing.whatsapp,
    acceptsReservations: listing.acceptsReservations,
    acceptsOrders: listing.acceptsOrders,
    openingHours: listing.openingHours,
    lat: listing.lat,
    lng: listing.lng,
    distance: distance ?? null,
    createdAt: listing.createdAt.toISOString(),
  };
}

router.get("/listings", async (req, res): Promise<void> => {
  const {
    q, category, cuisine_type, meal_period, price_range,
    dining_style, city, area, features, occasion,
    open_now, accepts_reservations, accepts_orders,
    min_rating, sort, lat, lng,
    page: pageStr, limit: limitStr
  } = req.query;

  const page = parseInt(pageStr as string) || 1;
  const limit = Math.min(parseInt(limitStr as string) || 20, 50);
  const offset = (page - 1) * limit;

  const conditions: any[] = [eq(listingsTable.status, "active")];

  if (q) {
    const search = `%${q}%`;
    conditions.push(
      or(
        ilike(listingsTable.name, search),
        ilike(listingsTable.area, search),
        ilike(listingsTable.city, search),
        ilike(listingsTable.description, search),
      )
    );
  }
  if (category) conditions.push(eq(listingsTable.category, category as string));
  if (cuisine_type) {
    const cuisines = (cuisine_type as string).split(",");
    conditions.push(sql`${listingsTable.cuisineType} && ${cuisines}`);
  }
  if (meal_period) {
    const periods = (meal_period as string).split(",");
    conditions.push(sql`${listingsTable.mealPeriod} && ${periods}`);
  }
  if (price_range) conditions.push(eq(listingsTable.priceRange, price_range as string));
  if (dining_style) conditions.push(eq(listingsTable.diningStyle, dining_style as string));
  if (city) conditions.push(eq(listingsTable.city, city as string));
  if (area) conditions.push(eq(listingsTable.area, area as string));
  if (features) {
    const featureList = (features as string).split(",");
    conditions.push(sql`${listingsTable.features} @> ${featureList}`);
  }
  if (occasion) {
    const occasions = (occasion as string).split(",");
    conditions.push(sql`${listingsTable.occasions} && ARRAY[${sql.join(occasions.map(o => sql`${o}`), sql`, `)}]::text[]`);
  }
  if (accepts_reservations === "true") conditions.push(eq(listingsTable.acceptsReservations, true));
  if (accepts_orders === "true") conditions.push(eq(listingsTable.acceptsOrders, true));
  if (min_rating) conditions.push(sql`${listingsTable.averageRating} >= ${parseFloat(min_rating as string)}`);

  const whereClause = and(...conditions);

  let orderBy: any;
  switch (sort) {
    case "highest_rated": orderBy = desc(listingsTable.averageRating); break;
    case "most_reviewed": orderBy = desc(listingsTable.totalReviews); break;
    case "newest": orderBy = desc(listingsTable.createdAt); break;
    case "featured": orderBy = desc(listingsTable.isFeatured); break;
    case "price_low": orderBy = asc(listingsTable.priceRange); break;
    case "price_high": orderBy = desc(listingsTable.priceRange); break;
    default: orderBy = desc(listingsTable.isFeatured);
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(listingsTable).where(whereClause);
  const total = Number(countResult.count);

  const listings = await db.select().from(listingsTable).where(whereClause).orderBy(orderBy).limit(limit).offset(offset);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));

  const results = listings.map(l => formatListingCard(l, coverMap.get(l.id)));

  res.json({
    listings: results,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

router.get("/listings/featured", async (_req, res): Promise<void> => {
  const listings = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), eq(listingsTable.isFeatured, true)))
    .orderBy(desc(listingsTable.averageRating)).limit(10);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
  res.json(listings.map(l => formatListingCard(l, coverMap.get(l.id))));
});

router.get("/listings/recent", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const listings = await db.select().from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .orderBy(desc(listingsTable.createdAt)).limit(limit);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
  res.json(listings.map(l => formatListingCard(l, coverMap.get(l.id))));
});

router.get("/listings/top-rated", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const conditions: any[] = [eq(listingsTable.status, "active")];
  if (req.query.city) conditions.push(eq(listingsTable.city, req.query.city as string));

  const listings = await db.select().from(listingsTable)
    .where(and(...conditions))
    .orderBy(desc(listingsTable.averageRating)).limit(limit);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
  res.json(listings.map(l => formatListingCard(l, coverMap.get(l.id))));
});

router.get("/listings/hidden-gems", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const listings = await db.select().from(listingsTable)
    .where(and(
      eq(listingsTable.status, "active"),
      gte(listingsTable.averageRating, 4.0),
      sql`${listingsTable.totalReviews} <= 5`
    ))
    .orderBy(desc(listingsTable.averageRating))
    .limit(limit);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
  res.json(listings.map(l => formatListingCard(l, coverMap.get(l.id))));
});

router.get("/listings/autocomplete", async (req, res): Promise<void> => {
  const q = (req.query.q as string || "").trim();
  const limit = Math.min(parseInt(req.query.limit as string) || 8, 20);
  if (!q || q.length < 2) { res.json([]); return; }

  const search = `%${q}%`;
  const listings = await db.select({
    id: listingsTable.id,
    name: listingsTable.name,
    slug: listingsTable.slug,
    category: listingsTable.category,
    city: listingsTable.city,
    area: listingsTable.area,
  }).from(listingsTable)
    .where(and(
      eq(listingsTable.status, "active"),
      or(
        ilike(listingsTable.name, search),
        ilike(listingsTable.area, search),
        ilike(listingsTable.city, search),
        ilike(listingsTable.description, search),
      )
    ))
    .orderBy(desc(listingsTable.averageRating))
    .limit(limit);

  res.json(listings);
});

router.get("/listings/nearby", async (req, res): Promise<void> => {
  const lat = parseFloat(req.query.lat as string);
  const lng = parseFloat(req.query.lng as string);
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const radius = parseFloat(req.query.radius as string) || 5;

  if (isNaN(lat) || isNaN(lng)) {
    res.status(400).json({ error: "lat and lng are required" });
    return;
  }

  const listings = await db.select().from(listingsTable)
    .where(eq(listingsTable.status, "active"))
    .orderBy(desc(listingsTable.averageRating)).limit(limit);

  const listingIds = listings.map(l => l.id);
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));

  const results = listings.map(l => {
    const dist = Math.sqrt(Math.pow((l.lat - lat) * 111, 2) + Math.pow((l.lng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2));
    return formatListingCard(l, coverMap.get(l.id), Math.round(dist * 10) / 10);
  }).filter(l => (l.distance ?? 0) <= radius).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));

  res.json(results);
});

router.get("/listings/categories-count", async (req, res): Promise<void> => {
  const conditions: any[] = [eq(listingsTable.status, "active")];
  if (req.query.city) conditions.push(eq(listingsTable.city, req.query.city as string));

  const result = await db.select({
    category: listingsTable.category,
    count: sql<number>`count(*)`,
  }).from(listingsTable).where(and(...conditions)).groupBy(listingsTable.category);

  res.json(result.map(r => ({ category: r.category, count: Number(r.count) })));
});

router.get("/listings/cities-count", async (_req, res): Promise<void> => {
  const result = await db.select({
    city: listingsTable.city,
    count: sql<number>`count(*)`,
  }).from(listingsTable).where(eq(listingsTable.status, "active")).groupBy(listingsTable.city);

  res.json(result.map(r => ({ city: r.city, count: Number(r.count) })));
});

router.get("/listings/cuisines-count", async (req, res): Promise<void> => {
  const conditions: any[] = [eq(listingsTable.status, "active")];
  if (req.query.city) conditions.push(eq(listingsTable.city, req.query.city as string));

  const result = await db.select({
    cuisineType: sql<string>`unnest(${listingsTable.cuisineType})`,
    count: sql<number>`count(*)`,
  }).from(listingsTable).where(and(...conditions)).groupBy(sql`unnest(${listingsTable.cuisineType})`);

  res.json(result.map(r => ({ cuisineType: r.cuisineType, count: Number(r.count) })));
});

router.get("/listings/popular", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);

  const popularListings = await db.select({
    listingId: ordersTable.listingId,
    orderCount: sql<number>`count(*)`,
  }).from(ordersTable)
    .groupBy(ordersTable.listingId)
    .orderBy(sql`count(*) DESC`)
    .limit(limit);

  if (popularListings.length === 0) {
    const fallback = await db.select().from(listingsTable)
      .where(eq(listingsTable.status, "active"))
      .orderBy(desc(listingsTable.totalReviews))
      .limit(limit);
    const fallbackIds = fallback.map(l => l.id);
    let coverPhotos: any[] = [];
    if (fallbackIds.length > 0) {
      coverPhotos = await db.select().from(listingPhotosTable).where(
        and(inArray(listingPhotosTable.listingId, fallbackIds), eq(listingPhotosTable.isCover, true))
      );
    }
    const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
    res.json(fallback.map(l => formatListingCard(l, coverMap.get(l.id))));
    return;
  }

  const listingIds = popularListings.map(p => p.listingId);
  const listings = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), inArray(listingsTable.id, listingIds)));

  let coverPhotos: any[] = [];
  if (listings.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listings.map(l => l.id)), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
  const orderCountMap = new Map(popularListings.map(p => [p.listingId, Number(p.orderCount)]));

  const results = listings
    .map(l => ({ ...formatListingCard(l, coverMap.get(l.id)), orderCount: orderCountMap.get(l.id) || 0 }))
    .sort((a, b) => b.orderCount - a.orderCount);

  res.json(results);
});

router.get("/listings/trending", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const daysAgo = parseInt(req.query.days as string) || 14;
  const since = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const trendingListings = await db.select({
    listingId: reviewsTable.listingId,
    recentReviews: sql<number>`count(*)`,
    avgRating: sql<number>`avg(${reviewsTable.rating})`,
  }).from(reviewsTable)
    .where(sql`${reviewsTable.createdAt} >= ${since}`)
    .groupBy(reviewsTable.listingId)
    .orderBy(sql`count(*) DESC, avg(${reviewsTable.rating}) DESC`)
    .limit(limit);

  if (trendingListings.length === 0) {
    const fallback = await db.select().from(listingsTable)
      .where(eq(listingsTable.status, "active"))
      .orderBy(desc(listingsTable.averageRating))
      .limit(limit);
    const fallbackIds = fallback.map(l => l.id);
    let coverPhotos: any[] = [];
    if (fallbackIds.length > 0) {
      coverPhotos = await db.select().from(listingPhotosTable).where(
        and(inArray(listingPhotosTable.listingId, fallbackIds), eq(listingPhotosTable.isCover, true))
      );
    }
    const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
    res.json(fallback.map(l => formatListingCard(l, coverMap.get(l.id))));
    return;
  }

  const listingIds = trendingListings.map(t => t.listingId);
  const listings = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.status, "active"), inArray(listingsTable.id, listingIds)));

  let coverPhotos: any[] = [];
  if (listings.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listings.map(l => l.id)), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));

  const trendingMap = new Map(trendingListings.map(t => [t.listingId, Number(t.recentReviews)]));
  const results = listings
    .map(l => ({ ...formatListingCard(l, coverMap.get(l.id)), recentReviews: trendingMap.get(l.id) || 0 }))
    .sort((a, b) => b.recentReviews - a.recentReviews);

  res.json(results);
});

router.get("/listings/:slug", async (req, res): Promise<void> => {
  const rawSlug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [listing] = await db.select().from(listingsTable).where(eq(listingsTable.slug, rawSlug));

  if (!listing) {
    res.status(404).json({ error: "Listing not found" });
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
    metaTitle: listing.metaTitle || `${listing.name} — Menu, Contact & Hours | ChowHub`,
    metaDescription: listing.metaDescription || listing.description.substring(0, 160),
    status: listing.status,
    photos: photos.map(p => ({
      id: p.id,
      listingId: p.listingId,
      url: p.url,
      isCover: p.isCover,
      displayOrder: p.displayOrder,
    })),
    createdAt: listing.createdAt.toISOString(),
  });
});

router.post("/listings/:slug/view", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const [listing] = await db.select({ id: listingsTable.id }).from(listingsTable).where(eq(listingsTable.slug, slug));
  if (!listing) { res.status(404).json({ error: "Listing not found" }); return; }

  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
  const userId = (req as any).user?.id || null;
  const sessionId = req.body?.sessionId || null;

  await db.insert(listingViewsTable).values({
    listingId: listing.id,
    userId,
    sessionId,
    ipHash,
  });

  res.json({ ok: true });
});

router.get("/listings/:id/views", async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const days = parseInt(req.query.days as string) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [stats] = await db.select({
    totalViews: sql<number>`count(*)`,
    uniqueViews: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
    uniqueUsers: sql<number>`count(distinct ${listingViewsTable.userId})`,
  }).from(listingViewsTable)
    .where(and(eq(listingViewsTable.listingId, listingId), gte(listingViewsTable.createdAt, since)));

  const dailyViews = await db.select({
    date: sql<string>`date(${listingViewsTable.createdAt})`,
    views: sql<number>`count(*)`,
    uniqueViews: sql<number>`count(distinct ${listingViewsTable.ipHash})`,
  }).from(listingViewsTable)
    .where(and(eq(listingViewsTable.listingId, listingId), gte(listingViewsTable.createdAt, since)))
    .groupBy(sql`date(${listingViewsTable.createdAt})`)
    .orderBy(sql`date(${listingViewsTable.createdAt}) desc`)
    .limit(30);

  res.json({
    totalViews: Number(stats.totalViews),
    uniqueViews: Number(stats.uniqueViews),
    uniqueUsers: Number(stats.uniqueUsers),
    dailyViews: dailyViews.map(d => ({ date: d.date, views: Number(d.views), uniqueViews: Number(d.uniqueViews) })),
  });
});

router.get("/sitemap.xml", async (_req, res): Promise<void> => {
  const listings = await db.select({
    slug: listingsTable.slug,
    createdAt: listingsTable.createdAt,
  }).from(listingsTable).where(eq(listingsTable.status, "active"));

  const baseUrl = "https://chowhub.gh";
  const now = new Date().toISOString().split("T")[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${now}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>${baseUrl}/register</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

  for (const listing of listings) {
    const lastmod = listing.createdAt ? new Date(listing.createdAt).toISOString().split("T")[0] : now;
    xml += `
  <url>
    <loc>${baseUrl}/listings/${listing.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
  }

  xml += `
</urlset>`;

  res.header("Content-Type", "application/xml");
  res.send(xml);
});

export default router;
