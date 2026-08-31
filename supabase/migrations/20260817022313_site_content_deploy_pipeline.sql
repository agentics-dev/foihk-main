create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table public.site_content_revision (
  id boolean primary key default true check (id),
  revision bigint not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now()
);

insert into public.site_content_revision (id, revision)
values (true, 1)
on conflict (id) do nothing;

alter table public.site_content_revision enable row level security;
revoke all on table public.site_content_revision from public, anon, authenticated;
grant select on table public.site_content_revision to anon, authenticated;

create policy "Content revision is publicly readable"
  on public.site_content_revision
  for select
  to anon, authenticated
  using (true);

create table private.site_deploy_state (
  id boolean primary key default true check (id),
  desired_revision bigint not null default 1 check (desired_revision >= 1),
  active_revision bigint,
  deployed_revision bigint not null default 0 check (deployed_revision >= 0),
  status text not null default 'queued'
    check (status in ('queued', 'building', 'live', 'failed')),
  burst_started_at timestamptz,
  not_before timestamptz,
  triggered_at timestamptz,
  hook_accepted_at timestamptz,
  verified_at timestamptz,
  last_change_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count between 0 and 3),
  next_retry_at timestamptz,
  last_error text,
  updated_at timestamptz not null default now(),
  check (active_revision is null or active_revision <= desired_revision),
  check (deployed_revision <= desired_revision)
);

insert into private.site_deploy_state (
  id,
  desired_revision,
  deployed_revision,
  status,
  burst_started_at,
  not_before
)
values (true, 1, 0, 'queued', now(), now())
on conflict (id) do nothing;

create table private.site_deploy_changes (
  id bigint generated always as identity primary key,
  revision bigint not null check (revision >= 1),
  article_id uuid,
  url text not null check (
    char_length(url) <= 500
    and url like 'https://www.foihk.org/%'
  ),
  change_kind text not null check (change_kind in ('upsert', 'remove')),
  indexnow_status text not null default 'blocked'
    check (indexnow_status in ('blocked', 'pending', 'submitted', 'failed')),
  indexnow_attempt_count integer not null default 0
    check (indexnow_attempt_count between 0 and 3),
  indexnow_next_retry_at timestamptz,
  indexnow_last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (revision, url)
);

create index site_deploy_changes_revision_idx
  on private.site_deploy_changes (revision, id);
create index site_deploy_changes_article_revision_idx
  on private.site_deploy_changes (article_id, revision)
  where article_id is not null;
create index site_deploy_changes_indexnow_idx
  on private.site_deploy_changes (indexnow_status, indexnow_next_retry_at, revision);

alter table private.site_deploy_state enable row level security;
alter table private.site_deploy_changes enable row level security;
revoke all on table private.site_deploy_state from public, anon, authenticated;
revoke all on table private.site_deploy_changes from public, anon, authenticated;

create function private.site_article_urls(
  _category public.article_category,
  _slug text
)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array_agg(
    'https://www.foihk.org/' || language || '/articles/'
    || replace(_category::text, '_', '-') || '/' || _slug
    order by language
  )
  from unnest(array['en', 'zh-hk', 'zh-cn']) as language;
$$;

revoke all on function private.site_article_urls(public.article_category, text)
  from public, anon, authenticated;

