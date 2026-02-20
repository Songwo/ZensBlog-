import { prisma } from "@/lib/db";

type LevelStore = {
  totalReadMinutes: number;
  readDays: string[];
};

type LevelInfo = {
  level: number;
  levelName: string;
  points: number;
  nextLevelPoints: number | null;
  daysRead: number;
  totalReadMinutes: number;
  likesReceived: number;
};

const LEVEL_THRESHOLDS = [0, 220, 560, 980, 1500, 2200, 3100];
const LEVEL_NAMES = ["Lv0 新人", "Lv1 见习阅读者", "Lv2 稳定输出者", "Lv3 深度学习者", "Lv4 社区影响者", "Lv5 核心创作者", "Lv6 传说开发者"];

function levelKey(userId: string) {
  return `user:level:${userId}`;
}
function readLogKey(userId: string, day: string, postId: string) {
  return `user:readlog:${userId}:${day}:${postId}`;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseStore(raw: string | null | undefined): LevelStore {
  if (!raw) return { totalReadMinutes: 0, readDays: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<LevelStore>;
    return {
      totalReadMinutes: Number(parsed.totalReadMinutes || 0),
      readDays: Array.isArray(parsed.readDays) ? parsed.readDays.filter(Boolean).slice(-90) : [],
    };
  } catch {
    return { totalReadMinutes: 0, readDays: [] };
  }
}

function calcLevel(points: number) {
  let level = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (points >= LEVEL_THRESHOLDS[i]) level = i;
  }
  const nextLevelPoints = level + 1 < LEVEL_THRESHOLDS.length ? LEVEL_THRESHOLDS[level + 1] : null;
  return { level, levelName: LEVEL_NAMES[level] || `Lv${level}`, nextLevelPoints };
}

export async function recordUserReading(userId: string, postId: string, minutes: number) {
  if (!userId || !postId || !Number.isFinite(minutes) || minutes <= 0) return;
  const key = levelKey(userId);
  const day = todayKey();
  const logKey = readLogKey(userId, day, postId);
  const existed = await prisma.siteConfig.findUnique({ where: { key: logKey }, select: { key: true } });
  if (existed) return;

  const row = await prisma.siteConfig.findUnique({ where: { key } });
  const current = parseStore(row?.value);

  const next: LevelStore = {
    totalReadMinutes: Math.max(0, current.totalReadMinutes + Math.max(1, Math.round(minutes))),
    readDays: current.readDays.includes(day) ? current.readDays : [...current.readDays, day].slice(-90),
  };

  await prisma.$transaction([
    prisma.siteConfig.upsert({
      where: { key },
      create: { key, value: JSON.stringify(next) },
      update: { value: JSON.stringify(next) },
    }),
    prisma.siteConfig.upsert({
      where: { key: logKey },
      create: { key: logKey, value: "1" },
      update: { value: "1" },
    }),
  ]);
}

export async function getUserLevelInfo(userId: string): Promise<LevelInfo> {
  const [row, likesReceived] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: levelKey(userId) } }),
    prisma.postLike.count({ where: { post: { authorId: userId } } }),
  ]);
  const store = parseStore(row?.value);
  const daysRead = store.readDays.length;
  const dailyBonus = daysRead >= 15 ? 300 : 0;
  const points = daysRead * 20 + store.totalReadMinutes + likesReceived * 2 + dailyBonus;
  const { level, levelName, nextLevelPoints } = calcLevel(points);

  return {
    level,
    levelName,
    points,
    nextLevelPoints,
    daysRead,
    totalReadMinutes: store.totalReadMinutes,
    likesReceived,
  };
}
