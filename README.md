# ZensBlog

A modern, full-stack blog system built with Next.js 15, TypeScript, and PostgreSQL.

## Features

### Core Functionality
- 📝 **Post Management** - Create, edit, and publish blog posts with markdown support
- 🏷️ **Categories & Tags** - Organize content with categories and tags
- 💬 **Comments System** - Nested comments with approval workflow
- 🔍 **Advanced Search** - PostgreSQL full-text search with similarity ranking
- 📊 **Projects Showcase** - Display your portfolio projects
- 👤 **About Page** - Dynamic about page management
- 🔐 **Authentication** - Secure admin authentication with NextAuth.js

### Performance & Optimization
- ⚡ **Memory Caching** - Intelligent caching with automatic invalidation
- 🚀 **Optimized Queries** - Strategic database indexes for fast queries
- 📈 **Rate Limiting** - Built-in rate limiting for API protection
- 🎯 **Response Times** - < 100ms for most endpoints

### Developer Experience
- 🛠️ **TypeScript** - Full type safety across the stack
- 🎨 **Tailwind CSS** - Utility-first styling
- 📦 **Prisma ORM** - Type-safe database access
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 📚 **Comprehensive Docs** - Detailed API and migration documentation

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (with SQLite support)
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Markdown**: next-mdx-remote with syntax highlighting (Shiki)
- **Deployment**: Docker, Vercel, Railway

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ZensBlog

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and configure your settings

# Start PostgreSQL (using Docker)
docker-compose up -d postgres

# Setup database
npm run db:push
docker exec -i zensblog-postgres psql -U postgres -d zensblog < prisma/migrations/add_fulltext_search.sql

# Seed database (optional)
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see your blog!

### Using SQLite (Development)

If you prefer SQLite for development:

```bash
# Update .env
DATABASE_URL="file:./prisma/dev.db"

# Update prisma/schema.prisma
# Change: provider = "postgresql"
# To: provider = "sqlite"

# Push schema
npm run db:push

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

## Migration from SQLite to PostgreSQL

If you're migrating from SQLite to PostgreSQL, see our comprehensive guides:

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-step quick migration guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Detailed migration instructions
- **[README_MIGRATION.md](./README_MIGRATION.md)** - Implementation overview

Quick migration:
```bash
# 1. Backup
cp prisma/dev.db prisma/dev.db.backup

# 2. Start PostgreSQL
docker-compose up -d postgres

# 3. Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/zensblog"

# 4. Setup
npm run db:push
docker exec -i zensblog-postgres psql -U postgres -d zensblog < prisma/migrations/add_fulltext_search.sql

# 5. Migrate data
npm run db:migrate
```

## API Documentation

Complete API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

### Key Endpoints

#### Posts
- `GET /api/posts` - List posts (with pagination)
- `POST /api/posts` - Create post (admin)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post (admin)
- `DELETE /api/posts/:id` - Delete post (admin)

#### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project (admin)
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id` - Update project (admin)
- `DELETE /api/projects/:id` - Delete project (admin)

#### Search
- `GET /api/search?q=query` - Search posts with full-text search

#### About
- `GET /api/about` - Get about page content
- `PUT /api/about` - Update about page (admin)

#### Categories & Tags
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category (admin)
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag (admin)

#### Settings
- `GET /api/settings` - Get site configuration
- `PUT /api/settings` - Update site configuration (admin)

## Project Structure

```
ZensBlog/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # SQL migrations
│   └── seed.ts               # Database seeding
├── scripts/
│   └── migrate-to-postgres.ts # Migration script
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   ├── (pages)/          # Page routes
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   ├── lib/
│   │   ├── db.ts            # Prisma client
│   │   ├── cache.ts         # Caching utility
│   │   ├── search.ts        # Search functionality
│   │   ├── api.ts           # API utilities
│   │   └── auth.ts          # Authentication
│   └── styles/              # Global styles
├── public/                   # Static assets
├── docker-compose.yml        # Docker configuration
└── package.json             # Dependencies
```

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:push         # Push schema to database
npm run db:seed         # Seed database with sample data
npm run db:studio       # Open Prisma Studio
npm run db:migrate      # Migrate data from SQLite to PostgreSQL
npm run db:setup        # Setup PostgreSQL with extensions
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/zensblog"

# Authentication
AUTH_SECRET="your-secret-key"

# Optional: Rate Limiting (Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Optional: Cloud Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_FOLDER="zensblog"
```

## Deployment

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Using Vercel

1. Create PostgreSQL database in Vercel dashboard
2. Set environment variables
3. Deploy:
   ```bash
   vercel --prod
   ```

### Using Railway

1. Create new project from GitHub
2. Add PostgreSQL service
3. Set `DATABASE_URL` environment variable
4. Deploy automatically on push

## Performance

### Caching Strategy

- **Posts list**: 60 seconds TTL
- **Categories**: 300 seconds TTL
- **Tags**: 300 seconds TTL
- **Settings**: 600 seconds TTL
- **Projects**: 120 seconds TTL
- **About page**: 600 seconds TTL

Cache automatically invalidates on data mutations.

### Database Optimization

- Strategic indexes on frequently queried fields
- PostgreSQL `pg_trgm` extension for similarity search
- Connection pooling support
- Optimized query patterns

### Expected Performance

- Posts list (cached): < 10ms
- Posts list (uncached): < 50ms
- Search: < 80ms
- Create/Update: < 100ms

## Security

- ✅ Rate limiting on all endpoints
- ✅ CSRF protection (same-origin checks)
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (Prisma)
- ✅ XSS protection
- ✅ Secure authentication (NextAuth.js)
- ✅ Security headers on all responses

## Testing

```bash
# Test API endpoints
curl http://localhost:3000/api/posts
curl http://localhost:3000/api/projects
curl http://localhost:3000/api/search?q=test

# Test with authentication (admin)
# Login first, then use session cookies
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests if applicable
5. Submit a pull request

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Database migration guide
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Technical details

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
psql $DATABASE_URL -c "SELECT version();"

# View logs
docker-compose logs postgres
```

### Migration Issues

```bash
# Reset database (development only!)
npm run db:push -- --force-reset

# Re-run migration
npm run db:migrate
```

### Cache Issues

Cache is stored in memory and clears on application restart. For production with multiple instances, consider using Redis.

## License

MIT License - feel free to use this project for your own blog!

## Support

For issues and questions:
- Check the documentation files
- Review [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Check Docker logs: `docker-compose logs`
- Open an issue on GitHub

## Roadmap

- [ ] Redis integration for distributed caching
- [ ] Image optimization and CDN integration
- [ ] Real-time features with WebSockets
- [ ] GraphQL API layer
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] RSS feed improvements
- [ ] Email notifications

---

Built with ❤️ using Next.js, TypeScript, and PostgreSQL
