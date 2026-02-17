# ZensBlog PostgreSQL Migration Guide

This guide walks you through migrating your ZensBlog from SQLite to PostgreSQL.

## Prerequisites

- Node.js 18+ installed
- Docker installed (for local PostgreSQL)
- Backup of your current SQLite database

## Step 1: Backup Current Database

```bash
cp prisma/dev.db prisma/dev.db.backup
```

## Step 2: Start PostgreSQL

### Option A: Using Docker Compose (Recommended)

```bash
docker-compose up -d postgres
```

### Option B: Using Docker directly

```bash
docker run -d --name zensblog-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=zensblog \
  -p 5432:5432 \
  postgres:16-alpine
```

### Option C: Using a hosted service

Use services like:
- [Supabase](https://supabase.com) (Free tier available)
- [Railway](https://railway.app)
- [Neon](https://neon.tech)
- [Vercel Postgres](https://vercel.com/storage/postgres)

## Step 3: Update Environment Variables

Create or update your `.env` file:

```bash
# Copy from example
cp .env.example .env

# Edit .env and set:
DATABASE_URL="postgresql://postgres:password@localhost:5432/zensblog"
```

For production with connection pooling:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/zensblog?pgbouncer=true&connection_limit=10"
```

## Step 4: Push Schema to PostgreSQL

```bash
npm run db:push
```

This will create all tables in PostgreSQL based on the updated schema.

## Step 5: Enable Full-Text Search Extensions

```bash
# If using Docker:
docker exec -i zensblog-postgres psql -U postgres -d zensblog < prisma/migrations/add_fulltext_search.sql

# If using local PostgreSQL:
psql $DATABASE_URL -f prisma/migrations/add_fulltext_search.sql

# If using hosted service, connect and run the SQL file manually
```

## Step 6: Migrate Data from SQLite

```bash
npm run db:migrate
```

This will:
- Read all data from SQLite
- Insert it into PostgreSQL
- Show progress for each table
- Display a summary when complete

## Step 7: Verify Migration

```bash
# Open Prisma Studio to verify data
npm run db:studio

# Or check via psql
docker exec -it zensblog-postgres psql -U postgres -d zensblog

# Run some queries:
SELECT COUNT(*) FROM "Post";
SELECT COUNT(*) FROM "Comment";
SELECT COUNT(*) FROM "Category";
SELECT COUNT(*) FROM "Tag";
```

## Step 8: Test the Application

```bash
# Start development server
npm run dev

# Test key features:
# - Browse posts
# - Search functionality
# - Create/edit posts (if admin)
# - View projects
# - Check about page
```

## Step 9: Update Production Deployment

### For Vercel:

1. Add PostgreSQL database in Vercel dashboard
2. Set `DATABASE_URL` environment variable
3. Deploy: `vercel --prod`

### For Docker:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

## Troubleshooting

### Migration Script Fails

If the migration script fails partway through:
- It's safe to re-run `npm run db:migrate`
- The script uses `upsert` operations, so it's idempotent

### Full-Text Search Not Working

Check if pg_trgm extension is enabled:
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
```

If not found, run:
```sql
CREATE EXTENSION pg_trgm;
```

### Connection Issues

Check PostgreSQL is running:
```bash
docker ps | grep postgres
```

Test connection:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

### Performance Issues

Add connection pooling to your DATABASE_URL:
```
?pgbouncer=true&connection_limit=10
```

## Rollback to SQLite

If you need to rollback:

1. Stop the application
2. Update `.env`:
   ```
   DATABASE_URL="file:./prisma/dev.db"
   ```
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
4. Run: `npm run db:push`
5. Restart application

## Performance Optimization

### Enable Query Logging (Development)

Add to your Prisma client initialization:
```typescript
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

### Monitor Slow Queries

```sql
-- Enable slow query logging
ALTER DATABASE zensblog SET log_min_duration_statement = 100;

-- View slow queries
SELECT * FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Optimize Indexes

Check index usage:
```sql
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

## Next Steps

- Set up automated backups
- Configure monitoring (e.g., with Grafana)
- Enable SSL for production database connections
- Consider read replicas for high traffic

## Support

If you encounter issues:
1. Check the logs: `docker-compose logs app`
2. Verify database connection: `npm run db:studio`
3. Review the migration summary output
4. Check PostgreSQL logs: `docker-compose logs postgres`
