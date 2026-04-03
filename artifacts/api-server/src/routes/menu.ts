import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/listings/:listingId/menu", async (req, res): Promise<void> => {
  const listingId = Array.isArray(req.params.listingId) ? req.params.listingId[0] : req.params.listingId;
  const items = await db.select().from(menuItemsTable).where(eq(menuItemsTable.listingId, listingId));
  res.json(items.map(item => ({
    id: item.id,
    listingId: item.listingId,
    name: item.name,
    description: item.description,
    price: item.price,
    category: item.category,
    photoUrl: item.photoUrl,
    isAvailable: item.isAvailable,
    isPopular: item.isPopular,
  })));
});

export default router;
