import { Router, type IRouter, type Request, type Response } from "express";
import { Readable } from "stream";
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from "@workspace/api-zod";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { ObjectPermission } from "../lib/objectAcl";
import { authMiddleware } from "../lib/auth";
import { optimizeImage, isImageContentType, generateThumbnail } from "../lib/imageOptimizer";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

router.post("/storage/uploads/request-url", authMiddleware, async (req: Request, res: Response) => {
  const parsed = RequestUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Missing or invalid required fields" });
    return;
  }

  try {
    const { name, size, contentType } = parsed.data;

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    res.json(
      RequestUploadUrlResponse.parse({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      }),
    );
  } catch (error) {
    req.log.error({ err: error }, "Error generating upload URL");
    res.status(500).json({ error: "Failed to generate upload URL" });
  }
});

router.post("/storage/uploads/optimized", authMiddleware, async (req: Request, res: Response) => {
  try {
    const contentType = req.headers["content-type"] || "";
    if (!isImageContentType(contentType)) {
      res.status(400).json({ error: "Only image files can be optimized" });
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const rawBuffer = Buffer.concat(chunks);

    if (rawBuffer.length === 0) {
      res.status(400).json({ error: "No image data received" });
      return;
    }

    const maxWidth = parseInt(req.query.maxWidth as string) || 1920;
    const maxHeight = parseInt(req.query.maxHeight as string) || 1920;
    const quality = parseInt(req.query.quality as string) || 80;
    const format = (req.query.format as string) || "webp";

    const optimized = await optimizeImage(rawBuffer, {
      maxWidth,
      maxHeight,
      quality,
      format: format as "jpeg" | "webp" | "png",
    });

    const uploadURL = await objectStorageService.getObjectEntityUploadURL();
    const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

    const uploadRes = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": optimized.contentType },
      body: optimized.buffer,
    });

    if (!uploadRes.ok) {
      res.status(500).json({ error: "Failed to upload optimized image" });
      return;
    }

    let thumbnailPath: string | null = null;
    try {
      const thumb = await generateThumbnail(rawBuffer);
      const thumbUploadURL = await objectStorageService.getObjectEntityUploadURL();
      thumbnailPath = objectStorageService.normalizeObjectEntityPath(thumbUploadURL);
      await fetch(thumbUploadURL, {
        method: "PUT",
        headers: { "Content-Type": "image/webp" },
        body: thumb,
      });
    } catch (thumbErr) {
      req.log.warn({ err: thumbErr }, "Thumbnail generation failed, continuing without thumbnail");
    }

    res.json({
      objectPath,
      thumbnailPath,
      contentType: optimized.contentType,
      width: optimized.width,
      height: optimized.height,
      originalSize: rawBuffer.length,
      optimizedSize: optimized.buffer.length,
      savings: Math.round((1 - optimized.buffer.length / rawBuffer.length) * 100),
    });
  } catch (error) {
    req.log.error({ err: error }, "Error optimizing image");
    res.status(500).json({ error: "Failed to optimize image" });
  }
});

router.get("/storage/public-objects/*filePath", async (req: Request, res: Response) => {
  try {
    const raw = req.params.filePath;
    const filePath = Array.isArray(raw) ? raw.join("/") : raw;
    const file = await objectStorageService.searchPublicObject(filePath);
    if (!file) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const response = await objectStorageService.downloadObject(file);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    req.log.error({ err: error }, "Error serving public object");
    res.status(500).json({ error: "Failed to serve public object" });
  }
});

router.get("/storage/objects/*path", async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${wildcardPath}`;
    const objectFile = await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(response.body as ReadableStream<Uint8Array>);
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, "Object not found");
      res.status(404).json({ error: "Object not found" });
      return;
    }
    req.log.error({ err: error }, "Error serving object");
    res.status(500).json({ error: "Failed to serve object" });
  }
});

export default router;
