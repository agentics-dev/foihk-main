alter table public.articles
add column public_updated_at timestamp with time zone;

update public.articles
set public_updated_at = coalesce(updated_at, published_at, created_at)
where public_updated_at is null;

comment on column public.articles.public_updated_at is
  'Public-facing article modified date shown to visitors and structured data. System updated_at remains the internal last-save timestamp.';
