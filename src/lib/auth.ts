import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { compare, hash } from "bcryptjs";
import { prisma } from "./db";
import { syncGitHubProfileToUser } from "./github";
import { awardBadgesForUser } from "./badges";
import { verifyUserTwoFactorLogin } from "./user-settings";

function warnMissingAuthEnv() {
  const globalForAuthEnv = globalThis as typeof globalThis & {
    __authEnvWarningShown?: boolean;
  };
  if (globalForAuthEnv.__authEnvWarningShown) return;

  const checks = [
    { keys: ["NEXTAUTH_URL", "AUTH_URL"], label: "NEXTAUTH_URL/AUTH_URL" },
    { keys: ["NEXTAUTH_SECRET", "AUTH_SECRET"], label: "NEXTAUTH_SECRET/AUTH_SECRET" },
    { keys: ["GITHUB_CLIENT_ID", "AUTH_GITHUB_ID"], label: "GITHUB_CLIENT_ID/AUTH_GITHUB_ID" },
    { keys: ["GITHUB_CLIENT_SECRET", "AUTH_GITHUB_SECRET"], label: "GITHUB_CLIENT_SECRET/AUTH_GITHUB_SECRET" },
    { keys: ["GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID"], label: "GOOGLE_CLIENT_ID/AUTH_GOOGLE_ID" },
    { keys: ["GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET"], label: "GOOGLE_CLIENT_SECRET/AUTH_GOOGLE_SECRET" },
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

const githubClientId = (process.env.GITHUB_CLIENT_ID || process.env.AUTH_GITHUB_ID || "").trim();
const githubClientSecret = (process.env.GITHUB_CLIENT_SECRET || process.env.AUTH_GITHUB_SECRET || "").trim();
const hasGitHubOAuth = Boolean(githubClientId && githubClientSecret);
const googleClientId = (process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "").trim();
const googleClientSecret = (process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "").trim();
const hasGoogleOAuth = Boolean(googleClientId && googleClientSecret);

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
          allowDangerousEmailAccountLinking: true,
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
  ...(hasGoogleOAuth
    ? [
        Google({
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  Credentials({
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
      otp: { label: "OTP", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.username || !credentials?.password) return null;
      const username = String(credentials.username);
      const password = String(credentials.password);
      const otp = String(credentials.otp || "").trim();

      const adminUsername = (process.env.ADMIN_USERNAME || "admin").trim();
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      const adminEmail = (process.env.ADMIN_EMAIL || "admin@zensblog.dev").trim().toLowerCase();

      if (username === adminUsername && password === adminPassword) {
        const secureHash = await hash(adminPassword, 12);

        const existingByUsername = await prisma.user.findUnique({
          where: { username: adminUsername },
          select: { id: true },
        });
        const existingByEmail = !existingByUsername
          ? await prisma.user.findUnique({
              where: { email: adminEmail },
              select: { id: true },
            })
          : null;

        const admin = existingByUsername || existingByEmail
          ? await prisma.user.update({
              where: { id: (existingByUsername || existingByEmail)!.id },
              data: {
                username: adminUsername,
                role: "ADMIN",
                passwordHash: secureHash,
                email: adminEmail,
                name: adminUsername,
              },
            })
          : await prisma.user.create({
              data: {
                username: adminUsername,
                email: adminEmail,
                passwordHash: secureHash,
                role: "ADMIN",
                name: adminUsername,
              },
            });

        const otpValid = await verifyUserTwoFactorLogin(admin.id, otp);
        if (!otpValid) return null;

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
      const otpValid = await verifyUserTwoFactorLogin(user.id, otp);
      if (!otpValid) return null;

      return { id: user.id, name: user.name || user.username, email: user.email, role: user.role };
    },
  }),
];

if (!hasGitHubOAuth) {
  console.warn("[Auth] GitHub OAuth disabled because GITHUB_CLIENT_ID/AUTH_GITHUB_ID or GITHUB_CLIENT_SECRET/AUTH_GITHUB_SECRET is missing.");
}
if (!hasGoogleOAuth) {
  console.warn("[Auth] Google OAuth disabled because GOOGLE_CLIENT_ID/AUTH_GOOGLE_ID or GOOGLE_CLIENT_SECRET/AUTH_GOOGLE_SECRET is missing.");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "github" || !user?.id || !profile) return true;

      try {
        const linked = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: "github",
              providerAccountId: account.providerAccountId,
            },
          },
          select: { userId: true },
        });
        const dbUserId = linked?.userId || user.id;

        const existing = await prisma.user.findUnique({
          where: { id: dbUserId },
          select: { githubSyncedAt: true },
        });

        // Auto-sync on first GitHub login. Later refreshes are manual.
        if (!existing?.githubSyncedAt) {
          await syncGitHubProfileToUser(dbUserId, profile);
        }
        await awardBadgesForUser(dbUserId);
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
