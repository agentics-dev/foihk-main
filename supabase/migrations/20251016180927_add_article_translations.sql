-- Add Chinese translation columns to articles table for multi-language support
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS title_zh TEXT,
ADD COLUMN IF NOT EXISTS content_zh TEXT,
ADD COLUMN IF NOT EXISTS excerpt_zh TEXT;

COMMENT ON COLUMN articles.title_zh IS 'Chinese (zh-TW/zh-CN) translation of the title';
COMMENT ON COLUMN articles.content_zh IS 'Chinese (zh-TW/zh-CN) translation of the content';
COMMENT ON COLUMN articles.excerpt_zh IS 'Chinese (zh-TW/zh-CN) translation of the excerpt';
