alter table public.articles
  add column seo_title text,
  add column seo_title_zhtw text,
  add column seo_title_zhcn text,
  add column meta_description text,
  add column meta_description_zhtw text,
  add column meta_description_zhcn text,
  add column topic_terms text[] not null default '{}',
  add column topic_terms_zhtw text[] not null default '{}',
  add column topic_terms_zhcn text[] not null default '{}';

alter table public.articles
  add constraint articles_seo_title_length
    check (seo_title is null or char_length(seo_title) <= 120),
  add constraint articles_seo_title_zhtw_length
    check (seo_title_zhtw is null or char_length(seo_title_zhtw) <= 120),
  add constraint articles_seo_title_zhcn_length
    check (seo_title_zhcn is null or char_length(seo_title_zhcn) <= 120),
  add constraint articles_meta_description_length
    check (meta_description is null or char_length(meta_description) <= 320),
  add constraint articles_meta_description_zhtw_length
    check (meta_description_zhtw is null or char_length(meta_description_zhtw) <= 320),
  add constraint articles_meta_description_zhcn_length
    check (meta_description_zhcn is null or char_length(meta_description_zhcn) <= 320),
  add constraint articles_topic_terms_limit
    check (cardinality(topic_terms) <= 20),
  add constraint articles_topic_terms_zhtw_limit
    check (cardinality(topic_terms_zhtw) <= 20),
  add constraint articles_topic_terms_zhcn_limit
    check (cardinality(topic_terms_zhcn) <= 20);

create table public.article_faq_items (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  enabled boolean not null default true,
  question text not null default '',
  answer text not null default '',
  question_zhtw text,
  answer_zhtw text,
  question_zhcn text,
  answer_zhcn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint article_faq_question_length check (char_length(question) <= 300),
  constraint article_faq_answer_length check (char_length(answer) <= 5000),
  constraint article_faq_question_zhtw_length check (question_zhtw is null or char_length(question_zhtw) <= 300),
  constraint article_faq_answer_zhtw_length check (answer_zhtw is null or char_length(answer_zhtw) <= 5000),
  constraint article_faq_question_zhcn_length check (question_zhcn is null or char_length(question_zhcn) <= 300),
  constraint article_faq_answer_zhcn_length check (answer_zhcn is null or char_length(answer_zhcn) <= 5000)
);

create index article_faq_items_article_position_idx
  on public.article_faq_items (article_id, position, id);

create trigger update_article_faq_items_updated_at
before update on public.article_faq_items
for each row execute function public.update_updated_at_column();

alter table public.article_faq_items enable row level security;
revoke all on table public.article_faq_items from anon, authenticated;
grant select on table public.article_faq_items to anon, authenticated;
grant insert, update, delete on table public.article_faq_items to authenticated;

create policy "Published article FAQ items are publicly viewable"
  on public.article_faq_items
  for select
  to anon, authenticated
  using (
    enabled
    and exists (
      select 1
      from public.articles
      where articles.id = article_faq_items.article_id
        and articles.published
    )
  );

create policy "Admins can view all article FAQ items"
  on public.article_faq_items
  for select
  to authenticated
  using ((select private.current_user_has_role('admin')));

create policy "Admins can create article FAQ items"
  on public.article_faq_items
  for insert
  to authenticated
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can update article FAQ items"
  on public.article_faq_items
  for update
  to authenticated
  using ((select private.current_user_has_role('admin')))
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can delete article FAQ items"
  on public.article_faq_items
  for delete
  to authenticated
  using ((select private.current_user_has_role('admin')));

create table public.article_slug_history (
  id bigint generated always as identity primary key,
  article_id uuid not null references public.articles(id) on delete cascade,
  old_slug text not null,
  category public.article_category not null,
  created_at timestamptz not null default now(),
  unique (category, old_slug)
);

create index article_slug_history_article_idx
  on public.article_slug_history (article_id);

alter table public.article_slug_history enable row level security;
revoke all on table public.article_slug_history from anon, authenticated;
grant select on table public.article_slug_history to anon, authenticated;

create policy "Article slug history is publicly viewable"
  on public.article_slug_history
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.articles
      where articles.id = article_slug_history.article_id
        and articles.published
    )
  );

create policy "Admins can view all article slug history"
  on public.article_slug_history
  for select
  to authenticated
  using ((select private.current_user_has_role('admin')));

create function private.capture_article_slug_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.article_slug_history
    where category = new.category
      and old_slug = new.slug
      and article_id <> new.id
  ) then
    raise exception 'This published article slug is reserved by redirect history';
  end if;

  if (old.published or old.published_at is not null)
    and (old.slug is distinct from new.slug or old.category is distinct from new.category) then
    insert into public.article_slug_history (article_id, old_slug, category)
    values (old.id, old.slug, old.category)
    on conflict (category, old_slug) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function private.capture_article_slug_history() from public, anon, authenticated;

create trigger capture_article_slug_history_before_update
before update of slug, category on public.articles
for each row execute function private.capture_article_slug_history();

create function private.reject_reserved_article_slug()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.article_slug_history
    where category = new.category
      and old_slug = new.slug
  ) then
    raise exception 'This published article slug is reserved by redirect history';
  end if;
  return new;
end;
$$;

revoke all on function private.reject_reserved_article_slug() from public, anon, authenticated;

create trigger reject_reserved_article_slug_before_insert
before insert on public.articles
for each row execute function private.reject_reserved_article_slug();
