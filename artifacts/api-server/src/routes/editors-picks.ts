import { Router, type IRouter } from "express";
import { eq, asc, inArray, and } from "drizzle-orm";
import { db, editorsPicksTable, listingsTable, listingPhotosTable } from "@workspace/db";
import { adminAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/editors-picks", async (_req, res): Promise<void> => {
  const picks = await db
    .select()
    .from(editorsPicksTable)
    .where(eq(editorsPicksTable.active, true))
    .orderBy(asc(editorsPicksTable.sortOrder));

  const results = [];
  for (const pick of picks) {
    const listingIds = (pick.listingIds as string[]) || [];
    let listings: any[] = [];
    if (listingIds.length > 0) {
      const rawListings = await db.select().from(listingsTable)
        .where(and(eq(listingsTable.status, "active"), inArray(listingsTable.id, listingIds)));
      const coverPhotos = await db.select().from(listingPhotosTable)
        .where(and(inArray(listingPhotosTable.listingId, listingIds), eq(listingPhotosTable.isCover, true)));
      const coverMap = new Map(coverPhotos.map(p => [p.listingId, p.url]));
      listings = rawListings.map(l => ({
        id: l.id, name: l.name, slug: l.slug, category: l.category,
        city: l.city, area: l.area, averageRating: l.averageRating,
        totalReviews: l.totalReviews, priceRange: l.priceRange,
        coverPhoto: coverMap.get(l.id) ?? null,
        cuisineType: l.cuisineType,
      }));
    }
    results.push({
      id: pick.id, title: pick.title, slug: pick.slug,
      description: pick.description, coverImage: pick.coverImage,
      listings, listingCount: listings.length,
    });
  }
  res.json(results);
});

router.get("/admin/editors-picks", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const picks = await db.select().from(editorsPicksTable)
    .orderBy(asc(editorsPicksTable.sortOrder));
  res.json(picks.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  })));
});

router.post("/admin/editors-picks", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { title, slug, description, coverImage, listingIds, sortOrder, active } = req.body;
  if (!title || !slug) {
    res.status(400).json({ error: "Title and slug are required" });
    return;
  }
  try {
    const [pick] = await db.insert(editorsPicksTable).values({
      title,
      slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
      description: description || "",
      coverImage: coverImage || "",
      listingIds: listingIds || [],
      sortOrder: sortOrder ?? 0,
      active: active ?? true,
    }).returning();
    res.status(201).json(pick);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A pick with this slug already exists" });
      return;
    }
    res.status(400).json({ error: "Failed to create editor's pick" });
  }
});

router.put("/admin/editors-picks/:id", adminAuthMiddleware, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { title, slug, description, coverImage, listingIds, sortOrder, active } = req.body;
  const updates: Record<string, any> = {};
  if (title !== undefined) updates.title = title;
  if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  if (description !== undefined) updates.description = description;
  if (coverImage !== undefined) updates.coverImage = coverImage;
  if (listingIds !== undefined) updates.listingIds = listingIds;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (active !== undefined) updates.active = active;

  try {
    const [updated] = await db.update(editorsPicksTable).set(updates)
      .where(eq(editorsPicksTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Editor's pick not found" }); return; }
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A pick with this slug already exists" });
      return;
    }
    res.status(400).json({ error: "Failed to update editor's pick" });
  }
});

router.delete("/admin/editors-picks/:id", adminAuthMiddleware, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db.delete(editorsPicksTable).where(eq(editorsPicksTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Editor's pick not found" }); return; }
  res.json({ success: true });
});

export default router;
