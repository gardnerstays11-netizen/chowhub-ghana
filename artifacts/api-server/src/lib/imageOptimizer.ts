import sharp from "sharp";

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "jpeg" | "webp" | "png";
}

const defaults: OptimizeOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 80,
  format: "webp",
};

export async function optimizeImage(
  buffer: Buffer,
  options: OptimizeOptions = {}
): Promise<{ buffer: Buffer; contentType: string; width: number; height: number }> {
  const opts = { ...defaults, ...options };

  let pipeline = sharp(buffer).rotate();

  const metadata = await sharp(buffer).metadata();
  const origWidth = metadata.width || 0;
  const origHeight = metadata.height || 0;

  if (origWidth > (opts.maxWidth || 1920) || origHeight > (opts.maxHeight || 1920)) {
    pipeline = pipeline.resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  let contentType = "image/webp";
  switch (opts.format) {
    case "jpeg":
      pipeline = pipeline.jpeg({ quality: opts.quality, mozjpeg: true });
      contentType = "image/jpeg";
      break;
    case "png":
      pipeline = pipeline.png({ quality: opts.quality });
      contentType = "image/png";
      break;
    case "webp":
    default:
      pipeline = pipeline.webp({ quality: opts.quality });
      contentType = "image/webp";
      break;
  }

  const result = await pipeline.toBuffer({ resolveWithObject: true });

  return {
    buffer: result.data,
    contentType,
    width: result.info.width,
    height: result.info.height,
  };
}

export function isImageContentType(contentType: string): boolean {
  return /^image\/(jpeg|jpg|png|webp|gif|bmp|tiff)$/i.test(contentType);
}

export async function generateThumbnail(
  buffer: Buffer,
  size: number = 400
): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize(size, size, { fit: "cover" })
    .webp({ quality: 70 })
    .toBuffer();
}
