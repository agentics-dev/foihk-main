-- Article writes use a version-checked administrator API. No production data repair here.
alter table public.articles add column edit_version bigint not null default 1 check (edit_version > 0);

create or replace function private.article_has_content(a public.articles)
returns boolean language sql immutable set search_path = '' as $$
  select exists (
    select 1 from (values (a.title,a.content),(a.title_zhtw,a.content_zhtw),(a.title_zhcn,a.content_zhcn)) as lang(title,content)
    where btrim(coalesce(lang.title,'')) <> '' and (
      exists(select 1 from unnest(a.image_urls) u where u ~ '^https?://')
      or coalesce(lang.content,'') ~* '<img[^>]+src=["'']https?://'
      or btrim(regexp_replace(regexp_replace(regexp_replace(coalesce(lang.content,''), '<(script|style)[^>]*>.*?</\1>', '', 'gis'), '<[^>]*>', '', 'g'), '&nbsp;|&#160;', ' ', 'gi')) <> ''
    )
  );
$$;
revoke all on function private.article_has_content(public.articles) from public, anon, authenticated;

create or replace function private.guard_article_edit()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.edit_version := case when tg_op = 'UPDATE' then old.edit_version + 1 else 1 end;
  if new.published and new.published_at is null then new.published_at := clock_timestamp(); end if;
  if new.published and not private.article_has_content(new) then
    raise exception using errcode='23514', message='A published article needs a title and text or an image in at least one language';
  end if;
  return new;
end; $$;
revoke all on function private.guard_article_edit() from public, anon, authenticated;
create trigger guard_article_edit before insert or update on public.articles
for each row execute function private.guard_article_edit();

