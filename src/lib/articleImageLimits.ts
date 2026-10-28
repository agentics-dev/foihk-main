export const MAX_ARTICLE_IMAGES = 10;
export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

type AllowedImageKind = "jpeg" | "png" | "webp";

export const validateArticleImageCount = (existing: number, pending: number) =>
  existing + pending > MAX_ARTICLE_IMAGES ? `You can upload a maximum of ${MAX_ARTICLE_IMAGES} images` : null;

const detectImageSignature = async (file: File): Promise<AllowedImageKind | null> => {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
    && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a;
  const isWebp = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  if (isJpeg) return "jpeg";
  if (isPng) return "png";
  if (isWebp) return "webp";
  return null;
};

export const validateArticleImageFile = async (file: File): Promise<string | null> => {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  const expectedKind = extension === "jpg" ? "jpeg" : extension as AllowedImageKind;
  if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
    return `${file.name}: only JPEG, PNG, and WebP files are allowed`;
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `${file.name}: the file type is not JPEG, PNG, or WebP`;
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `${file.name}: each image must be 10MB or smaller`;
  }
  const signatureKind = await detectImageSignature(file);
  if (!signatureKind) {
    return `${file.name}: the file contents do not match JPEG, PNG, or WebP`;
  }
  if (signatureKind !== expectedKind || file.type !== `image/${signatureKind}`) {
    return `${file.name}: extension, MIME type, and file contents must match`;
  }
  return null;
};
