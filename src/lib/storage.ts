import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { createUploadFilename } from "@/lib/api";

type UploadResult = {
  url: string;
  provider: "cloudinary" | "local";
};
type UploadProvider = UploadResult["provider"];

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "zensblog";

function canUseCloudinary() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);
}

function signCloudinaryParams(params: Record<string, string>, secret: string) {
  const sorted = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  return createHash("sha1").update(`${sorted}${secret}`).digest("hex");
}

async function uploadToCloudinary(buffer: Buffer, mimeType: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = { folder: CLOUDINARY_FOLDER, timestamp };
  const signature = signCloudinaryParams(params, CLOUDINARY_API_SECRET!);

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), "upload");
  form.append("api_key", CLOUDINARY_API_KEY!);
  form.append("timestamp", timestamp);
  form.append("folder", CLOUDINARY_FOLDER);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: form, cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error("cloudinary_upload_failed");
  }

  const payload = (await response.json()) as { secure_url?: string };
  if (!payload.secure_url) throw new Error("cloudinary_upload_missing_secure_url");
  return payload.secure_url;
}

async function uploadToLocal(buffer: Buffer, extension: string): Promise<string> {
  const filename = createUploadFilename(extension);
  const uploadDir = join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function uploadImage(
  buffer: Buffer,
  mimeType: string,
  extension: string,
  preferredProvider?: UploadProvider,
): Promise<UploadResult> {
  if (preferredProvider === "local") {
    const localUrl = await uploadToLocal(buffer, extension);
    return { url: localUrl, provider: "local" };
  }

  if (canUseCloudinary()) {
    try {
      const url = await uploadToCloudinary(buffer, mimeType);
      return { url, provider: "cloudinary" };
    } catch {
      // fall through to local upload for resiliency
    }
  }

  const localUrl = await uploadToLocal(buffer, extension);
  return { url: localUrl, provider: "local" };
}