create function private.enqueue_site_content_change(
  _article_id uuid,
  _upsert_urls text[],
  _remove_urls text[]
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  _revision bigint;
  _state private.site_deploy_state%rowtype;
  _url text;
  _now timestamptz := clock_timestamp();
begin
  select *
  into _state
  from private.site_deploy_state
  where id = true
  for update;

  update public.site_content_revision
  set revision = revision + 1,
      updated_at = _now
  where id = true
  returning revision into _revision;

  foreach _url in array coalesce(_remove_urls, array[]::text[]) loop
    insert into private.site_deploy_changes (
      revision,
      article_id,
      url,
      change_kind
    ) values (
      _revision,
      _article_id,
      _url,
      'remove'
    )
    on conflict (revision, url) do update
    set change_kind = excluded.change_kind,
        article_id = excluded.article_id,
        updated_at = _now;
  end loop;

  foreach _url in array coalesce(_upsert_urls, array[]::text[]) loop
    insert into private.site_deploy_changes (
      revision,
      article_id,
      url,
      change_kind
    ) values (
      _revision,
      _article_id,
      _url,
      'upsert'
    )
    on conflict (revision, url) do update
    set change_kind = excluded.change_kind,
        article_id = excluded.article_id,
        updated_at = _now;
  end loop;

  update private.site_deploy_state
  set desired_revision = _revision,
      status = case
        when active_revision is not null then 'building'
        else 'queued'
      end,
      burst_started_at = case
        when _state.desired_revision <= _state.deployed_revision
          and _state.active_revision is null
        then _now
        else coalesce(_state.burst_started_at, _now)
      end,
      not_before = case
        when _state.active_revision is not null then _state.not_before
        when _state.desired_revision <= _state.deployed_revision then _now + interval '30 seconds'
        else least(
          coalesce(_state.burst_started_at, _now) + interval '2 minutes',
          _now + interval '30 seconds'
        )
      end,
      attempt_count = case
        when _state.status in ('live', 'failed') and _state.active_revision is null then 0
        else _state.attempt_count
      end,
      next_retry_at = null,
      last_error = null,
      last_change_at = _now,
      updated_at = _now
  where id = true;

  return _revision;
end;
$$;

revoke all on function private.enqueue_site_content_change(uuid, text[], text[])
  from public, anon, authenticated;

create function private.queue_all_published_articles()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  _revision bigint;
  _state private.site_deploy_state%rowtype;
  _now timestamptz := clock_timestamp();
begin
  select *
  into _state
  from private.site_deploy_state
  where id = true
  for update;

  update public.site_content_revision
  set revision = revision + 1,
      updated_at = _now
  where id = true
  returning revision into _revision;

  insert into private.site_deploy_changes (
    revision,
    article_id,
    url,
    change_kind
  )
  select
    _revision,
    articles.id,
    urls.url,
    'upsert'
  from public.articles
  cross join lateral unnest(
    private.site_article_urls(articles.category, articles.slug)
  ) as urls(url)
  where articles.published
  on conflict (revision, url) do nothing;

  update private.site_deploy_state
  set desired_revision = _revision,
      status = case when active_revision is null then 'queued' else 'building' end,
      burst_started_at = _now,
      not_before = case when active_revision is null then _now else not_before end,
      attempt_count = case when active_revision is null then 0 else attempt_count end,
      next_retry_at = null,
      last_error = null,
      last_change_at = _now,
      updated_at = _now
  where id = true;

  return _revision;
end;
$$;

revoke all on function private.queue_all_published_articles()
  from public, anon, authenticated;

create function private.enqueue_article_site_deploy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _upsert_urls text[] := array[]::text[];
  _remove_urls text[] := array[]::text[];
  _article_id uuid;
begin
  if tg_op = 'INSERT' then
    if not new.published then
      return new;
    end if;
    _article_id := new.id;
    _upsert_urls := private.site_article_urls(new.category, new.slug);
  elsif tg_op = 'UPDATE' then
    if not old.published and not new.published then
      return new;
    end if;
    _article_id := new.id;
    if old.published and (
      not new.published
      or old.slug is distinct from new.slug
      or old.category is distinct from new.category
    ) then
      _remove_urls := private.site_article_urls(old.category, old.slug);
    end if;
    if new.published then
      _upsert_urls := private.site_article_urls(new.category, new.slug);
    end if;
  else
    if not old.published then
      return old;
    end if;
    _article_id := old.id;
    _remove_urls := private.site_article_urls(old.category, old.slug);
  end if;

  perform private.enqueue_site_content_change(
    _article_id,
    _upsert_urls,
    _remove_urls
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.enqueue_article_site_deploy()
  from public, anon, authenticated;

create trigger enqueue_article_site_deploy_after_change
after insert or update or delete on public.articles
for each row execute function private.enqueue_article_site_deploy();

create function private.enqueue_article_faq_site_deploy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _article public.articles%rowtype;
  _article_id uuid := case when tg_op = 'DELETE' then old.article_id else new.article_id end;
begin
  select *
  into _article
  from public.articles
  where id = _article_id
    and published;

  if not found then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  perform private.enqueue_site_content_change(
    _article.id,
    private.site_article_urls(_article.category, _article.slug),
    array[]::text[]
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.enqueue_article_faq_site_deploy()
  from public, anon, authenticated;

create trigger enqueue_article_faq_site_deploy_after_change
after insert or update or delete on public.article_faq_items
for each row execute function private.enqueue_article_faq_site_deploy();

create function public.site_deploy_worker_next()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _state private.site_deploy_state%rowtype;
  _now timestamptz := clock_timestamp();
begin
  select *
  into _state
  from private.site_deploy_state
  where id = true
  for update;

  if _state.active_revision is not null then
    if _state.hook_accepted_at is null
      and _state.triggered_at < _now - interval '2 minutes'
    then
      return jsonb_build_object(
        'action', 'trigger',
        'revision', _state.active_revision,
        'attempt', _state.attempt_count
      );
    end if;
    return jsonb_build_object(
      'action', 'reconcile',
      'revision', _state.active_revision,
      'attempt', _state.attempt_count,
      'triggeredAt', _state.triggered_at,
      'hookAcceptedAt', _state.hook_accepted_at
    );
  end if;

  if _state.desired_revision <= _state.deployed_revision then
    return jsonb_build_object('action', 'idle');
  end if;

  if _state.status = 'failed' and _state.next_retry_at is null then
    return jsonb_build_object('action', 'failed');
  end if;

  if coalesce(_state.next_retry_at, _state.not_before, _now) > _now then
    return jsonb_build_object(
      'action', 'wait',
      'notBefore', coalesce(_state.next_retry_at, _state.not_before)
    );
  end if;

  update private.site_deploy_state
  set active_revision = desired_revision,
      status = 'building',
      triggered_at = _now,
      hook_accepted_at = null,
      attempt_count = least(attempt_count + 1, 3),
      next_retry_at = null,
      last_error = null,
      updated_at = _now
  where id = true
  returning * into _state;

  return jsonb_build_object(
    'action', 'trigger',
    'revision', _state.active_revision,
    'attempt', _state.attempt_count
  );
end;
$$;

revoke all on function public.site_deploy_worker_next()
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_next() to service_role;

create function public.site_deploy_worker_hook_accepted(_revision bigint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update private.site_deploy_state
  set hook_accepted_at = clock_timestamp(),
      updated_at = clock_timestamp()
  where id = true
    and active_revision = _revision;
  if not found then
    raise exception 'Active deploy revision does not match';
  end if;
end;
$$;

revoke all on function public.site_deploy_worker_hook_accepted(bigint)
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_hook_accepted(bigint)
  to service_role;

create function public.site_deploy_worker_payload(_revision bigint)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with state as (
    select deployed_revision, desired_revision
    from private.site_deploy_state
    where id = true
      and active_revision = _revision
  ),
  latest as (
    select distinct on (changes.url)
      changes.url,
      changes.change_kind,
      changes.article_id,
      changes.revision
    from private.site_deploy_changes as changes, state
    where changes.revision > state.deployed_revision
      and changes.revision <= _revision
    order by changes.url, changes.revision desc, changes.id desc
  )
  select jsonb_build_object(
    'revision', _revision,
    'deployedRevision', coalesce((select deployed_revision from state), 0),
    'desiredRevision', coalesce((select desired_revision from state), 0),
    'changes', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'url', latest.url,
            'kind', latest.change_kind,
            'articleId', latest.article_id
          )
          order by latest.url
        )
        from latest
      ),
      '[]'::jsonb
    )
  );
