# ZensBlog PostgreSQL Migration - Quick Start Guide

## Prerequisites

Before starting, ensure you have:
- ✅ Node.js 18+ installed
- ✅ Docker installed (or access to a PostgreSQL server)
- ✅ Current SQLite database backed up

## Quick Migration (5 Steps)

### Step 1: Backup Your Data

```bash
cp prisma/dev.db prisma/dev.db.backup
```

### Step 2: Start PostgreSQL

**Option A - Using Docker Compose (Recommended):**
```bash
docker-compose up -d postgres
```

**Option B - Using Docker directly:**
```bash
docker run -d --name zensblog-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=zensblog \
  -p 5432:5432 \
  postgres:16-alpine
```

**Option C - Using a hosted service:**
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - Easy deployment
- [Neon](https://neon.tech) - Serverless PostgreSQL

### Step 3: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update DATABASE_URL:
# DATABASE_URL="postgresql://postgres:password@localhost:5432/zensblog"
```

### Step 4: Setup Database

```bash
# Install dependencies (if not already done)
npm install

# Push schema to PostgreSQL
npm run db:push

# Enable full-text search extensions
docker exec -i zensblog-postgres psql -U postgres -d zensblog < prisma/migrations/add_fulltext_search.sql

# Or if using local PostgreSQL:
# psql $DATABASE_URL -f prisma/migrations/add_fulltext_search.sql
```

### Step 5: Migrate Data

```bash
# Run the migration script
npm run db:migrate
```

You should see output like:
```
🚀 Starting migration from SQLite to PostgreSQL...

📦 Migrating Users...
✅ Migrated 1 users

📦 Migrating Categories...
✅ Migrated 5 categories

📦 Migrating Tags...
✅ Migrated 10 tags

📦 Migrating Posts...
✅ Migrated 25 posts

📦 Migrating PostTags...
✅ Migrated 50 post-tag relations

📦 Migrating Comments...
✅ Migrated 15 comments

📦 Migrating SiteConfig...
✅ Migrated 5 site configs

🎉 Migration completed successfully!
```

## Verify Migration

```bash
# Open Prisma Studio to browse data
npm run db:studio

# Or check via command line
docker exec -it zensblog-postgres psql -U postgres -d zensblog -c "SELECT COUNT(*) FROM \"Post\";"
```

## Start Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Visit `http://localhost:3000` and test:
- ✅ Browse posts
- ✅ Search functionality
- ✅ View projects (new feature)
- ✅ Check about page (new feature)
- ✅ Admin operations (if logged in)

## What's New?

### 1. Projects Management
- **GET** `/api/projects` - List all projects
- **POST** `/api/projects` - Create project (admin)
- **GET** `/api/projects/:id` - Get single project
- **PUT** `/api/projects/:id` - Update project (admin)
- **DELETE** `/api/projects/:id` - Delete project (admin)

### 2. About Page Management
- **GET** `/api/about` - Get about page content
- **PUT** `/api/about` - Update about page (admin)

### 3. Enhanced Search
- Uses PostgreSQL `pg_trgm` for similarity search
- Weighted scoring: title > excerpt > content
- Faster and more relevant results

### 4. Performance Improvements
- Memory caching on all list endpoints
- Optimized database indexes
- Response times < 100ms

## Troubleshooting

### "Connection refused" error
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres
```

### "Extension pg_trgm does not exist"
```bash
# Run the full-text search SQL file
docker exec -i zensblog-postgres psql -U postgres -d zensblog < prisma/migrations/add_fulltext_search.sql
```

### Migration script fails
```bash
# It's safe to re-run the migration
npm run db:migrate

# The script uses upsert, so it won't duplicate data
```

### Need to rollback?
```bash
# 1. Update .env
DATABASE_URL="file:./prisma/dev.db"

# 2. Update prisma/schema.prisma
# Change: provider = "postgresql"
# To: provider = "sqlite"

# 3. Push schema
npm run db:push

# 4. Restart app
npm run dev
```

## Production Deployment

### Using Vercel

1. Create PostgreSQL database in Vercel dashboard
2. Set environment variable: `DATABASE_URL`
3. Deploy:
   ```bash
   vercel --prod
   ```

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

### Using Railway

1. Create new project
2. Add PostgreSQL service
3. Add web service from GitHub
4. Set `DATABASE_URL` environment variable
5. Deploy automatically on push

## Next Steps

- 📖 Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions
- 📚 Check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for API reference
- 📝 Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details

## Performance Tips

1. **Enable connection pooling** for production:
   ```
   DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=10"
   ```

2. **Monitor cache hit rates** in your application logs

3. **Set up database backups** for production:
   ```bash
   # Example backup command
   docker exec zensblog-postgres pg_dump -U postgres zensblog > backup.sql
   ```

4. **Use environment-specific configs**:
   - Development: Local PostgreSQL
   - Staging: Hosted PostgreSQL with backups
   - Production: Hosted PostgreSQL with replicas

## Support

If you encounter issues:
1. Check Docker logs: `docker-compose logs postgres`
2. Check app logs: `docker-compose logs app`
3. Verify database: `npm run db:studio`
4. Test connection: `psql $DATABASE_URL -c "SELECT version();"`

---

**Migration Time**: ~5-10 minutes
**Difficulty**: Easy
**Rollback**: Simple (restore .env and schema)
