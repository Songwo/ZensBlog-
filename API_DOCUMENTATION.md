# ZensBlog API Documentation

## Overview

This document describes the API endpoints available in ZensBlog after the PostgreSQL migration and optimization.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most write operations require admin authentication. Include session cookies in requests.

## Rate Limiting

All endpoints have rate limiting to prevent abuse. Limits vary by endpoint.

## Caching

Read endpoints use memory caching with the following TTLs:
- Posts list: 60 seconds
- Categories: 300 seconds (5 minutes)
- Tags: 300 seconds (5 minutes)
- Settings: 600 seconds (10 minutes)
- Projects: 120 seconds (2 minutes)
- About page: 600 seconds (10 minutes)

---

## Posts API

### GET /api/posts

Get paginated list of posts.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 20, max: 50) - Items per page
- `published` (string) - Filter by published status ("true" or "false", admin only)

**Response:**
```json
{
  "posts": [
    {
      "id": "clx...",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Post excerpt...",
      "content": "Full content...",
      "coverImage": "/uploads/image.jpg",
      "published": true,
      "pinned": false,
      "views": 42,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": "clx...",
        "name": "Technology",
        "slug": "technology"
      },
      "tags": [
        {
          "tag": {
            "id": "clx...",
            "name": "JavaScript",
            "slug": "javascript"
          }
        }
      ],
      "_count": {
        "comments": 5
      }
    }
  ],
  "total": 100,
  "page": 1,
  "totalPages": 5
}
```

### POST /api/posts

