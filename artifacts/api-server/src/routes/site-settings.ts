import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/site-settings", async (_req, res): Promise<void> => {
  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

router.put("/admin/site-settings", async (req, res): Promise<void> => {
  const updates = req.body;
  if (!updates || typeof updates !== "object") {
    res.status(400).json({ error: "Request body must be an object of key-value pairs" });
    return;
  }

  const allowedKeys = [
    "site_name", "site_tagline", "site_description",
    "site_logo_url", "site_favicon_url",
    "meta_title", "meta_description", "meta_keywords", "og_image_url",
    "google_analytics_id", "facebook_pixel_id", "google_tag_manager_id", "hotjar_id",
    "social_twitter", "social_instagram", "social_facebook", "social_tiktok", "social_youtube",
    "contact_email", "contact_phone",
    "footer_text", "custom_head_scripts",
    "primary_color", "secondary_color",
  ];

  const entries = Object.entries(updates).filter(([key]) => allowedKeys.includes(key));

  for (const [key, value] of entries) {
    await db.insert(siteSettingsTable)
      .values({ key, value: String(value), updatedAt: new Date() })
      .onConflictDoUpdate({ target: siteSettingsTable.key, set: { value: String(value), updatedAt: new Date() } });
  }

  const settings = await db.select().from(siteSettingsTable);
  const result: Record<string, string> = {};
  for (const s of settings) {
    result[s.key] = s.value;
  }
  res.json(result);
});

export default router;
