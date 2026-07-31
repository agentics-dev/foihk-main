-- Split Chinese columns into Traditional Chinese (zh-TW) and Simplified Chinese (zh-CN)
-- Add Traditional Chinese columns
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS title_zhtw TEXT,
ADD COLUMN IF NOT EXISTS content_zhtw TEXT,
ADD COLUMN IF NOT EXISTS excerpt_zhtw TEXT;

-- Add Simplified Chinese columns
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS title_zhcn TEXT,
ADD COLUMN IF NOT EXISTS content_zhcn TEXT,
ADD COLUMN IF NOT EXISTS excerpt_zhcn TEXT;

-- Migrate existing _zh data to _zhtw (the old field served as Traditional Chinese)
UPDATE articles
SET title_zhtw = title_zh,
    content_zhtw = content_zh,
    excerpt_zhtw = excerpt_zh
WHERE title_zh IS NOT NULL
   OR content_zh IS NOT NULL
   OR excerpt_zh IS NOT NULL;

-- Drop old _zh columns
ALTER TABLE articles
DROP COLUMN IF EXISTS title_zh,
DROP COLUMN IF EXISTS content_zh,
DROP COLUMN IF EXISTS excerpt_zh;
