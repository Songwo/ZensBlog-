# ZensBlog 2.0

一个面向个人创作者与开发者的全栈博客系统（Next.js + Prisma）。

## 1. 项目定位

ZensBlog 2.0 提供：
- 文章发布、评论、审核、举报
- 个人资料与设置中心（头像、2FA、通知、集成）
- 社区帖子、标签分类、推荐与链接卡片
- 管理后台（文章/评论/资料/广告/赞赏配置）

适合：
- 想快速搭建个人博客的小白
- 希望继续二次开发的前端/全栈开发者

## 2. 环境要求

- Node.js 18+
- npm 9+
- Windows / macOS / Linux
- 数据库：默认 SQLite（开箱即用）

## 3. 小白快速启动（5 分钟）

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```
至少确认这些变量：
```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="your-random-secret"
NEXTAUTH_URL="http://localhost:3000"
```

3. 初始化数据库
```bash
npm run db:push
npm run db:seed
```

4. 启动开发环境
```bash
npm run dev
```

5. 打开浏览器
- 前台：http://localhost:3000
- 管理后台：http://localhost:3000/admin

## 4. 默认管理员说明

请以你当前 `.env` 和 `prisma/seed.ts` 实际配置为准。若登录失败：

1. 重新执行 `npm run db:seed`
2. 检查 `.env` 里的管理员用户名/密码配置
3. 确认数据库路径和 `DATABASE_URL` 一致

## 5. 配置教程（小白向）

### 5.1 站点基础信息
路径：`后台 -> 站点设置`

可配置：
- 站点名称
- 站点描述
- 站点 URL
- 作者名称
- 动效强度

### 5.2 赞赏二维码配置（2.0）
路径：`后台 -> 站点设置 -> 赞赏设置`

填写：
- 赞赏二维码图片 URL（http/https）
- 赞赏文案

效果：文章详情页的“赞赏弹窗”会直接展示二维码。

### 5.3 广告位配置（2.0）
路径：`后台 -> 站点设置 -> 广告位设置`

填写：
- 广告标题
- 广告描述
- 广告图片 URL
- 广告跳转链接

效果：文章详情页侧栏广告位自动更新。

### 5.4 用户资料与安全
路径：`前台 -> 设置中心`

可配置：
- 头像上传（自动裁剪）
- 昵称、简介、社交链接
- 2FA（Google Authenticator）
- 通知渠道（站内、邮箱、Webhook）
- 快速预览卡片样式和展示字段

## 6. 使用攻略（2.0）

### 6.1 内容发布流程建议
1. 先发草稿
2. 预览 Markdown
3. 设置摘要与封面
4. 发布后观察评论与通知

### 6.2 评论治理建议
- 开启评论审核
- 管理端每天清理 `SPAM/REJECTED`
- 对高频举报内容优先处理

### 6.3 提升互动
- 在资料页设置徽章与简介
- 开启链接卡片（GitHub/普通链接）
- 使用赞赏二维码和广告位获取持续支持

### 6.4 全站头像快速预览
2.0 已支持多个入口点击头像/作者名弹出预览卡片（评论区、文章作者区、社区列表等），可在设置中心自定义卡片展示内容。

## 7. 常用命令

```bash
npm run dev          # 开发环境
npm run build        # 生产构建
npm run start        # 启动生产服务
npm run lint         # 代码检查
npm run db:push      # 同步 Prisma schema
npm run db:seed      # 填充初始数据
npm run db:studio    # 打开 Prisma Studio
```

## 8. 性能优化（2.0 已落地）

已完成：
- 导航体感优化：减少 Header 过度预取请求
- 用户头像资料请求增加短期内存缓存，减少重复加载
- 图片优化格式启用 `AVIF/WebP`
- 文章/评论等关键交互保留骨架屏与增量通知优化

建议上线配置：
- 使用 `npm run build && npm run start` 验证生产性能
- 反向代理开启 gzip/br 压缩
- 图片尽量使用 CDN + WebP

## 9. 部署简版

### Docker
```bash
docker-compose up -d
```

### Node 直接部署
```bash
npm install
npm run build
npm run start
```

## 10. 常见问题

### Q1: 登录后又跳回登录页
- 检查 `NEXTAUTH_URL`
- 检查浏览器是否禁用 Cookie
- 检查服务端时间是否正确

### Q2: Prisma 报 datasource URL 错误
- 若使用 SQLite：`DATABASE_URL="file:./prisma/dev.db"`
- 若使用 Postgres：`DATABASE_URL="postgresql://..."`
- 确保和 `prisma/schema.prisma` provider 匹配

### Q3: 页面跳转慢
- 先用生产模式测试：`npm run build && npm run start`
- 清理浏览器插件干扰
- 检查是否存在慢 API（Network 面板）

## 11. License

MIT
