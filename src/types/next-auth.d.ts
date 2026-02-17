import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole | string;
      username?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      bio?: string | null;
      title?: string | null;
      about?: string | null;
      company?: string | null;
      location?: string | null;
      blog?: string | null;
      website?: string | null;
      twitter?: string | null;
      linkedin?: string | null;
      githubProfile?: string | null;
      githubFollowers?: number;
      githubFollowing?: number;
      githubPublicRepos?: number;
      activeBadgeId?: string | null;
      badges?: Array<{ id: string; name: string; icon: string; color: string; iconUrl?: string | null }>;
    };
  }

  interface User {
    role?: UserRole | string;
    githubId?: string;
    username?: string | null;
    bio?: string | null;
    company?: string | null;
    location?: string | null;
    blog?: string | null;
    githubCreatedAt?: string | Date | null;
    githubFollowers?: number;
    githubFollowing?: number;
    githubPublicRepos?: number;
    githubProfile?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole | string;
    username?: string | null;
  }
}
