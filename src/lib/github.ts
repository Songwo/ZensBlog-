import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type GitHubProfile = {
  id?: number | string | null;
  login?: string | null;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
  created_at?: string | null;
  followers?: number | null;
  following?: number | null;
  public_repos?: number | null;
  html_url?: string | null;
};

function toNullableString(value: unknown, max = 500) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function toSafeDate(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toSafeInt(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function buildGitHubData(profile: GitHubProfile): Prisma.UserUpdateInput {
  const bio = toNullableString(profile.bio, 500);
  return {
    githubId: toNullableString(profile.id?.toString(), 64),
    username: toNullableString(profile.login, 80),
    name: toNullableString(profile.name, 120) ?? toNullableString(profile.login, 80),
    email: toNullableString(profile.email, 160)?.toLowerCase() ?? null,
    image: toNullableString(profile.avatar_url, 500),
    bio: bio ?? "",
    company: toNullableString(profile.company, 160),
    location: toNullableString(profile.location, 160),
    blog: toNullableString(profile.blog, 500),
    githubProfile: toNullableString(profile.html_url, 500),
    githubCreatedAt: toSafeDate(profile.created_at),
    githubFollowers: toSafeInt(profile.followers),
    githubFollowing: toSafeInt(profile.following),
    githubPublicRepos: toSafeInt(profile.public_repos),
  };
}

export async function syncGitHubProfileToUser(userId: string, profile: GitHubProfile, markSynced = true) {
  const data = buildGitHubData(profile);

  if (typeof data.username === "string" && data.username) {
    const owner = await prisma.user.findUnique({
      where: { username: data.username },
      select: { id: true },
    });
    if (owner && owner.id !== userId) {
      delete data.username;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      ...(markSynced ? { githubSyncedAt: new Date() } : {}),
    },
  });
}

export async function fetchGitHubProfile(accessToken: string): Promise<GitHubProfile> {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "zensblog-auth-sync",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub profile fetch failed: ${response.status}`);
  }

  return (await response.json()) as GitHubProfile;
}

export type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
  fork: boolean;
  updated_at: string;
};

export async function fetchGitHubRepos(accessToken: string, perPage = 12) {
  const response = await fetch(
    `https://api.github.com/user/repos?sort=updated&direction=desc&per_page=${perPage}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "zensblog-profile",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub repos fetch failed: ${response.status}`);
  }

  const repos = (await response.json()) as GitHubRepo[];
  return repos.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    url: repo.html_url,
    description: repo.description,
    stars: repo.stargazers_count,
    language: repo.language,
    isFork: repo.fork,
    updatedAt: repo.updated_at,
  }));
}
