-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true);

-- Create storage policies for article images
CREATE POLICY "Anyone can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update article images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images' AND auth.uid() IS NOT NULL);

-- Modify articles table to store multiple image URLs
ALTER TABLE public.articles
ADD COLUMN image_urls text[];

-- Migrate existing image_url data to image_urls array
UPDATE public.articles
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL;

-- Drop old image_url column
ALTER TABLE public.articles
DROP COLUMN image_url;