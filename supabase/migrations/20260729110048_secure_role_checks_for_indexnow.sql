create schema private;

revoke all on schema private from public, anon, authenticated;

create function private.current_user_has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = _role
    );
$$;

revoke all on function private.current_user_has_role(public.app_role) from public, anon;
grant execute on function private.current_user_has_role(public.app_role) to authenticated;

drop policy "Authenticated users can view all articles" on public.articles;
drop policy "Admins can create articles" on public.articles;
drop policy "Admins can update articles" on public.articles;
drop policy "Admins can delete articles" on public.articles;

create policy "Admins can view all articles"
  on public.articles
  for select
  to authenticated
  using ((select private.current_user_has_role('admin')));

create policy "Admins can create articles"
  on public.articles
  for insert
  to authenticated
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can update articles"
  on public.articles
  for update
  to authenticated
  using ((select private.current_user_has_role('admin')))
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can delete articles"
  on public.articles
  for delete
  to authenticated
  using ((select private.current_user_has_role('admin')));

drop policy "Admins can manage all roles" on public.user_roles;

create policy "Admins can create roles"
  on public.user_roles
  for insert
  to authenticated
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can update roles"
  on public.user_roles
  for update
  to authenticated
  using ((select private.current_user_has_role('admin')))
  with check ((select private.current_user_has_role('admin')));

create policy "Admins can delete roles"
  on public.user_roles
  for delete
  to authenticated
  using ((select private.current_user_has_role('admin')));

drop policy "Admins can view contact submissions" on public.contact_submissions;

create policy "Admins can view contact submissions"
  on public.contact_submissions
  for select
  to authenticated
  using ((select private.current_user_has_role('admin')));

drop policy "Authenticated users can upload article images" on storage.objects;
drop policy "Authenticated users can update article images" on storage.objects;
drop policy "Authenticated users can delete article images" on storage.objects;

create policy "Admins can upload article images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'article-images'
    and (select private.current_user_has_role('admin'))
  );

create policy "Admins can update article images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'article-images'
    and (select private.current_user_has_role('admin'))
  )
  with check (
    bucket_id = 'article-images'
    and (select private.current_user_has_role('admin'))
  );

create policy "Admins can delete article images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'article-images'
    and (select private.current_user_has_role('admin'))
  );

drop function public.has_role(uuid, public.app_role);
