# ZensBlog 快速开始指南

## 🚀 立即开始

### 1. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看效果

### 2. 查看新功能

#### 导航栏
- 点击顶部导航查看新增的"项目"和"友链"链接
- 在移动设备上查看响应式汉堡菜单
- hover 查看粉色下划线动画

#### 项目页 (/projects)
- 访问 http://localhost:3000/projects
- 查看项目网格布局
- 点击 Demo 和 GitHub 按钮

#### 友链页 (/friends)
- 访问 http://localhost:3000/friends
- 查看友链卡片展示
- 查看申请友链区域

#### 首页精选
- 访问 http://localhost:3000
- 滚动到 "Recent Drops" 下方
- 查看 "Featured Projects" 和 "精选友链" 模块

## 📝 添加示例数据

### 方法 1: 使用 Prisma Studio (推荐)

```bash
npx prisma studio
```

在浏览器中打开 Prisma Studio，然后：

1. **添加项目**:
   - 点击 "Project" 表
   - 点击 "Add record"
   - 填写字段:
     - title: "我的第一个项目"
     - slug: "my-first-project"
     - description: "这是一个很棒的项目"
     - tags: "React,TypeScript,Next.js"
     - published: true
     - featured: true
     - demoUrl: "https://demo.example.com"
     - githubUrl: "https://github.com/user/repo"
   - 点击 "Save 1 change"

2. **添加友链**:
   - 点击 "FriendLink" 表
   - 点击 "Add record"
   - 填写字段:
     - name: "示例博客"
     - description: "一个很棒的技术博客"
     - url: "https://example.com"
     - featured: true
   - 点击 "Save 1 change"

### 方法 2: 使用 API (需要管理员权限)

#### 添加项目

```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "title": "ZensBlog",
    "slug": "zensblog",
    "description": "一个极简风格的个人技术博客系统，使用 Next.js 15 + TypeScript + Prisma 构建",
    "tags": "Next.js,TypeScript,Prisma,TailwindCSS",
    "coverImage": "",
    "demoUrl": "https://zensblog.dev",
    "githubUrl": "https://github.com/user/zensblog",
    "published": true,
    "featured": true,
    "sortOrder": 0
  }'
```

#### 添加友链

```bash
curl -X POST http://localhost:3000/api/friends \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "GitHub",
    "description": "全球最大的代码托管平台",
    "url": "https://github.com",
    "avatar": "",
    "featured": true,
    "sortOrder": 0
  }'
```

### 方法 3: 直接操作数据库

```bash
# 打开 SQLite 数据库
sqlite3 prisma/dev.db
```

```sql
-- 添加项目
INSERT INTO Project (
  id, title, slug, description, tags,
  published, featured, sortOrder,
  demoUrl, githubUrl, coverImage, content,
  createdAt, updatedAt
) VALUES (
  'clx' || hex(randomblob(12)),
  'ZensBlog',
  'zensblog',
  '一个极简风格的个人技术博客系统',
  'Next.js,TypeScript,Prisma',
  1,
  1,
  0,
  'https://zensblog.dev',
  'https://github.com/user/zensblog',
  '',
  '',
  datetime('now'),
  datetime('now')
);

-- 添加友链
INSERT INTO FriendLink (
  id, name, description, url, avatar,
  featured, sortOrder,
  createdAt, updatedAt
) VALUES (
  'clx' || hex(randomblob(12)),
  'GitHub',
  '全球最大的代码托管平台',
  'https://github.com',
  '',
  1,
  0,
  datetime('now'),
  datetime('now')
);

-- 查看数据
SELECT * FROM Project;
SELECT * FROM FriendLink;

-- 退出
.quit
```

## 🎨 自定义样式

### 修改导航栏颜色

编辑 `src/app/globals.css`:

```css
.zen-nav-link {
  color: #2f3139;
  transition: color 0.2s ease;
}

.zen-nav-link:hover {
  color: var(--color-accent); /* 修改这里改变 hover 颜色 */
}
```

