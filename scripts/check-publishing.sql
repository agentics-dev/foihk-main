-- Read-only configuration check; never returns secret values or enables jobs.
SELECT jsonb_build_object(
  'content_revision_table', to_regclass('public.site_content_revision') IS NOT NULL,
  'deploy_state_table', to_regclass('private.site_deploy_state') IS NOT NULL,
  'deploy_changes_table', to_regclass('private.site_deploy_changes') IS NOT NULL,
  'save_rpc', to_regprocedure('public.save_article(jsonb,uuid,bigint,text,timestamptz)') IS NOT NULL,
  'delete_rpc', to_regprocedure('public.delete_article(uuid,bigint)') IS NOT NULL,
  'version_column', EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='articles' AND column_name='edit_version'),
  'article_queue_trigger', EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.articles'::regclass AND tgname='enqueue_article_site_deploy_after_change'),
  'article_guard_trigger', EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.articles'::regclass AND tgname='guard_article_edit'),
  'direct_browser_writes_blocked', NOT has_table_privilege('authenticated','public.articles','INSERT, UPDATE, DELETE')
) AS database_readiness;

DO $$
DECLARE jobs integer := 0; secret_names integer := 0;
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    SELECT count(*) INTO jobs FROM cron.job WHERE jobname='foihk-site-deploy-worker' AND active;
  END IF;
  IF to_regclass('vault.secrets') IS NOT NULL THEN
    SELECT count(*) INTO secret_names FROM vault.secrets WHERE name IN ('site_deploy_project_url','site_deploy_publishable_key','site_deploy_worker_secret');
  END IF;
  RAISE NOTICE 'Active worker jobs: %, configured Vault names: % / 3. Zero is expected in the isolated local environment.',jobs,secret_names;
END $$;
