#!/bin/bash

# ZensBlog 示例数据导入脚本
# 使用方法: bash scripts/import-sample-data.sh

echo "🚀 开始导入示例数据..."

# 检查数据库文件是否存在
if [ ! -f "prisma/dev.db" ]; then
  echo "❌ 数据库文件不存在，请先运行 npx prisma db push"
  exit 1
fi

# 导入数据
sqlite3 prisma/dev.db < scripts/seed-sample-data.sql

if [ $? -eq 0 ]; then
  echo "✅ 示例数据导入成功！"
  echo ""
  echo "已添加："
  echo "  - 3 个示例项目"
  echo "  - 6 个示例友链"
  echo ""
  echo "现在可以访问："
  echo "  - http://localhost:3000/projects (项目页)"
  echo "  - http://localhost:3000/friends (友链页)"
  echo "  - http://localhost:3000 (首页查看精选模块)"
else
  echo "❌ 导入失败，请检查错误信息"
  exit 1
fi
