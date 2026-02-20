import { readFile, stat } from "fs/promises";
import { join, resolve } from "path";

export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  svg: "image/svg+xml",
};

function safeUploadPath(parts: string[]) {
  const uploadsRoot = resolve(process.cwd(), "public", "uploads");
  const requested = resolve(join(uploadsRoot, ...parts));
  if (!requested.startsWith(uploadsRoot)) return null;
  return requested;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  if (!Array.isArray(path) || path.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  const filePath = safeUploadPath(path);
  if (!filePath) return new Response("Not Found", { status: 404 });

  try {
    const fileInfo = await stat(filePath);
    if (!fileInfo.isFile()) return new Response("Not Found", { status: 404 });

    const buffer = await readFile(filePath);
    const ext = (path[path.length - 1].split(".").pop() || "").toLowerCase();
    const contentType = MIME_BY_EXT[ext] || "application/octet-stream";

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buffer.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

