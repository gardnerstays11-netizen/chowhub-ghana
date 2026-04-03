import { Router, type IRouter } from "express";
import { eq, and, desc, asc, sql, inArray } from "drizzle-orm";
import { db, vendorEventsTable, listingsTable, listingPhotosTable, vendorsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/events/upcoming", async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 20);
  const now = new Date();

  const events = await db.select({
    id: vendorEventsTable.id,
    title: vendorEventsTable.title,
    description: vendorEventsTable.description,
    eventDate: vendorEventsTable.eventDate,
    endDate: vendorEventsTable.endDate,
    imageUrl: vendorEventsTable.imageUrl,
    category: vendorEventsTable.category,
    listingId: vendorEventsTable.listingId,
    listingName: listingsTable.name,
    listingSlug: listingsTable.slug,
    listingCity: listingsTable.city,
    listingArea: listingsTable.area,
  }).from(vendorEventsTable)
    .innerJoin(listingsTable, eq(vendorEventsTable.listingId, listingsTable.id))
    .where(and(
      eq(vendorEventsTable.active, true),
      sql`${vendorEventsTable.eventDate} >= ${now}`
    ))
    .orderBy(asc(vendorEventsTable.eventDate))
    .limit(limit);

  res.json(events.map(e => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
    endDate: e.endDate?.toISOString() || null,
  })));
});

router.get("/vendor/events", async (req, res): Promise<void> => {
  const vendorId = (req as any).vendorId;
  if (!vendorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const events = await db.select().from(vendorEventsTable)
    .where(eq(vendorEventsTable.vendorId, vendorId))
    .orderBy(desc(vendorEventsTable.eventDate));

  res.json(events.map(e => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
    endDate: e.endDate?.toISOString() || null,
    createdAt: e.createdAt.toISOString(),
  })));
});

router.post("/vendor/events", async (req, res): Promise<void> => {
  const vendorId = (req as any).vendorId;
  if (!vendorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { listingId, title, description, eventDate, endDate, imageUrl, category } = req.body;
  if (!listingId || !title || !eventDate) {
    res.status(400).json({ error: "listingId, title, and eventDate are required" });
    return;
  }

  const [listing] = await db.select().from(listingsTable)
    .where(and(eq(listingsTable.id, listingId), eq(listingsTable.vendorId, vendorId)));
  if (!listing) {
    res.status(403).json({ error: "Listing not found or not owned by vendor" });
    return;
  }

  const [event] = await db.insert(vendorEventsTable).values({
    listingId,
    vendorId,
    title,
    description: description || "",
    eventDate: new Date(eventDate),
    endDate: endDate ? new Date(endDate) : null,
    imageUrl: imageUrl || null,
    category: category || "general",
  }).returning();

  res.status(201).json({
    ...event,
    eventDate: event.eventDate.toISOString(),
    endDate: event.endDate?.toISOString() || null,
    createdAt: event.createdAt.toISOString(),
  });
});

router.put("/vendor/events/:id", async (req, res): Promise<void> => {
  const vendorId = (req as any).vendorId;
  if (!vendorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [existing] = await db.select().from(vendorEventsTable)
    .where(and(eq(vendorEventsTable.id, req.params.id), eq(vendorEventsTable.vendorId, vendorId)));
  if (!existing) { res.status(404).json({ error: "Event not found" }); return; }

  const updates: any = {};
  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.eventDate !== undefined) updates.eventDate = new Date(req.body.eventDate);
  if (req.body.endDate !== undefined) updates.endDate = req.body.endDate ? new Date(req.body.endDate) : null;
  if (req.body.imageUrl !== undefined) updates.imageUrl = req.body.imageUrl;
  if (req.body.category !== undefined) updates.category = req.body.category;
  if (req.body.active !== undefined) updates.active = req.body.active;

  const [updated] = await db.update(vendorEventsTable).set(updates)
    .where(eq(vendorEventsTable.id, req.params.id)).returning();

  res.json({
    ...updated,
    eventDate: updated.eventDate.toISOString(),
    endDate: updated.endDate?.toISOString() || null,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/vendor/events/:id", async (req, res): Promise<void> => {
  const vendorId = (req as any).vendorId;
  if (!vendorId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const [existing] = await db.select().from(vendorEventsTable)
    .where(and(eq(vendorEventsTable.id, req.params.id), eq(vendorEventsTable.vendorId, vendorId)));
  if (!existing) { res.status(404).json({ error: "Event not found" }); return; }

  await db.delete(vendorEventsTable).where(eq(vendorEventsTable.id, req.params.id));
  res.json({ success: true });
});

router.get("/admin/events", async (req, res): Promise<void> => {
  const events = await db.select({
    id: vendorEventsTable.id,
    title: vendorEventsTable.title,
    description: vendorEventsTable.description,
    eventDate: vendorEventsTable.eventDate,
    endDate: vendorEventsTable.endDate,
    imageUrl: vendorEventsTable.imageUrl,
    category: vendorEventsTable.category,
    active: vendorEventsTable.active,
    listingId: vendorEventsTable.listingId,
    vendorId: vendorEventsTable.vendorId,
    listingName: listingsTable.name,
    listingSlug: listingsTable.slug,
    createdAt: vendorEventsTable.createdAt,
  }).from(vendorEventsTable)
    .innerJoin(listingsTable, eq(vendorEventsTable.listingId, listingsTable.id))
    .orderBy(desc(vendorEventsTable.eventDate));

  res.json(events.map(e => ({
    ...e,
    eventDate: e.eventDate.toISOString(),
    endDate: e.endDate?.toISOString() || null,
    createdAt: e.createdAt.toISOString(),
  })));
});

export default router;
