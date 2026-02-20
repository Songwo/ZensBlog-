import { auth } from "@/lib/auth";
import { uploadImage } from "@/lib/storage";
import { checkRateLimit, errorJson, isSameOrigin, safeJson } from "@/lib/api";
import { prisma } from "@/lib/db";

const MAX_SIZE = 2 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function hasValidMagic(buffer: Buffer, mime: string) {
  if (mime === "image/png") return buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mime === "image/jpeg") return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (mime === "image/webp") return buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP";
  return false;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-profile-avatar", limit: 20, windowMs: 10 * 60_000 });
  if (!rate.allowed) return errorJson("上传过于频繁，请稍后再试", 429);

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return errorJson("缺少文件", 400);
  if (!(file.type in ALLOWED)) return errorJson("仅支持 png/jpg/webp", 400);
  if (file.size > MAX_SIZE) return errorJson("文件大小不能超过 2MB", 400);

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!hasValidMagic(buffer, file.type)) return errorJson("文件头校验失败", 400);

  const uploaded = await uploadImage(buffer, file.type, ALLOWED[file.type], "local");
  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: uploaded.url },
  });

  return safeJson({ url: uploaded.url });
}

