-- Enable pg_trgm extension for trigram similarity search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for Post table full-text search
CREATE INDEX IF NOT EXISTS idx_post_title_trgm ON "Post" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_post_content_trgm ON "Post" USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_post_excerpt_trgm ON "Post" USING gin (excerpt gin_trgm_ops);

-- Create GIN indexes for Project table full-text search
CREATE INDEX IF NOT EXISTS idx_project_title_trgm ON "Project" USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_project_description_trgm ON "Project" USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_project_content_trgm ON "Project" USING gin (content gin_trgm_ops);

-- Optional: Create tsvector columns for full-text search (alternative approach)
-- ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS search_vector tsvector
--   GENERATED ALWAYS AS (
--     setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
--     setweight(to_tsvector('simple', coalesce(excerpt, '')), 'B') ||
--     setweight(to_tsvector('simple', coalesce(content, '')), 'C')
--   ) STORED;
-- CREATE INDEX IF NOT EXISTS idx_post_search_vector ON "Post" USING gin (search_vector);