create function public.save_article(_patch jsonb, _id uuid default null, _expected_version bigint default null,
  _date_action text default 'preserve', _published_at timestamptz default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.articles; saved public.articles;
begin
  if auth.uid() is null or not exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') then
    raise exception using errcode='42501', message='Administrator role required';
  end if;
  if jsonb_typeof(_patch) is distinct from 'object' or exists(select 1 from jsonb_object_keys(_patch) k where k not in ('title','title_zhtw','title_zhcn','slug','excerpt','excerpt_zhtw','excerpt_zhcn','content','content_zhtw','content_zhcn','seo_title','seo_title_zhtw','seo_title_zhcn','meta_description','meta_description_zhtw','meta_description_zhcn','topic_terms','topic_terms_zhtw','topic_terms_zhcn','author_name','author_name_zhtw','author_name_zhcn','author_title','author_title_zhtw','author_title_zhcn','author_credential','author_credential_zhtw','author_credential_zhcn','faq_show_on_page','faq_include_schema','event_schema_enabled','event_attendance_mode','event_status','event_start_date','event_start_time','event_end_date','event_end_time','event_timezone','event_previous_start_date','event_previous_start_time','event_venue_name','event_venue_name_zhtw','event_venue_name_zhcn','event_address','event_address_zhtw','event_address_zhcn','event_online_url','event_organizer_name','event_organizer_name_zhtw','event_organizer_name_zhcn','event_organizer_url','event_unavailable_fields','image_urls','image_metadata','category','published','public_updated_at')) then
    raise exception using errcode='22023', message='Unsupported article fields';
  end if;
  if _date_action is null or _date_action not in ('preserve','set') or (_date_action='set' and _published_at is null) then
    raise exception using errcode='22023', message='Invalid publication date operation';
  end if;
  if _id is not null then
    select * into v from public.articles where id=_id for update;
    if not found then return jsonb_build_object('outcome','not_found'); end if;
    if _expected_version is distinct from v.edit_version then
      return jsonb_build_object('outcome','conflict','currentVersion',v.edit_version);
    end if;
  else
    v := jsonb_populate_record(null::public.articles, jsonb_build_object('id',gen_random_uuid(),'title','','content','','published',false,'edit_version',1,'image_metadata','{}'::jsonb,'topic_terms','[]'::jsonb,'topic_terms_zhtw','[]'::jsonb,'topic_terms_zhcn','[]'::jsonb,'faq_show_on_page',true,'faq_include_schema',true,'event_schema_enabled',false,'event_timezone','Asia/Hong_Kong','event_unavailable_fields','[]'::jsonb,'created_at',clock_timestamp(),'updated_at',clock_timestamp()));
  end if;
  v := jsonb_populate_record(v,_patch);
  if _date_action='set' then v.published_at := _published_at; end if;
  if (_id is null or _patch ? 'slug') and (v.slug is null or v.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$') then
    raise exception using errcode='22023', message='A valid article URL slug is required';
  end if;
  if v.published and not private.article_has_content(v) then
    raise exception using errcode='23514', message='A published article needs a title and text or an image in at least one language';
  end if;
  if _id is null then
    insert into public.articles (id,title, title_zhtw, title_zhcn, slug, excerpt, excerpt_zhtw, excerpt_zhcn, content, content_zhtw, content_zhcn, seo_title, seo_title_zhtw, seo_title_zhcn, meta_description, meta_description_zhtw, meta_description_zhcn, topic_terms, topic_terms_zhtw, topic_terms_zhcn, author_name, author_name_zhtw, author_name_zhcn, author_title, author_title_zhtw, author_title_zhcn, author_credential, author_credential_zhtw, author_credential_zhcn, faq_show_on_page, faq_include_schema, event_schema_enabled, event_attendance_mode, event_status, event_start_date, event_start_time, event_end_date, event_end_time, event_timezone, event_previous_start_date, event_previous_start_time, event_venue_name, event_venue_name_zhtw, event_venue_name_zhcn, event_address, event_address_zhtw, event_address_zhcn, event_online_url, event_organizer_name, event_organizer_name_zhtw, event_organizer_name_zhcn, event_organizer_url, event_unavailable_fields, image_urls, image_metadata, category, published, public_updated_at, published_at) values(v.id,v.title, v.title_zhtw, v.title_zhcn, v.slug, v.excerpt, v.excerpt_zhtw, v.excerpt_zhcn, v.content, v.content_zhtw, v.content_zhcn, v.seo_title, v.seo_title_zhtw, v.seo_title_zhcn, v.meta_description, v.meta_description_zhtw, v.meta_description_zhcn, v.topic_terms, v.topic_terms_zhtw, v.topic_terms_zhcn, v.author_name, v.author_name_zhtw, v.author_name_zhcn, v.author_title, v.author_title_zhtw, v.author_title_zhcn, v.author_credential, v.author_credential_zhtw, v.author_credential_zhcn, v.faq_show_on_page, v.faq_include_schema, v.event_schema_enabled, v.event_attendance_mode, v.event_status, v.event_start_date, v.event_start_time, v.event_end_date, v.event_end_time, v.event_timezone, v.event_previous_start_date, v.event_previous_start_time, v.event_venue_name, v.event_venue_name_zhtw, v.event_venue_name_zhcn, v.event_address, v.event_address_zhtw, v.event_address_zhcn, v.event_online_url, v.event_organizer_name, v.event_organizer_name_zhtw, v.event_organizer_name_zhcn, v.event_organizer_url, v.event_unavailable_fields, v.image_urls, v.image_metadata, v.category, v.published, v.public_updated_at, v.published_at) returning * into saved;
  else
    update public.articles set title = v.title,
    title_zhtw = v.title_zhtw,
    title_zhcn = v.title_zhcn,
    slug = v.slug,
    excerpt = v.excerpt,
    excerpt_zhtw = v.excerpt_zhtw,
    excerpt_zhcn = v.excerpt_zhcn,
    content = v.content,
    content_zhtw = v.content_zhtw,
    content_zhcn = v.content_zhcn,
    seo_title = v.seo_title,
    seo_title_zhtw = v.seo_title_zhtw,
    seo_title_zhcn = v.seo_title_zhcn,
    meta_description = v.meta_description,
    meta_description_zhtw = v.meta_description_zhtw,
    meta_description_zhcn = v.meta_description_zhcn,
    topic_terms = v.topic_terms,
    topic_terms_zhtw = v.topic_terms_zhtw,
    topic_terms_zhcn = v.topic_terms_zhcn,
    author_name = v.author_name,
    author_name_zhtw = v.author_name_zhtw,
    author_name_zhcn = v.author_name_zhcn,
    author_title = v.author_title,
    author_title_zhtw = v.author_title_zhtw,
    author_title_zhcn = v.author_title_zhcn,
    author_credential = v.author_credential,
    author_credential_zhtw = v.author_credential_zhtw,
    author_credential_zhcn = v.author_credential_zhcn,
    faq_show_on_page = v.faq_show_on_page,
    faq_include_schema = v.faq_include_schema,
    event_schema_enabled = v.event_schema_enabled,
    event_attendance_mode = v.event_attendance_mode,
    event_status = v.event_status,
    event_start_date = v.event_start_date,
    event_start_time = v.event_start_time,
    event_end_date = v.event_end_date,
    event_end_time = v.event_end_time,
    event_timezone = v.event_timezone,
    event_previous_start_date = v.event_previous_start_date,
    event_previous_start_time = v.event_previous_start_time,
    event_venue_name = v.event_venue_name,
    event_venue_name_zhtw = v.event_venue_name_zhtw,
    event_venue_name_zhcn = v.event_venue_name_zhcn,
    event_address = v.event_address,
    event_address_zhtw = v.event_address_zhtw,
    event_address_zhcn = v.event_address_zhcn,
    event_online_url = v.event_online_url,
    event_organizer_name = v.event_organizer_name,
    event_organizer_name_zhtw = v.event_organizer_name_zhtw,
    event_organizer_name_zhcn = v.event_organizer_name_zhcn,
    event_organizer_url = v.event_organizer_url,
    event_unavailable_fields = v.event_unavailable_fields,
    image_urls = v.image_urls,
    image_metadata = v.image_metadata,
    category = v.category,
    published = v.published,
    public_updated_at = v.public_updated_at,
    published_at = v.published_at where id=_id returning * into saved;
  end if;
  return jsonb_build_object('outcome','saved','article',to_jsonb(saved), 'revision',(select revision from public.site_content_revision where id=true));
end; $$;
revoke all on function public.save_article(jsonb,uuid,bigint,text,timestamptz) from public, anon;
grant execute on function public.save_article(jsonb,uuid,bigint,text,timestamptz) to authenticated;

create function public.delete_article(_id uuid, _expected_version bigint)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v public.articles;
begin
  if auth.uid() is null or not exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin') then
    raise exception using errcode='42501', message='Administrator role required';
  end if;
  select * into v from public.articles where id=_id for update;
  if not found then return jsonb_build_object('outcome','not_found'); end if;
  if _expected_version is distinct from v.edit_version then return jsonb_build_object('outcome','conflict','currentVersion',v.edit_version); end if;
  delete from public.articles where id=_id;
  return jsonb_build_object('outcome','deleted','revision',(select revision from public.site_content_revision where id=true));
end; $$;
revoke all on function public.delete_article(uuid,bigint) from public, anon;
grant execute on function public.delete_article(uuid,bigint) to authenticated;
revoke insert, update, delete on public.articles from anon, authenticated;
-- Trusted maintenance/imports also run the invariant trigger under service_role.
grant usage on schema private to service_role;
grant execute on function private.article_has_content(public.articles) to service_role;

-- Match the existing frontend canonical slug normalization for legacy CMS rows.
create or replace function private.site_article_urls(_category public.article_category, _slug text)
returns text[] language sql immutable set search_path = '' as $$
  select array_agg('https://www.foihk.org/' || language || '/articles/' || replace(_category::text,'_','-') || '/' ||
    coalesce(nullif(btrim(regexp_replace(lower(replace(replace(_slug,'''',''),'’','')), '[^a-z0-9]+','-','g'),'-'),''),
      case when position('經濟一週' in _slug)>0 then 'foihk-economic-digest-art-investment-interview' else 'article' end)
    order by language)
  from unnest(array['en','zh-hk','zh-cn']) language;
$$;
