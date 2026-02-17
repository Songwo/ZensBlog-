import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const passwordHash = await hash(process.env.ADMIN_PASSWORD || "admin123", 12);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: process.env.ADMIN_USERNAME || "admin",
      email: process.env.ADMIN_EMAIL || "admin@zensblog.dev",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log("Admin user created:", admin.username);

  // Create categories
  const categories = await Promise.all(
    [
      { name: "技术", slug: "tech", sortOrder: 1 },
      { name: "设计", slug: "design", sortOrder: 2 },
      { name: "随笔", slug: "essay", sortOrder: 3 },
    ].map((c) =>
      prisma.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      })
    )
  );
  console.log("Categories created:", categories.map((c) => c.name).join(", "));

  // Create tags
  const tags = await Promise.all(
    [
      { name: "技术", slug: "tech" },
      { name: "设计", slug: "design" },
      { name: "随笔", slug: "essay" },
      { name: "博客", slug: "blog" },
      { name: "极简主义", slug: "minimalism" },
      { name: "写作", slug: "writing" },
    ].map((t) =>
      prisma.tag.upsert({
        where: { slug: t.slug },
        update: {},
        create: t,
      })
    )
  );
  console.log("Tags created:", tags.map((t) => t.name).join(", "));

  // Create sample posts
  const posts = [
    {
      title: "留白的力量：设计中的减法哲学",
      slug: "power-of-whitespace",
      excerpt: "好的设计不是不能再添加什么，而是不能再减少什么。探讨极简主义在数字产品设计中的实践与思考。",
      coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=960&h=600&fit=crop&q=80",
      published: true,
      pinned: true,
      views: 128,
      categoryId: categories[1].id, // 设计
      publishedAt: new Date("2025-12-20"),
      content: `## 少即是多

密斯·凡德罗的这句话，在数字时代依然振聋发聩。当我们打开一个网页，最先感受到的不是内容本身，而是空间——那些文字与文字之间、模块与模块之间的呼吸感。

留白不是浪费，而是一种引导。它告诉读者的眼睛：在这里停留，这里值得注意。

## 实践中的取舍

在最近的一个项目中，我尝试将首页的信息密度降低 40%。客户最初的反应是担忧——"内容是不是太少了？"但上线后的数据说明了一切：

- 页面停留时间提升 28%
- 核心按钮点击率提升 15%
- 跳出率下降 12%

> 设计的本质不是装饰，而是沟通。

## 如何做减法

做减法比做加法难得多。每一次删除都需要回答一个问题：**这个元素的存在，是为了设计师的安全感，还是为了用户的需求？**

三个实用原则：

1. **一屏一焦点** — 每个视口只传达一个核心信息
2. **层级即节奏** — 用字号和间距创造阅读的韵律
3. **克制即高级** — 颜色不超过三种，动效不超过两种`,
      tagSlugs: ["design", "minimalism"],
    },
    {
      title: "从零搭建个人博客的技术选型",
      slug: "building-this-blog",
      excerpt: "记录这个博客从框架选择到部署上线的完整过程，以及每一步背后的思考。",
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=960&h=600&fit=crop&q=80",
      published: true,
      pinned: false,
      views: 86,
      categoryId: categories[0].id, // 技术
      publishedAt: new Date("2026-01-15"),
      content: `## 为什么不用现成的平台

WordPress、Notion、语雀……选择太多了。但作为一个开发者，我想要的是：完全的控制权、极致的性能、以及写作时的纯粹体验。

## 技术栈

最终选择了 **Next.js** 作为框架。原因很简单：

- Server Components 性能优秀
- 原生支持全栈开发
- 丰富的生态系统

样式方案用了 **Tailwind CSS**，配合自定义的设计系统，可以快速实现一致的视觉语言。

\`\`\`js
// 一个简单的日期格式化
const fmt = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
\`\`\`

## 部署

选择了自部署方案，SQLite 数据库，Docker 容器化，简单可靠。

整个博客的 Lighthouse 评分：**Performance 100 / Accessibility 100**。`,
      tagSlugs: ["tech", "blog"],
    },
    {
      title: "长期主义与日常写作",
      slug: "long-term-writing",
      excerpt: "写作不是为了发表，而是为了思考。关于坚持记录的一些感悟。",
      coverImage: "",
      published: true,
      pinned: false,
      views: 52,
      categoryId: categories[2].id, // 随笔
      publishedAt: new Date("2026-02-05"),
      content: `## 写给自己

大多数人对写作有一个误解：写作是为了给别人看的。

但我越来越觉得，写作最大的受益者是自己。当你试图把一个模糊的想法变成清晰的文字时，思考就自然发生了。

## 不追求完美

完美主义是写作最大的敌人。一篇 80 分的文章发出来，远好过一篇 100 分的文章永远躺在草稿箱里。

我给自己定的规则很简单：

1. 每周至少写一篇，长短不限
2. 不反复修改，发布即完成
3. 允许观点过时，允许将来的自己不同意

## 复利效应

写了半年之后回头看，最大的收获不是文章本身，而是思维方式的变化。你会开始习惯性地把经历转化为洞察，把感受提炼为观点。

这就是长期主义的力量——每一篇看似微不足道的记录，都在为未来的自己积累素材。`,
      tagSlugs: ["essay", "writing"],
    },
  ];

  for (const { tagSlugs, ...postData } of posts) {
    const post = await prisma.post.upsert({
      where: { slug: postData.slug },
      update: {},
      create: postData,
    });

    // Connect tags
    const tagRecords = tags.filter((t) => tagSlugs.includes(t.slug));
    for (const tag of tagRecords) {
      await prisma.postTag.upsert({
        where: { postId_tagId: { postId: post.id, tagId: tag.id } },
        update: {},
        create: { postId: post.id, tagId: tag.id },
      });
    }

    console.log("Post created:", post.title);
  }

  // Create sample comments
  const firstPost = await prisma.post.findUnique({ where: { slug: "power-of-whitespace" } });
  if (firstPost) {
    const comment = await prisma.comment.upsert({
      where: { id: "seed-comment-1" },
      update: {},
      create: {
        id: "seed-comment-1",
        content: "写得很好，留白确实是设计中最容易被忽视的部分。",
        author: "读者小明",
        email: "reader@example.com",
        approved: true,
        postId: firstPost.id,
      },
    });

    await prisma.comment.upsert({
      where: { id: "seed-comment-2" },
      update: {},
      create: {
        id: "seed-comment-2",
        content: "谢谢！这也是我一直在思考的问题。",
        author: "Zen",
        email: "admin@zensblog.dev",
        approved: true,
        postId: firstPost.id,
        parentId: comment.id,
        userId: admin.id,
      },
    });
    console.log("Sample comments created");
  }

  // Site config
  const configs = [
    { key: "siteName", value: "Zen's Blog" },
    { key: "siteDescription", value: "一个关于技术、设计与生活的个人博客" },
    { key: "siteUrl", value: "https://zensblog.dev" },
    { key: "authorName", value: "Zen" },
    { key: "theme", value: "sand" },
  ];
  for (const config of configs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("Site config initialized");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
