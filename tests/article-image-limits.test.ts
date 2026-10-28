import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_IMAGE_SIZE_BYTES, validateArticleImageCount, validateArticleImageFile } from "../src/lib/articleImageLimits.ts";

const jpeg = (size: number, name = "photo.jpg", type = "image/jpeg") =>
  new File([new Uint8Array([0xff, 0xd8, 0xff]), new Uint8Array(size - 3)], name, { type });

test("accepts exactly 10 MiB and rejects one byte more", async () => {
  assert.equal(await validateArticleImageFile(jpeg(MAX_IMAGE_SIZE_BYTES)), null);
  assert.match(await validateArticleImageFile(jpeg(MAX_IMAGE_SIZE_BYTES + 1)) || "", /10MB or smaller/);
});

test("checks file type, extension, and content before upload", async () => {
  assert.match(await validateArticleImageFile(jpeg(12, "photo.gif")) || "", /only JPEG/);
  assert.match(await validateArticleImageFile(jpeg(12, "photo.jpg", "image/png")) || "", /must match/);
  assert.match(await validateArticleImageFile(new File([new Uint8Array(12)], "photo.jpg", { type: "image/jpeg" })) || "", /do not match/);
});

test("counts existing and pending images together", () => {
  assert.equal(validateArticleImageCount(5, 5), null);
  assert.equal(validateArticleImageCount(0, 10), null);
  assert.match(validateArticleImageCount(6, 5) || "", /maximum of 10 images/);
  assert.match(validateArticleImageCount(0, 11) || "", /maximum of 10 images/);
});
