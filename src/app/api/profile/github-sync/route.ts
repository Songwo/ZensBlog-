import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fetchGitHubProfile, syncGitHubProfileToUser } from "@/lib/github";
import { errorJson, isSameOrigin, safeJson } from "@/lib/api";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return errorJson("未授权", 401);
  if (!isSameOrigin(request)) return errorJson("非法来源请求", 403);

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return errorJson("当前账号未绑定 GitHub 或授权已失效", 400);
  }

  try {
    const profile = await fetchGitHubProfile(account.access_token);
    await syncGitHubProfileToUser(session.user.id, profile, true);
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        company: true,
        location: true,
        blog: true,
        githubFollowers: true,
        githubFollowing: true,
        githubPublicRepos: true,
        githubProfile: true,
        githubSyncedAt: true,
      },
    });
    return safeJson({ success: true, user });
  } catch (err) {
    console.error("[GitHub Manual Sync Error]", err);
    return errorJson("同步 GitHub 信息失败", 500);
  }
}
