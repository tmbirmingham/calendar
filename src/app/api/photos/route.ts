import { readdir } from "node:fs/promises";
import path from "node:path";
import { IMAGE_TYPES, photosDir } from "./shared";

export async function GET() {
  try {
    const entries = await readdir(photosDir(), { withFileTypes: true });
    const photos = entries
      .filter(
        (e) =>
          e.isFile() &&
          !e.name.startsWith(".") &&
          path.extname(e.name).toLowerCase() in IMAGE_TYPES,
      )
      .map((e) => e.name)
      .sort()
      .map((name) => `/api/photos/${encodeURIComponent(name)}`);
    return Response.json({ photos });
  } catch {
    return Response.json({ photos: [] });
  }
}
