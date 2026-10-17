import { readFile } from "node:fs/promises";
import path from "node:path";
import type { NextRequest } from "next/server";
import { IMAGE_TYPES, photosDir } from "../shared";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/photos/[name]">) {
  const { name } = await ctx.params;
  const fileName = path.basename(name);
  const type = IMAGE_TYPES[path.extname(fileName).toLowerCase()];
  // basename() strips any directory parts, so requests can't escape the folder.
  if (!type || fileName !== name || fileName.startsWith(".")) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const file = await readFile(path.join(photosDir(), fileName));
    return new Response(new Uint8Array(file), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
