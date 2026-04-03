import { Router, type IRouter } from "express";
import { eq, and, inArray, desc } from "drizzle-orm";
import { db, savedPlacesTable, listingsTable, listingPhotosTable } from "@workspace/db";
import { authMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/saved", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const savedPlaces = await db.select({
    saved: savedPlacesTable,
    listing: listingsTable,
  }).from(savedPlacesTable)
    .leftJoin(listingsTable, eq(savedPlacesTable.listingId, listingsTable.id))
    .where(eq(savedPlacesTable.userId, userId))
    .orderBy(desc(savedPlacesTable.createdAt));

  const listingIds = savedPlaces.map(s => s.listing?.id).filter(Boolean) as string[];
  let coverPhotos: any[] = [];
  if (listingIds.length > 0) {
    coverPhotos = await db.select().from(listingPhotosTable).where(
      and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true))
    );
  }
  const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));

  res.json(savedPlaces.map(s => ({
    id: s.saved.id,
    userId: s.saved.userId,
    listingId: s.saved.listingId,
    listing: s.listing ? {
      id: s.listing.id,
      vendorId: s.listing.vendorId,
      name: s.listing.name,
      slug: s.listing.slug,
      category: s.listing.category,
      cuisineType: s.listing.cuisineType,
      diningStyle: s.listing.diningStyle,
      mealPeriod: s.listing.mealPeriod,
      priceRange: s.listing.priceRange,
      city: s.listing.city,
      area: s.listing.area,
      averageRating: s.listing.averageRating,
      totalReviews: s.listing.totalReviews,
      isFeatured: s.listing.isFeatured,
      isVerified: s.listing.isVerified,
      status: s.listing.status,
      coverPhoto: coverMap.get(s.listing.id) ?? null,
      phone: s.listing.phone,
      whatsapp: s.listing.whatsapp,
      acceptsReservations: s.listing.acceptsReservations,
      acceptsOrders: s.listing.acceptsOrders,
      openingHours: s.listing.openingHours,
      lat: s.listing.lat,
      lng: s.listing.lng,
      distance: null,
      createdAt: s.listing.createdAt.toISOString(),
    } : undefined,
    createdAt: s.saved.createdAt.toISOString(),
  })));
});

router.post("/saved/:listingId", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;

  const existing = await db.select().from(savedPlacesTable)
    .where(and(eq(savedPlacesTable.userId, userId), eq(savedPlacesTable.listingId, listingId)));
  if (existing.length > 0) {
    res.json({
      id: existing[0].id,
      userId: existing[0].userId,
      listingId: existing[0].listingId,
      createdAt: existing[0].createdAt.toISOString(),
    });
    return;
  }

  const [saved] = await db.insert(savedPlacesTable).values({ userId, listingId }).returning();
  res.status(201).json({
    id: saved.id,
    userId: saved.userId,
    listingId: saved.listingId,
    createdAt: saved.createdAt.toISOString(),
  });
});

router.delete("/saved/:listingId", authMiddleware, async (req, res): Promise<void> => {
  const userId = (req as any).user.id;
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;

  await db.delete(savedPlacesTable).where(
    and(eq(savedPlacesTable.userId, userId), eq(savedPlacesTable.listingId, listingId))
  );
  res.sendStatus(204);
});

export default router;
