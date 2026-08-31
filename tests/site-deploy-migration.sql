do $test$
declare
  _article_id uuid := gen_random_uuid();
  _revision_before bigint;
  _revision_current bigint;
  _revision_active bigint;
  _revision_unpublished bigint;
  _next jsonb;
  _payload jsonb;
  _status text;
begin
  if not has_table_privilege('anon', 'public.site_content_revision', 'select')
    or has_table_privilege('anon', 'public.site_content_revision', 'insert')
  then
    raise exception 'Public revision permissions are incorrect';
  end if;

  if has_table_privilege('anon', 'private.site_deploy_state', 'select')
    or has_table_privilege('authenticated', 'private.site_deploy_changes', 'select')
  then
    raise exception 'Private deploy tables are browser-accessible';
  end if;

  if has_function_privilege('anon', 'public.site_deploy_worker_next()', 'execute')
    or has_function_privilege('authenticated', 'public.site_deploy_admin_status()', 'execute')
  then
    raise exception 'Service-role RPC permissions are too broad';
  end if;

  select revision into _revision_before
  from public.site_content_revision
  where id = true;

  insert into public.articles (
    id,
    title,
    slug,
    excerpt,
    content,
    category,
    published
  ) values (
    _article_id,
    'Deploy pipeline transaction test',
    'deploy-pipeline-transaction-test',
    'Temporary transaction-only article.',
    '<p>Temporary transaction-only article.</p>',
    'news_events',
    false
  );

  if (select revision from public.site_content_revision where id = true) <> _revision_before then
    raise exception 'Draft creation unexpectedly queued a deployment';
  end if;

  update public.articles
  set published = true,
      published_at = clock_timestamp(),
      public_updated_at = clock_timestamp()
  where id = _article_id;

  select revision into _revision_current
  from public.site_content_revision
  where id = true;

  if _revision_current <> _revision_before + 1 then
    raise exception 'Publishing did not increment content revision exactly once';
  end if;

  if (
    select count(*)
    from private.site_deploy_changes
    where revision = _revision_current
      and article_id = _article_id
      and change_kind = 'upsert'
  ) <> 3 then
    raise exception 'Publishing did not queue three localized URLs';
  end if;

  insert into public.article_faq_items (
    article_id,
    position,
    question,
    answer,
    question_zhtw,
    answer_zhtw,
    question_zhcn,
    answer_zhcn
  ) values (
    _article_id,
    0,
    'Test question?',
    'Test answer.',
    '測試問題？',
    '測試答案。',
    '测试问题？',
    '测试答案。'
  );

  update public.article_faq_items
  set position = 1
  where article_id = _article_id;

  update public.articles
  set slug = 'deploy-pipeline-transaction-test-renamed'
  where id = _article_id;

  select revision into _revision_current
  from public.site_content_revision
  where id = true;

  if (
    select count(*)
    from private.site_deploy_changes
    where revision = _revision_current
      and article_id = _article_id
  ) <> 6 then
    raise exception 'Slug change did not queue three removals and three upserts';
  end if;

  _next := public.site_deploy_worker_next();
  if _next ->> 'action' <> 'wait' then
    raise exception 'Quiet-period debounce was not enforced';
  end if;

  update private.site_deploy_state
  set not_before = clock_timestamp()
  where id = true;

  _next := public.site_deploy_worker_next();
  if _next ->> 'action' <> 'trigger' then
    raise exception 'Worker did not atomically claim queued work';
  end if;
  _revision_active := (_next ->> 'revision')::bigint;

  _next := public.site_deploy_worker_next();
  if _next ->> 'action' <> 'reconcile' then
    raise exception 'Second worker call did not observe the active claim';
  end if;

  _payload := public.site_deploy_worker_payload(_revision_active);
  if jsonb_array_length(_payload -> 'changes') <> 6 then
    raise exception 'Deploy payload did not deduplicate URLs to their latest state';
  end if;

  perform public.site_deploy_worker_hook_accepted(_revision_active);

  update public.articles
  set title = 'Deploy pipeline transaction test updated'
  where id = _article_id;

  if (
    select desired_revision <= _revision_active
    from private.site_deploy_state
    where id = true
  ) then
    raise exception 'Content change during build did not create a trailing revision';
  end if;

  perform public.site_deploy_worker_complete(_revision_active);

  select status into _status
  from private.site_deploy_state
  where id = true;
  if _status <> 'queued' then
    raise exception 'Completing an older revision did not retain the trailing deployment';
  end if;

  _next := public.site_deploy_worker_next();
  if _next ->> 'action' <> 'trigger' then
    raise exception 'Trailing deployment was not claimed immediately';
  end if;
  _revision_active := (_next ->> 'revision')::bigint;

  perform public.site_deploy_worker_fail(_revision_active, 'test failure one');
  update private.site_deploy_state set next_retry_at = clock_timestamp() where id = true;
  _next := public.site_deploy_worker_next();
  perform public.site_deploy_worker_fail((_next ->> 'revision')::bigint, 'test failure two');
  update private.site_deploy_state set next_retry_at = clock_timestamp() where id = true;
  _next := public.site_deploy_worker_next();
  perform public.site_deploy_worker_fail((_next ->> 'revision')::bigint, 'test failure three');

  select status into _status
  from private.site_deploy_state
  where id = true;
  if _status <> 'failed' then
    raise exception 'Three deployment failures did not stop automatic retries';
  end if;

  perform public.site_deploy_admin_request('retry');
  _next := public.site_deploy_worker_next();
  if _next ->> 'action' <> 'trigger' then
    raise exception 'Administrator retry did not requeue the failed revision';
  end if;

  update public.articles
  set published = false
  where id = _article_id;

  select revision into _revision_unpublished
  from public.site_content_revision
  where id = true;

  if (
    select count(*)
    from private.site_deploy_changes
    where revision = _revision_unpublished
      and article_id = _article_id
      and change_kind = 'remove'
  ) <> 3 then
    raise exception 'Unpublish did not queue three localized removals';
  end if;

  delete from public.articles where id = _article_id;
  if (select revision from public.site_content_revision where id = true) <> _revision_unpublished then
    raise exception 'Deleting an unpublished article unexpectedly queued another deployment';
  end if;
end;
$test$;