Create a new post (admin only).

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "title": "Post Title",
  "slug": "post-slug",
  "content": "Full content in markdown...",
  "excerpt": "Short excerpt",
  "coverImage": "/uploads/image.jpg",
  "published": true,
  "pinned": false,
  "categoryId": "clx...",
  "tagIds": ["clx...", "clx..."]
}
```

**Response:** Created post object (201)

---

## Projects API

### GET /api/projects

Get list of projects.

**Query Parameters:**
- `published` (string) - Filter by published status ("true" or "false")
- `featured` (string) - Filter by featured status ("true" or "false")

**Response:**
```json
{
  "projects": [
    {
      "id": "clx...",
      "title": "Project Name",
      "slug": "project-slug",
      "description": "Project description...",
      "content": "Detailed content in markdown...",
      "coverImage": "/uploads/project.jpg",
      "demoUrl": "https://demo.example.com",
      "githubUrl": "https://github.com/user/repo",
      "tags": ["React", "TypeScript", "Next.js"],
      "published": true,
      "featured": true,
      "sortOrder": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### POST /api/projects

Create a new project (admin only).

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "title": "Project Name",
  "slug": "project-slug",
  "description": "Project description",
  "content": "Detailed content (optional)",
  "coverImage": "/uploads/project.jpg",
  "demoUrl": "https://demo.example.com",
  "githubUrl": "https://github.com/user/repo",
  "tags": ["React", "TypeScript"],
  "published": true,
  "featured": false,
  "sortOrder": 0
}
```

**Validation:**
- `title`: Required, max 200 characters
- `slug`: Required, max 150 characters, kebab-case format
- `description`: Required, max 5000 characters
- `content`: Optional, max 50000 characters
- `coverImage`: Optional, must be valid URL or start with /uploads/
- `demoUrl`: Optional, must be valid HTTP(S) URL
- `githubUrl`: Optional, must be valid HTTP(S) URL
- `tags`: Optional array, max 10 items

**Response:** Created project object (201)

### GET /api/projects/:id

Get a single project by ID.

**Response:** Project object

### PUT /api/projects/:id

Update a project (admin only).

**Rate Limit:** 60 requests per minute

**Request Body:** Same as POST (all fields optional)

**Response:** Updated project object

### DELETE /api/projects/:id

Delete a project (admin only).

**Rate Limit:** 30 requests per minute

**Response:**
```json
{
  "success": true
}
```

---

## About Page API

### GET /api/about

Get about page content (public).

**Response:**
```json
{
  "id": "about",
  "content": "# About\n\nMarkdown content...",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/about

Update about page content (admin only).

**Rate Limit:** 30 requests per minute

**Request Body:**
```json
{
  "content": "# About\n\nNew markdown content..."
}
```

**Validation:**
- `content`: Required, max 50000 characters

**Response:** Updated about page object

---

## Search API

### GET /api/search

Search posts using PostgreSQL full-text search.

**Rate Limit:** 90 requests per minute

**Query Parameters:**
- `q` (string, required) - Search query (max 80 characters)
- `limit` (number, default: 20, max: 50) - Max results

**Response:**
```json
{
  "results": [
    {
      "id": "clx...",
      "title": "Post Title",
      "slug": "post-slug",
      "excerpt": "Post excerpt...",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "category": {
        "name": "Technology",
        "slug": "technology"
      }
    }
  ],
  "total": 5,
  "query": "search term"
}
```

**Search Algorithm:**
- Uses PostgreSQL `pg_trgm` extension for similarity search
- Weights: title (1.0) > excerpt (0.8) > content (0.6)
- Results sorted by similarity score, then by publish date
- Falls back to basic LIKE search if pg_trgm is unavailable

---

## Categories API

### GET /api/categories

Get all categories.

**Response:**
```json
[
  {
    "id": "clx...",
    "name": "Technology",
    "slug": "technology",
    "sortOrder": 0,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "_count": {
      "posts": 15
    }
  }
]
```

### POST /api/categories

Create a new category (admin only).

**Rate Limit:** 40 requests per minute

**Request Body:**
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "sortOrder": 0
}
```

**Response:** Created category object (201)

---

## Tags API

### GET /api/tags

Get all tags.

**Response:**
```json
[
  {
    "id": "clx...",
    "name": "JavaScript",
    "slug": "javascript",
    "_count": {
      "posts": 25
    }
  }
]
```

### POST /api/tags

Create a new tag (admin only).

**Rate Limit:** 60 requests per minute

**Request Body:**
```json
{
  "name": "Tag Name",
  "slug": "tag-slug"
}
```

**Response:** Created tag object (201)

---

## Settings API

### GET /api/settings

Get site configuration.

**Response:**
```json
{
  "siteName": "Zen's Blog",
  "siteDescription": "A blog about technology",
  "siteUrl": "https://zensblog.dev",
  "authorName": "Zen",
  "effectsLevel": "medium"
}
```

### PUT /api/settings

Update site configuration (admin only).

**Rate Limit:** 20 requests per minute

**Request Body:**
```json
{
  "siteName": "New Site Name",
  "siteDescription": "New description",
  "siteUrl": "https://newurl.com",
  "authorName": "New Author",
  "effectsLevel": "low"
}
```

**Validation:**
- `siteName`: 1-120 characters
- `siteDescription`: max 300 characters
- `siteUrl`: valid HTTP(S) URL, max 200 characters
- `authorName`: 1-80 characters
- `effectsLevel`: one of "low", "medium", "ultra"

**Response:**
```json
{
  "success": true
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (not admin or CSRF check failed)
- `404` - Not Found
- `409` - Conflict (duplicate slug)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Cache Invalidation

Caches are automatically invalidated when:
- Creating/updating/deleting posts → clears `posts:list:*`
- Creating/updating categories → clears `categories:list`
- Creating tags → clears `tags:list`
- Updating settings → clears `settings:all`
- Creating/updating/deleting projects → clears `projects:list:*`
- Updating about page → clears `about:content`

---

## Performance Tips

1. **Use caching headers**: Responses include cache-friendly headers
2. **Paginate large lists**: Use `limit` parameter to reduce payload size
3. **Filter when possible**: Use query parameters to reduce data transfer
4. **Batch requests**: Make parallel requests for independent data
5. **Monitor rate limits**: Implement exponential backoff for 429 responses

---

## Examples

### Fetch published posts with category filter

```javascript
const response = await fetch('/api/posts?published=true&page=1&limit=10');
const data = await response.json();
```

### Create a new project

```javascript
const response = await fetch('/api/projects', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Project',
    slug: 'my-project',
    description: 'A cool project',
    tags: ['React', 'TypeScript'],
    published: true
  })
});
const project = await response.json();
```

### Search posts

```javascript
const query = encodeURIComponent('typescript');
const response = await fetch(`/api/search?q=${query}&limit=20`);
const { results, total } = await response.json();
```

### Update about page

```javascript
const response = await fetch('/api/about', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: '# About Me\n\nI am a developer...'
  })
});
const about = await response.json();
```
