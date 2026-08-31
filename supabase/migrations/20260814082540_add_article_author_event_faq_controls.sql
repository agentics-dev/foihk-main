-- Trilingual author metadata, per-article FAQ controls, and structured Event
-- fields for the existing articles table. All content fields are nullable so
-- existing rows remain unchanged. No policies are changed because this does
-- not add a new table or widen access to article rows.

alter table public.articles
  add column author_name text,
  add column author_name_zhtw text,
  add column author_name_zhcn text,
  add column author_title text,
  add column author_title_zhtw text,
  add column author_title_zhcn text,
  add column author_credential text,
  add column author_credential_zhtw text,
  add column author_credential_zhcn text,
  add column faq_show_on_page boolean default true,
  add column faq_include_schema boolean default true,
  add column event_schema_enabled boolean default false,
  add column event_attendance_mode text,
  add column event_status text,
  add column event_start_date date,
  add column event_start_time time without time zone,
  add column event_end_date date,
  add column event_end_time time without time zone,
  add column event_timezone text default 'Asia/Hong_Kong',
  add column event_previous_start_date date,
  add column event_previous_start_time time without time zone,
  add column event_venue_name text,
  add column event_venue_name_zhtw text,
  add column event_venue_name_zhcn text,
  add column event_address text,
  add column event_address_zhtw text,
  add column event_address_zhcn text,
  add column event_online_url text,
  add column event_organizer_name text,
  add column event_organizer_name_zhtw text,
  add column event_organizer_name_zhcn text,
  add column event_organizer_url text,
  add column event_unavailable_fields text[] default '{}';

alter table public.articles
  add constraint articles_author_name_length
    check (author_name is null or char_length(author_name) <= 120),
  add constraint articles_author_name_zhtw_length
    check (author_name_zhtw is null or char_length(author_name_zhtw) <= 120),
  add constraint articles_author_name_zhcn_length
    check (author_name_zhcn is null or char_length(author_name_zhcn) <= 120),
  add constraint articles_author_title_length
    check (author_title is null or char_length(author_title) <= 160),
  add constraint articles_author_title_zhtw_length
    check (author_title_zhtw is null or char_length(author_title_zhtw) <= 160),
  add constraint articles_author_title_zhcn_length
    check (author_title_zhcn is null or char_length(author_title_zhcn) <= 160),
  add constraint articles_author_credential_length
    check (author_credential is null or char_length(author_credential) <= 300),
  add constraint articles_author_credential_zhtw_length
    check (author_credential_zhtw is null or char_length(author_credential_zhtw) <= 300),
  add constraint articles_author_credential_zhcn_length
    check (author_credential_zhcn is null or char_length(author_credential_zhcn) <= 300),
  add constraint articles_event_attendance_mode_check
    check (event_attendance_mode is null or event_attendance_mode in ('offline', 'online', 'mixed')),
  add constraint articles_event_status_check
    check (event_status is null or event_status in ('scheduled', 'cancelled', 'postponed', 'rescheduled')),
  add constraint articles_event_date_order_check
    check (event_end_date is null or event_start_date is null or event_end_date >= event_start_date),
  add constraint articles_event_timezone_length
    check (event_timezone is null or char_length(event_timezone) <= 64),
  add constraint articles_event_venue_name_length
    check (event_venue_name is null or char_length(event_venue_name) <= 200),
  add constraint articles_event_venue_name_zhtw_length
    check (event_venue_name_zhtw is null or char_length(event_venue_name_zhtw) <= 200),
  add constraint articles_event_venue_name_zhcn_length
    check (event_venue_name_zhcn is null or char_length(event_venue_name_zhcn) <= 200),
  add constraint articles_event_address_length
    check (event_address is null or char_length(event_address) <= 500),
  add constraint articles_event_address_zhtw_length
    check (event_address_zhtw is null or char_length(event_address_zhtw) <= 500),
  add constraint articles_event_address_zhcn_length
    check (event_address_zhcn is null or char_length(event_address_zhcn) <= 500),
  add constraint articles_event_online_url_length
    check (event_online_url is null or char_length(event_online_url) <= 2048),
  add constraint articles_event_organizer_name_length
    check (event_organizer_name is null or char_length(event_organizer_name) <= 200),
  add constraint articles_event_organizer_name_zhtw_length
    check (event_organizer_name_zhtw is null or char_length(event_organizer_name_zhtw) <= 200),
  add constraint articles_event_organizer_name_zhcn_length
    check (event_organizer_name_zhcn is null or char_length(event_organizer_name_zhcn) <= 200),
  add constraint articles_event_organizer_url_length
    check (event_organizer_url is null or char_length(event_organizer_url) <= 2048),
  add constraint articles_event_unavailable_fields_limit
    check (event_unavailable_fields is null or cardinality(event_unavailable_fields) <= 40);
