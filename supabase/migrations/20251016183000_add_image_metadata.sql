ALTER TABLE articles ADD COLUMN IF NOT EXISTS image_metadata JSONB DEFAULT '{}'::jsonb;
