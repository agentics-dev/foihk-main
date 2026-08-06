alter table public.contact_submissions
  add column request_fingerprint text,
  add column user_agent text,
  add column page_url text,
  add constraint contact_submissions_name_length
    check (char_length(btrim(name)) between 1 and 120) not valid,
  add constraint contact_submissions_email_format
    check (
      char_length(btrim(email)) between 3 and 254
      and btrim(email) ~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$'
    ) not valid,
  add constraint contact_submissions_subject_length
    check (char_length(btrim(subject)) between 1 and 160) not valid,
  add constraint contact_submissions_message_length
    check (char_length(btrim(message)) between 10 and 4000) not valid,
  add constraint contact_submissions_request_fingerprint_length
    check (request_fingerprint is null or char_length(request_fingerprint) between 16 and 128) not valid,
  add constraint contact_submissions_user_agent_length
    check (user_agent is null or char_length(user_agent) <= 300) not valid,
  add constraint contact_submissions_page_url_length
    check (page_url is null or char_length(page_url) <= 300) not valid;

revoke update, delete on public.contact_submissions from anon, authenticated;

create index contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);

create index contact_submissions_email_recent_idx
  on public.contact_submissions (lower(email), created_at desc);

create index contact_submissions_fingerprint_recent_idx
  on public.contact_submissions (request_fingerprint, created_at desc)
  where request_fingerprint is not null;
