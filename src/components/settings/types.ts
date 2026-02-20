export type MeOverview = {
  profile: {
    id: string;
    name: string;
    username: string;
    email: string;
    image: string;
    bio: string;
    website: string;
    twitter: string;
    linkedin: string;
    githubProfile: string;
    activeBadgeId: string;
    createdAt: string;
  };
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    iconUrl?: string | null;
    color: string;
    description: string;
  }>;
  level: {
    level: number;
    levelName: string;
    points: number;
    nextLevelPoints: number | null;
    daysRead: number;
    totalReadMinutes: number;
    likesReceived: number;
  };
  stats: {
    posts: number;
    comments: number;
    likes: number;
    views: number;
    readingMinutes: number;
  };
  settings: {
    notify: {
      feishuWebhook: string;
      wecomWebhook: string;
      emailEnabled: boolean;
      emailTo: string;
    };
    preferences: {
      comment: boolean;
      like: boolean;
      reply: boolean;
      report: boolean;
      message: boolean;
      inApp: boolean;
    };
    privacy: {
      showEmail: boolean;
      showSocialLinks: boolean;
    };
    card: {
      backgroundStyle: "pink-glass" | "ocean" | "sunset" | "night-grid";
      headline: string;
      showBio: boolean;
      showStats: boolean;
      showSocial: boolean;
      showLevel: boolean;
      showBadge: boolean;
    };
    auth: {
      twoFactorEnabled: boolean;
    };
  };
  sessions: Array<{
    id: string;
    ipHash: string;
    ua: string;
    firstSeenAt: string;
    lastSeenAt: string;
  }>;
  currentSessionId: string;
  integrations: {
    github: boolean;
    google: boolean;
    telegram: boolean;
    feishu: boolean;
    telegramUsername?: string;
    feishuName?: string;
  };
};

export type SettingsTab = "profile" | "account" | "security" | "auth" | "notifications" | "integrations";
