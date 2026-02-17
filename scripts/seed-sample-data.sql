-- ZensBlog 示例数据
-- 运行此脚本添加示例项目和友链

-- 添加示例项目
INSERT INTO Project (
  id, title, slug, description, tags,
  published, featured, sortOrder,
  demoUrl, githubUrl, coverImage, content,
  createdAt, updatedAt
) VALUES
(
  'clx' || hex(randomblob(12)),
  'ZensBlog',
  'zensblog',
  '一个极简风格的个人技术博客系统，使用 Next.js 15 + TypeScript + Prisma 构建，支持 Markdown、代码高亮、评论系统等功能',
  'Next.js,TypeScript,Prisma,TailwindCSS',
  1,
  1,
  0,
  'https://zensblog.dev',
  'https://github.com/user/zensblog',
  '',
  '',
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'React Admin Dashboard',
  'react-admin-dashboard',
  '基于 React 18 和 Ant Design 的后台管理系统模板，包含用户管理、权限控制、数据可视化等功能',
  'React,Ant Design,TypeScript,Vite',
  1,
  1,
  1,
  'https://admin.example.com',
  'https://github.com/user/react-admin',
  '',
  '',
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'Vue3 Component Library',
  'vue3-component-library',
  '轻量级 Vue 3 组件库，提供常用 UI 组件，支持按需引入和主题定制',
  'Vue 3,TypeScript,Vite,Sass',
  1,
  1,
  2,
  'https://components.example.com',
  'https://github.com/user/vue3-components',
  '',
  '',
  datetime('now'),
  datetime('now')
);

-- 添加示例友链
INSERT INTO FriendLink (
  id, name, description, url, avatar,
  featured, sortOrder,
  createdAt, updatedAt
) VALUES
(
  'clx' || hex(randomblob(12)),
  'GitHub',
  '全球最大的代码托管平台',
  'https://github.com',
  '',
  1,
  0,
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'MDN Web Docs',
  'Web 开发者的权威文档',
  'https://developer.mozilla.org',
  '',
  1,
  1,
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'Stack Overflow',
  '程序员问答社区',
  'https://stackoverflow.com',
  '',
  1,
  2,
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'Next.js',
  'React 全栈框架',
  'https://nextjs.org',
  '',
  1,
  3,
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'TypeScript',
  'JavaScript 的超集',
  'https://www.typescriptlang.org',
  '',
  1,
  4,
  datetime('now'),
  datetime('now')
),
(
  'clx' || hex(randomblob(12)),
  'Tailwind CSS',
  '实用优先的 CSS 框架',
  'https://tailwindcss.com',
  '',
  1,
  5,
  datetime('now'),
  datetime('now')
);

-- 查看添加的数据
SELECT '=== Projects ===' as '';
SELECT id, title, slug, featured, published FROM Project;

SELECT '' as '';
SELECT '=== Friend Links ===' as '';
SELECT id, name, url, featured FROM FriendLink;
