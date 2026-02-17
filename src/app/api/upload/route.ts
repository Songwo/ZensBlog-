import {
  checkRateLimit,
  errorJson,
  isSameOrigin,
  requireAdminSession,
  safeJson,
} from "@/lib/api";
import { uploadImage } from "@/lib/storage";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);
  const rate = await checkRateLimit(request, { namespace: "api-upload", limit: 24, windowMs: 10 * 60_000 });
  if (!rate.allowed) return errorJson("上传过于频繁，请稍后再试", 429);

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) return errorJson("未选择文件", 400);
    if (!(file.type in MIME_TO_EXT)) return errorJson("文件类型不支持，仅允许常见图片格式", 400);
    if (file.size > MAX_UPLOAD_SIZE) return errorJson("文件过大，最大支持 5MB", 400);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = MIME_TO_EXT[file.type];
    const uploaded = await uploadImage(buffer, file.type, ext);

    return safeJson({ url: uploaded.url, provider: uploaded.provider });
  } catch {
    return errorJson("上传失败", 500);
  }
}
