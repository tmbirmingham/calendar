import path from "node:path";

export const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/** Slideshow folder: PHOTOS_DIR if set, otherwise ./photos in the project. */
export function photosDir(): string {
  // turbopackIgnore: the folder is read at runtime, not bundled.
  return path.resolve(
    /*turbopackIgnore: true*/ process.env.PHOTOS_DIR || path.join(process.cwd(), "photos"),
  );
}