$$;

revoke all on function public.site_deploy_worker_payload(bigint)
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_payload(bigint)
  to service_role;

create function public.site_deploy_worker_complete(_revision bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _state private.site_deploy_state%rowtype;
  _now timestamptz := clock_timestamp();
begin
  select *
  into _state
  from private.site_deploy_state
  where id = true
  for update;

  if _state.active_revision is distinct from _revision then
    raise exception 'Active deploy revision does not match';
  end if;

  update private.site_deploy_changes
  set indexnow_status = 'pending',
      indexnow_next_retry_at = _now,
      updated_at = _now
  where revision > _state.deployed_revision
    and revision <= _revision
    and indexnow_status = 'blocked';

  update private.site_deploy_state
  set deployed_revision = greatest(deployed_revision, _revision),
      active_revision = null,
      status = case when desired_revision > _revision then 'queued' else 'live' end,
      burst_started_at = case when desired_revision > _revision then _now else null end,
      not_before = case when desired_revision > _revision then _now else null end,
      triggered_at = null,
      hook_accepted_at = null,
      verified_at = _now,
      attempt_count = 0,
      next_retry_at = null,
      last_error = null,
      updated_at = _now
  where id = true
  returning * into _state;

  return jsonb_build_object(
    'status', _state.status,
    'desiredRevision', _state.desired_revision,
    'deployedRevision', _state.deployed_revision
  );
end;
$$;

revoke all on function public.site_deploy_worker_complete(bigint)
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_complete(bigint)
  to service_role;

create function public.site_deploy_worker_fail(
  _revision bigint,
  _error text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _state private.site_deploy_state%rowtype;
  _now timestamptz := clock_timestamp();
  _terminal boolean;
begin
  select *
  into _state
  from private.site_deploy_state
  where id = true
  for update;

  if _state.active_revision is distinct from _revision then
    raise exception 'Active deploy revision does not match';
  end if;

  _terminal := _state.attempt_count >= 3;
  update private.site_deploy_state
  set active_revision = null,
      status = case when _terminal then 'failed' else 'queued' end,
      triggered_at = null,
      hook_accepted_at = null,
      next_retry_at = case
        when _terminal then null
        when _state.attempt_count = 1 then _now + interval '1 minute'
        when _state.attempt_count = 2 then _now + interval '2 minutes'
        else _now + interval '5 minutes'
      end,
      last_error = left(coalesce(_error, 'Deployment failed'), 500),
      updated_at = _now
  where id = true
  returning * into _state;

  return jsonb_build_object(
    'status', _state.status,
    'attempt', _state.attempt_count,
    'nextRetryAt', _state.next_retry_at
  );
end;
$$;

revoke all on function public.site_deploy_worker_fail(bigint, text)
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_fail(bigint, text)
  to service_role;

create function public.site_deploy_worker_pending_indexnow()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with state as (
    select deployed_revision
    from private.site_deploy_state
    where id = true
  ),
  pending as (
    select distinct changes.url
    from private.site_deploy_changes as changes, state
    where changes.revision <= state.deployed_revision
      and changes.indexnow_status in ('pending', 'failed')
      and changes.indexnow_attempt_count < 3
      and coalesce(changes.indexnow_next_retry_at, now()) <= now()
    order by changes.url
    limit 1000
  )
  select jsonb_build_object(
    'urls', coalesce((select jsonb_agg(url order by url) from pending), '[]'::jsonb)
  );
$$;

revoke all on function public.site_deploy_worker_pending_indexnow()
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_pending_indexnow()
  to service_role;

create function public.site_deploy_worker_indexnow_result(
  _urls text[],
  _success boolean,
  _error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _now timestamptz := clock_timestamp();
begin
  if coalesce(cardinality(_urls), 0) = 0 then
    return;
  end if;

  update private.site_deploy_changes
  set indexnow_attempt_count = least(indexnow_attempt_count + 1, 3),
      indexnow_status = case
        when _success then 'submitted'
        else 'failed'
      end,
      indexnow_next_retry_at = case
        when _success or indexnow_attempt_count + 1 >= 3 then null
        when indexnow_attempt_count = 0 then _now + interval '1 minute'
        when indexnow_attempt_count = 1 then _now + interval '2 minutes'
        else _now + interval '5 minutes'
      end,
      indexnow_last_error = case
        when _success then null
        else left(coalesce(_error, 'IndexNow submission failed'), 500)
      end,
      updated_at = _now
  where url = any(_urls)
    and revision <= (
      select deployed_revision
      from private.site_deploy_state
      where id = true
    )
    and indexnow_status in ('pending', 'failed');
end;
$$;

revoke all on function public.site_deploy_worker_indexnow_result(text[], boolean, text)
  from public, anon, authenticated;
grant execute on function public.site_deploy_worker_indexnow_result(text[], boolean, text)
  to service_role;

create function public.site_deploy_admin_status()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'status', state.status,
    'desiredRevision', state.desired_revision,
    'activeRevision', state.active_revision,
    'deployedRevision', state.deployed_revision,
    'lastChangeAt', state.last_change_at,
    'triggeredAt', state.triggered_at,
    'verifiedAt', state.verified_at,
    'attemptCount', state.attempt_count,
    'nextRetryAt', state.next_retry_at,
    'lastError', state.last_error,
    'pendingUrlCount', (
      select count(distinct changes.url)
      from private.site_deploy_changes as changes
      where changes.revision > state.deployed_revision
    ),
    'pendingArticleIds', coalesce(
      (
        select jsonb_agg(article_id order by article_id)
        from (
          select distinct changes.article_id
          from private.site_deploy_changes as changes
          where changes.revision > state.deployed_revision
            and changes.article_id is not null
        ) as pending_articles
      ),
      '[]'::jsonb
    ),
    'indexNowPendingCount', (
      select count(distinct changes.url)
      from private.site_deploy_changes as changes
      where changes.revision <= state.deployed_revision
        and changes.indexnow_status in ('pending', 'failed')
        and changes.indexnow_attempt_count < 3
    )
  )
  from private.site_deploy_state as state
  where state.id = true;
$$;

revoke all on function public.site_deploy_admin_status()
  from public, anon, authenticated;
grant execute on function public.site_deploy_admin_status() to service_role;

create function public.site_deploy_admin_request(_action text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  _revision bigint;
  _state private.site_deploy_state%rowtype;
begin
  if _action not in ('retry', 'rebuild') then
    raise exception 'Unsupported deploy action';
  end if;

  if _action = 'rebuild' then
    _revision := private.queue_all_published_articles();
  else
    select *
    into _state
    from private.site_deploy_state
    where id = true
    for update;

    if _state.status <> 'failed' then
      raise exception 'Retry is only available for a failed deployment';
    end if;

    update private.site_deploy_state
    set status = 'queued',
        active_revision = null,
        attempt_count = 0,
        next_retry_at = clock_timestamp(),
        not_before = clock_timestamp(),
        last_error = null,
        updated_at = clock_timestamp()
    where id = true;
    select desired_revision into _revision
    from private.site_deploy_state
    where id = true;
  end if;

  return jsonb_build_object('ok', true, 'revision', _revision);
end;
$$;

revoke all on function public.site_deploy_admin_request(text)
  from public, anon, authenticated;
grant execute on function public.site_deploy_admin_request(text)
  to service_role;

create function private.install_site_deploy_cron()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  _job_id bigint;
begin
  if (
    select count(*)
    from vault.decrypted_secrets
    where name in (
      'site_deploy_project_url',
      'site_deploy_publishable_key',
      'site_deploy_worker_secret'
    )
  ) <> 3 then
    raise exception 'Site deploy Vault secrets are not configured';
  end if;

  select cron.schedule(
    'foihk-site-deploy-worker',
    '* * * * *',
    $schedule$
      select net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'site_deploy_project_url'
        ) || '/functions/v1/site-deploy-worker',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'site_deploy_publishable_key'
          ),
          'x-foihk-worker-secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'site_deploy_worker_secret'
          )
        ),
        body := '{"source":"cron"}'::jsonb,
        timeout_milliseconds := 25000
      );
    $schedule$
  ) into _job_id;

  return _job_id;
end;
$$;

revoke all on function private.install_site_deploy_cron()
  from public, anon, authenticated;

create function private.pause_site_deploy_cron()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform cron.alter_job(
    job_id := (
      select jobid
      from cron.job
      where jobname = 'foihk-site-deploy-worker'
    ),
    active := false
  );
end;
$$;

revoke all on function private.pause_site_deploy_cron()
  from public, anon, authenticated;
