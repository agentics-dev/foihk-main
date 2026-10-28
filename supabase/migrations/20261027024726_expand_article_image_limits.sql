-- Keep Storage's single-file limit and the article gallery limit enforceable by the server.
do $$
begin
  update storage.buckets
  set file_size_limit = 10 * 1024 * 1024,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
  where id = 'article-images';
  if not found then
    raise exception 'article-images bucket is missing';
  end if;
end $$;

alter table public.articles
  add constraint articles_image_urls_limit
  check (image_urls is null or cardinality(image_urls) <= 10);

-- Article images are edited in the admin UI; signed-in non-admins must not mutate them.
do $$
begin
  if to_regprocedure('private.current_user_has_role(public.app_role)') is null
     or has_function_privilege('anon', 'private.current_user_has_role(public.app_role)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'private.current_user_has_role(public.app_role)', 'EXECUTE') then
    raise exception 'Admin role helper is missing or has unexpected permissions';
  end if;
end $$;

drop policy if exists "Authenticated users can upload article images" on storage.objects;
drop policy if exists "Authenticated users can update article images" on storage.objects;
drop policy if exists "Authenticated users can delete article images" on storage.objects;
drop policy if exists "Admins can upload article images" on storage.objects;
drop policy if exists "Admins can update article images" on storage.objects;
drop policy if exists "Admins can delete article images" on storage.objects;

create policy "Admins can upload article images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'article-images' and (select private.current_user_has_role('admin')));

create policy "Admins can update article images" on storage.objects
  for update to authenticated
  using (bucket_id = 'article-images' and (select private.current_user_has_role('admin')))
  with check (bucket_id = 'article-images' and (select private.current_user_has_role('admin')));

create policy "Admins can delete article images" on storage.objects
  for delete to authenticated
  using (bucket_id = 'article-images' and (select private.current_user_has_role('admin')));
