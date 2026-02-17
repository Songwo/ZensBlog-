import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchGitHubRepos } from "@/lib/github";
import { errorJson, safeJson } from "@/lib/api";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return safeJson({ repos: [] });
  }

  try {
    const repos = await fetchGitHubRepos(account.access_token, 12);
    return safeJson({ repos });
  } catch (err) {
    console.error("[GitHub Repos Error]", err);
    return errorJson("拉取 GitHub 仓库失败", 500);
  }
}