### 修改卡片样式

编辑 `src/app/globals.css`:

```css
.zen-glass-card {
  background: rgba(255, 255, 255, 0.6); /* 修改透明度 */
  backdrop-filter: blur(14px); /* 修改模糊度 */
}

.zen-glass-card:hover {
  transform: translateY(-8px); /* 修改上浮距离 */
}
```

### 修改粉色主题

编辑 `src/app/globals.css`:

```css
:root {
  --color-accent: #f05d9a; /* 主粉色 */
  --color-accent-soft: #f9d9e7; /* 浅粉色 */
}
```

## 📱 响应式测试

### 测试不同设备

1. **桌面 (1920px)**:
   - 导航栏显示所有链接
   - 项目页 2 列网格
   - 友链页 6 列网格

2. **笔记本 (1280px)**:
   - 导航栏正常显示
   - 项目页 2 列网格
   - 友链页 4 列网格

3. **平板 (768px)**:
   - 导航栏切换到汉堡菜单
   - 项目页 1 列网格
   - 友链页 3 列网格

4. **手机 (375px)**:
   - 汉堡菜单
   - 所有页面 1-2 列网格
   - 紧凑布局

### Chrome DevTools 测试

```
F12 → Toggle device toolbar (Ctrl+Shift+M)
选择设备: iPhone 12 Pro, iPad, Desktop
```

## 🔧 常见问题

### Q: 导航栏没有显示新链接？

A: 清除浏览器缓存或硬刷新 (Ctrl+Shift+R)

### Q: 项目页显示"暂无项目"？

A: 需要先添加项目数据，参考上面的"添加示例数据"部分

### Q: 友链页显示"暂无友链"？

A: 需要先添加友链数据，参考上面的"添加示例数据"部分

### Q: 首页没有显示精选模块？

A: 确保项目/友链的 `featured` 字段设置为 `true`

### Q: 移动端菜单无法打开？

A: 确保 JavaScript 已启用，检查浏览器控制台是否有错误

### Q: API 返回 401 错误？

A: 需要先登录管理员账号才能创建/更新/删除数据

### Q: 数据库表不存在？

A: 运行 `npx prisma db push` 推送 schema 到数据库

## 🎯 下一步

### 1. 添加更多内容

- 创建 3-5 个项目
- 添加 6-10 个友链
- 设置精选项目和友链

### 2. 自定义样式

- 调整颜色主题
- 修改卡片样式
- 优化响应式布局

### 3. 优化 SEO

- 添加项目页 meta 标签
- 添加友链页 meta 标签
- 生成 sitemap

### 4. 部署上线

- 选择托管平台 (Vercel, Railway, etc.)
- 配置环境变量
- 推送代码部署

## 📚 相关文档

- **NAVIGATION_EXPANSION.md** - 完整实现文档
- **VISUAL_DESIGN_FINAL.md** - 视觉设计文档
- **API_DOCUMENTATION.md** - API 参考文档
- **MIGRATION_GUIDE.md** - 数据库迁移指南

## 💡 提示

### 性能优化

- 项目和友链列表都有缓存 (300s)
- 首页精选数据在服务端获取
- 图片使用 Next.js Image 组件优化

### 安全性

- 所有写操作需要管理员权限
- 速率限制防止滥用
- 输入验证防止注入攻击
- CSRF 保护 (同源检查)

### 可访问性

- 语义化 HTML 标签
- 键盘导航支持
- 适当的 ARIA 标签
- 高对比度文字

## 🎉 享受你的新博客！

现在你的 ZensBlog 已经拥有：

✅ 完整的导航系统
✅ 项目展示功能
✅ 友链管理功能
✅ 首页精选模块
✅ 响应式设计
✅ 玻璃态效果
✅ 粉色主题
✅ 禅意风格

开始创建内容，分享你的技术之旅吧！

---

**需要帮助？**
- 查看文档目录中的其他 .md 文件
- 检查浏览器控制台的错误信息
- 使用 `npm run db:studio` 查看数据库
