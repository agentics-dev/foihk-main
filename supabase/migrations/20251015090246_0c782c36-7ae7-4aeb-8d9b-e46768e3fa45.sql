-- Create enum for article types
CREATE TYPE public.article_category AS ENUM ('education_research', 'news_events');

-- Create education & research articles table
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  category public.article_category NOT NULL,
  image_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published articles
CREATE POLICY "Published articles are publicly viewable" 
ON public.articles 
FOR SELECT 
USING (published = true);

-- Policy: Authenticated users can view all articles (for admin)
CREATE POLICY "Authenticated users can view all articles" 
ON public.articles 
FOR SELECT 
TO authenticated
USING (true);

-- Policy: Authenticated users can create articles
CREATE POLICY "Authenticated users can create articles" 
ON public.articles 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update articles
CREATE POLICY "Authenticated users can update articles" 
ON public.articles 
FOR UPDATE 
TO authenticated
USING (true);

-- Policy: Authenticated users can delete articles
CREATE POLICY "Authenticated users can delete articles" 
ON public.articles 
FOR DELETE 
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_articles_updated_at
BEFORE UPDATE ON public.articles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_articles_category ON public.articles(category);
CREATE INDEX idx_articles_published ON public.articles(published);
CREATE INDEX idx_articles_slug ON public.articles(slug);