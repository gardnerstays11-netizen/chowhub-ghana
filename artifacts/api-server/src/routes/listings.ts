import { Router, type IRouter } from "express";
import { eq, and, ilike, or, sql, desc, asc, inArray } from "drizzle-orm";
import { db, listingsTable, listingPhotosTable } from "@workspace/db";

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
    dining_style, city, area, features,
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

export default router;
