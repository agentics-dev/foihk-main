-- Historical dates verified against backups/2026-06-30_05-50-59/data/articles.json.
-- Not executed against production. Run only on the explicitly approved database.
-- Exact old-value guards preserve subsequent editorial corrections; safe to repeat.
BEGIN;
CREATE TEMP TABLE foihk_date_repair ON COMMIT DROP AS
SELECT correction.*, article.title, article.published_at AS before_date
FROM (VALUES
  ('ee05c0c8-13bb-4066-8092-d52ee6fdf937'::uuid, '2026-07-15T09:22:03.915+00:00'::timestamptz, '2026-02-02T00:00:00+00:00'::timestamptz),
  ('4a03fc5e-4b98-4f3d-98c5-fd0f7f2f48f2'::uuid, '2026-07-15T09:24:36.64+00:00'::timestamptz, '2026-05-13T02:48:42.599+00:00'::timestamptz),
  ('3fe1ff01-a208-487e-97a4-0713c10d51a8'::uuid, '2026-07-15T09:27:57.288+00:00'::timestamptz, '2026-05-08T08:22:54.952+00:00'::timestamptz),
  ('f12cb9ad-a409-4f9d-b7b9-f97155f88f73'::uuid, '2026-07-15T09:32:35.453+00:00'::timestamptz, '2026-01-07T00:00:00+00:00'::timestamptz),
  ('f82c372a-b208-4b62-9521-89453df14ca4'::uuid, '2026-07-15T09:33:26.657+00:00'::timestamptz, '2026-05-08T07:06:18.319+00:00'::timestamptz),
  ('d7e76260-7b14-41b3-9ea1-408347103c8c'::uuid, '2026-07-15T09:34:39.869+00:00'::timestamptz, '2025-12-11T00:00:00+00:00'::timestamptz),
  ('dbc7be31-e6cc-4545-935b-a0fffa927d8d'::uuid, '2026-07-15T09:35:18.339+00:00'::timestamptz, '2025-11-20T00:00:00+00:00'::timestamptz),
  ('deafafdb-67d3-480c-bcb0-178c527ab778'::uuid, '2026-07-15T09:35:52.665+00:00'::timestamptz, '2026-05-08T07:23:25.673+00:00'::timestamptz),
  ('15280f8e-560b-4e2c-a474-8e8d7fa667b7'::uuid, '2026-07-15T09:36:47.8+00:00'::timestamptz, '2026-05-08T07:06:57.766+00:00'::timestamptz),
  ('ef1a63fe-2e06-4823-8935-ac897ff00f7f'::uuid, '2026-07-15T09:40:05.487+00:00'::timestamptz, '2025-09-18T00:00:00+00:00'::timestamptz)
) AS correction(id, overwritten_published_at, original_published_at)
LEFT JOIN public.articles article ON article.id = correction.id;

UPDATE public.articles article SET published_at = correction.original_published_at
FROM foihk_date_repair correction
WHERE article.id = correction.id
  AND article.published_at = correction.overwritten_published_at;

SELECT correction.id, correction.title, correction.before_date,
  correction.original_published_at AS verified_date, article.published_at AS after_date,
  CASE WHEN article.id IS NULL THEN 'missing'
       WHEN correction.before_date = correction.overwritten_published_at THEN 'repaired'
       WHEN correction.before_date = correction.original_published_at THEN 'already_correct'
       ELSE 'skipped_other_value' END AS result
FROM foihk_date_repair correction LEFT JOIN public.articles article ON article.id = correction.id
ORDER BY correction.id;
COMMIT;
