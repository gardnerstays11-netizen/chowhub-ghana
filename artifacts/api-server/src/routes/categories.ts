import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import { adminAuthMiddleware } from "../lib/auth";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.active, true))
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));

  res.json(categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    sortOrder: c.sortOrder,
    active: c.active,
  })));
});

router.get("/admin/categories", adminAuthMiddleware, async (_req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sortOrder), asc(categoriesTable.name));

  res.json(categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    sortOrder: c.sortOrder,
    active: c.active,
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/admin/categories", adminAuthMiddleware, async (req, res): Promise<void> => {
  const { name, slug, icon, sortOrder, active } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: "Name and slug are required" });
    return;
  }

  try {
    const [category] = await db.insert(categoriesTable).values({
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9_-]/g, "_"),
      icon: icon || "utensils",
      sortOrder: sortOrder ?? 0,
      active: active ?? true,
    }).returning();

    res.status(201).json(category);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A category with this slug already exists" });
      return;
    }
    res.status(400).json({ error: "Failed to create category" });
  }
});

router.put("/admin/categories/:id", adminAuthMiddleware, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { name, slug, icon, sortOrder, active } = req.body;

  const updates: Record<string, any> = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  if (icon !== undefined) updates.icon = icon;
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;
  if (active !== undefined) updates.active = active;

  try {
    const [updated] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
    if (!updated) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(updated);
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "A category with this slug already exists" });
      return;
    }
    res.status(400).json({ error: "Failed to update category" });
  }
});

router.delete("/admin/categories/:id", adminAuthMiddleware, async (req, res): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json({ success: true });
});

export default router;
