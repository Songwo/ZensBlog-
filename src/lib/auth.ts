import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { compare, hash } from "bcryptjs";
import { prisma } from "./db";
import { syncGitHubProfileToUser } from "./github";
import { awardBadgesForUser } from "./badges";

function warnMissingAuthEnv() {
  const globalForAuthEnv = globalThis as typeof globalThis & {
    __authEnvWarningShown?: boolean;
  };
  if (globalForAuthEnv.__authEnvWarningShown) return;

  const checks = [
    { keys: ["NEXTAUTH_URL", "AUTH_URL"], label: "NEXTAUTH_URL/AUTH_URL" },
    { keys: ["NEXTAUTH_SECRET", "AUTH_SECRET"], label: "NEXTAUTH_SECRET/AUTH_SECRET" },
    { keys: ["GITHUB_CLIENT_ID"], label: "GITHUB_CLIENT_ID" },
    { keys: ["GITHUB_CLIENT_SECRET"], label: "GITHUB_CLIENT_SECRET" },
  ] as const;

  const missing = checks
    .filter((item) => item.keys.every((key) => !process.env[key]))
    .map((item) => item.label);
  if (!missing.length) return;

  console.warn(
    "[Auth ENV Warning] Missing environment variables:",
    missing.join(", ")
  );
  globalForAuthEnv.__authEnvWarningShown = true;
}

warnMissingAuthEnv();

const githubClientId = process.env.GITHUB_CLIENT_ID?.trim();
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
const hasGitHubOAuth = Boolean(githubClientId && githubClientSecret);

const providers = [
  ...(hasGitHubOAuth
    ? [
        GitHub({
          clientId: githubClientId as string,
          clientSecret: githubClientSecret as string,
          authorization: {
            params: {
              scope: "read:user user:email public_repo",
            },
          },
          profile(profile) {
            return {
              id: String(profile.id),
              username: profile.login,
              name: profile.name || profile.login,
              email: profile.email,
              image: profile.avatar_url,
              bio: profile.bio,
              company: profile.company,
              location: profile.location,
              blog: profile.blog,
              githubCreatedAt: profile.created_at,
              githubFollowers: profile.followers,
              githubFollowing: profile.following,
              githubPublicRepos: profile.public_repos,
              githubProfile: profile.html_url,
              githubId: String(profile.id),
              role: "USER",
            };
          },
        }),
      ]
    : []),
  Credentials({
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials?.password) return null;
      const username = String(credentials.username);
      const password = String(credentials.password);

      const adminUsername = process.env.ADMIN_USERNAME || "admin";
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const adminEmail = process.env.ADMIN_EMAIL || "admin@zensblog.dev";

      if (username === adminUsername && password === adminPassword) {
        const secureHash = await hash(adminPassword, 12);
        const admin = await prisma.user.upsert({
          where: { username: adminUsername },
          update: {
            role: "ADMIN",
            passwordHash: secureHash,
            email: adminEmail,
          },
          create: {
            username: adminUsername,
            email: adminEmail,
            passwordHash: secureHash,
            role: "ADMIN",
            name: adminUsername,
          },
        });

        return {
          id: admin.id,
          name: admin.name || admin.username,
          email: admin.email,
          role: "ADMIN",
        };
      }

      const user = await prisma.user.findUnique({
        where: { username },
      });
      if (!user || !user.passwordHash) return null;

      const valid = await compare(
        password,
        user.passwordHash
      );
      if (!valid) return null;

      return { id: user.id, name: user.name || user.username, email: user.email, role: user.role };
    },
  }),
];

if (!hasGitHubOAuth) {
  console.warn("[Auth] GitHub OAuth disabled because GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET is missing.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !user?.id || !profile) return true;

      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { githubSyncedAt: true },
        });

        // Auto-sync on first GitHub login. Later refreshes are manual.
        if (!existing?.githubSyncedAt) {
          await syncGitHubProfileToUser(user.id, profile);
        }
        await awardBadgesForUser(user.id);
      } catch (err) {
        console.error("[Auth GitHub Sync Error]", err);
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role || "USER";
        token.username = (user as { username?: string | null }).username || token.username;
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        const userId = user?.id || token.sub || "";
        session.user.id = userId;

        const dbUser = userId
          ? await prisma.user.findUnique({
              where: { id: userId },
              select: {
                role: true,
                username: true,
                bio: true,
                title: true,
                about: true,
                company: true,
                location: true,
                blog: true,
                website: true,
                twitter: true,
                linkedin: true,
                githubFollowers: true,
                githubFollowing: true,
                githubPublicRepos: true,
                githubProfile: true,
                activeBadgeId: true,
                userBadges: { include: { badge: true }, orderBy: { awardedAt: "desc" }, take: 20 },
              },
            })
          : null;

        (session.user as unknown as { role: string }).role =
          dbUser?.role || (token.role as string) || "USER";
        (session.user as unknown as { username?: string | null }).username =
          dbUser?.username || null;
        (session.user as unknown as { bio?: string | null }).bio = dbUser?.bio || null;
        (session.user as unknown as { title?: string | null }).title = dbUser?.title || null;
        (session.user as unknown as { about?: string | null }).about = dbUser?.about || null;
        (session.user as unknown as { company?: string | null }).company = dbUser?.company || null;
        (session.user as unknown as { location?: string | null }).location = dbUser?.location || null;
        (session.user as unknown as { blog?: string | null }).blog = dbUser?.blog || null;
        (session.user as unknown as { website?: string | null }).website = dbUser?.website || null;
        (session.user as unknown as { twitter?: string | null }).twitter = dbUser?.twitter || null;
        (session.user as unknown as { linkedin?: string | null }).linkedin = dbUser?.linkedin || null;
        (session.user as unknown as { githubFollowers?: number }).githubFollowers = dbUser?.githubFollowers || 0;
        (session.user as unknown as { githubFollowing?: number }).githubFollowing = dbUser?.githubFollowing || 0;
        (session.user as unknown as { githubPublicRepos?: number }).githubPublicRepos = dbUser?.githubPublicRepos || 0;
        (session.user as unknown as { githubProfile?: string | null }).githubProfile = dbUser?.githubProfile || null;
        (session.user as unknown as { activeBadgeId?: string | null }).activeBadgeId = dbUser?.activeBadgeId || null;
        (session.user as unknown as { badges?: Array<{ id: string; name: string; icon: string; color: string; iconUrl?: string | null }> }).badges =
          (dbUser?.userBadges || []).map((ub) => ({
            id: ub.badge.id,
            name: ub.badge.name,
            icon: ub.badge.icon,
            color: ub.badge.color,
            iconUrl: ub.badge.iconUrl,
          }));
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
});
