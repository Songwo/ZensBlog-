import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-config";

export const runtime = "nodejs";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function resolveCategoryPalette(category: string) {
  const map: Record<string, { bg: string; tag: string; tagBorder: string }> = {
    前端: {
      bg: "radial-gradient(circle at 12% 16%, rgba(240,93,154,0.34), transparent 38%), radial-gradient(circle at 86% 80%, rgba(106,88,255,0.24), transparent 44%), linear-gradient(135deg, #101327 0%, #161a36 52%, #1f2450 100%)",
      tag: "#f8c4dc",
      tagBorder: "rgba(248,196,220,0.42)",
    },
    后端: {
      bg: "radial-gradient(circle at 16% 20%, rgba(56,189,248,0.28), transparent 40%), radial-gradient(circle at 88% 78%, rgba(96,165,250,0.24), transparent 46%), linear-gradient(135deg, #0b1727 0%, #12243a 50%, #1b3350 100%)",
      tag: "#bde8ff",
      tagBorder: "rgba(189,232,255,0.42)",
    },
    AI: {
      bg: "radial-gradient(circle at 12% 16%, rgba(196,128,255,0.32), transparent 40%), radial-gradient(circle at 82% 76%, rgba(120,103,255,0.25), transparent 44%), linear-gradient(135deg, #15102b 0%, #1e1a3f 52%, #2a2353 100%)",
      tag: "#ddc7ff",
      tagBorder: "rgba(221,199,255,0.45)",
    },
    默认: {
      bg: "radial-gradient(circle at 12% 16%, rgba(240,93,154,0.38), transparent 38%), radial-gradient(circle at 88% 78%, rgba(125,97,255,0.24), transparent 44%), linear-gradient(135deg, #0d1120 0%, #15162a 52%, #20253d 100%)",
      tag: "#f8c4dc",
      tagBorder: "rgba(248,196,220,0.4)",
    },
  };
  return map[category] || map["默认"];
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, settings] = await Promise.all([
    prisma.post.findFirst({
      where: { slug, published: true, type: "OFFICIAL" },
      select: { title: true, excerpt: true, category: { select: { name: true } } },
    }),
    getSiteSettings(),
  ]);

  const title = post?.title || "ZEN::LAB";
  const description = post?.excerpt || settings.siteDescription;
  const category = post?.category?.name || "技术文章";
  const palette = resolveCategoryPalette(category);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background:
            palette.bg,
          color: "#f7f9ff",
          padding: "56px",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0",
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "30px 30px",
            opacity: 0.35,
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "14px", zIndex: 1 }}>
          <span
            style={{
              fontSize: 28,
              letterSpacing: "0.08em",
              color: palette.tag,
              fontWeight: 700,
            }}
          >
            ZEN::LAB
          </span>
          <span
            style={{
              fontSize: 18,
              border: `1px solid ${palette.tagBorder}`,
              color: palette.tag,
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            {category}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", zIndex: 1 }}>
          <div
            style={{
              fontSize: 68,
              lineHeight: 1.1,
              fontWeight: 800,
              maxWidth: "100%",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: "rgba(226,233,255,0.92)",
              maxWidth: "94%",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            zIndex: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "rgba(211,220,242,0.9)",
            fontSize: 22,
          }}
        >
          <span>Build · Ship · Think · Repeat</span>
          <span>{settings.siteName}</span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
