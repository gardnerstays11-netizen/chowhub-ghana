import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, partnersTable } from "@workspace/db";
import { adminAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/partners", async (_req, res): Promise<void> => {
  const partners = await db
    .select()
    .from(partnersTable)
    .where(eq(partnersTable.active, true))
    .orderBy(asc(partnersTable.sortOrder));

  res.json(
    partners.map((p) => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      website: p.website,
      sortOrder: p.sortOrder,
    }))
  );
});

router.get("/admin/partners", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const partners = await db
    .select()
    .from(partnersTable)
    .orderBy(asc(partnersTable.sortOrder));

  res.json(
    partners.map((p) => ({
      id: p.id,
      name: p.name,
      logoUrl: p.logoUrl,
      website: p.website,
      sortOrder: p.sortOrder,
      active: p.active,
      createdAt: p.createdAt.toISOString(),
    }))
  );
});

router.post("/admin/partners", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { name, logoUrl, website, sortOrder } = req.body;
  if (!name || !logoUrl) {
    res.status(400).json({ error: "name and logoUrl are required" });
    return;
  }

  const [partner] = await db
    .insert(partnersTable)
    .values({
      name,
      logoUrl,
      website: website || null,
      sortOrder: sortOrder || 0,
    })
    .returning();

  res.status(201).json({
    id: partner.id,
    name: partner.name,
    logoUrl: partner.logoUrl,
    website: partner.website,
    sortOrder: partner.sortOrder,
    active: partner.active,
    createdAt: partner.createdAt.toISOString(),
  });
});

router.put("/admin/partners/:partnerId", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { partnerId } = req.params;
  const { name, logoUrl, website, sortOrder, active } = req.body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl;
  if (website !== undefined) updates.website = website;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (active !== undefined) updates.active = active;

  const [updated] = await db
    .update(partnersTable)
    .set(updates)
    .where(eq(partnersTable.id, partnerId as string))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Partner not found" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    logoUrl: updated.logoUrl,
    website: updated.website,
    sortOrder: updated.sortOrder,
    active: updated.active,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.delete("/admin/partners/:partnerId", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { partnerId } = req.params;
  await db.delete(partnersTable).where(eq(partnersTable.id, partnerId as string));
  res.status(204).end();
});

export default router;
