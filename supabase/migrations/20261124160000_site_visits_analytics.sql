-- First-party, privacy-preserving site visit sessions (no cookies, no raw IP, no PII)
-- Feeds "Visitas al sitio · 30 días" in qrih_admin_metrics_snapshot with previous 30-day delta.

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_hash text NOT NULL CHECK (session_hash ~ '^[0-9a-f]{64}$'),
  visit_day date NOT NULL DEFAULT (pg_catalog.timezone('utc', pg_catalog.now()))::date,
  landing_group text NOT NULL CHECK (landing_group IN ('home', 'inventory', 'property', 'demand', 'advisor', 'legal')),
  created_at timestamptz NOT NULL DEFAULT pg_catalog.now(),
  CONSTRAINT site_visits_session_day_unique UNIQUE (session_hash, visit_day)
);

CREATE INDEX IF NOT EXISTS idx_site_visits_created_at
  ON public.site_visits (created_at DESC);

ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.site_visits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.qrih_record_site_visit(
  p_session_hash text,
  p_landing_group text DEFAULT 'home'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := pg_catalog.now();
  v_day date := (pg_catalog.timezone('utc', v_now))::date;
  v_window timestamptz;
  v_global_hits int;
  v_inserted boolean := false;
BEGIN
  IF p_session_hash IS NULL OR p_session_hash !~ '^[0-9a-f]{64}$' THEN
    RETURN false;
  END IF;

  IF p_landing_group IS NULL OR p_landing_group NOT IN ('home', 'inventory', 'property', 'demand', 'advisor', 'legal') THEN
    RETURN false;
  END IF;

  -- Fast path: already counted for this session + UTC day (avoids consuming rate window)
  IF EXISTS (
    SELECT 1
    FROM public.site_visits
    WHERE session_hash = p_session_hash
      AND visit_day = v_day
  ) THEN
    RETURN false;
  END IF;

  v_window := pg_catalog.to_timestamp(
    pg_catalog.floor(extract(epoch FROM v_now) / 900) * 900
  );

  INSERT INTO public.qrih_rate_windows (subject, action, window_start, hits)
  VALUES ('global:site_visits', 'site_visit_global', v_window, 1)
  ON CONFLICT (subject, action, window_start)
  DO UPDATE SET hits = public.qrih_rate_windows.hits + 1
  RETURNING hits INTO v_global_hits;

  IF v_global_hits > 1200 THEN
    RETURN false;
  END IF;

  INSERT INTO public.site_visits (session_hash, visit_day, landing_group)
  VALUES (p_session_hash, v_day, p_landing_group)
  ON CONFLICT (session_hash, visit_day) DO NOTHING
  RETURNING true INTO v_inserted;

  RETURN coalesce(v_inserted, false);
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_record_site_visit(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.qrih_record_site_visit(text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.qrih_admin_metrics_snapshot(p_only_pending boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := pg_catalog.now();
  v_start timestamptz := v_now - interval '30 days';
  v_previous timestamptz := v_now - interval '60 days';
  v_soon timestamptz := v_now + interval '7 days';

  v_published bigint := 0;
  v_expired bigint := 0;
  v_pending bigint := 0;
  v_soon_count bigint := 0;
  v_draft bigint := 0;
  v_paused bigint := 0;
  v_rejected bigint := 0;
  v_updates bigint := 0;

  v_users bigint := 0;
  v_new_users bigint := 0;
  v_previous_users bigint := 0;

  v_links bigint := 0;
  v_previous_links bigint := 0;

  v_contacts bigint := 0;
  v_previous_contacts bigint := 0;

  v_visits bigint := 0;
  v_previous_visits bigint := 0;
BEGIN
  IF auth.uid() IS NULL
     OR coalesce((auth.jwt()->>'is_anonymous')::boolean, false)
     OR NOT public.current_user_is_admin() THEN
    RAISE EXCEPTION 'Restricted statistics' USING errcode = '42501';
  END IF;

  IF coalesce(p_only_pending, false) THEN
    SELECT count(*)
      INTO v_pending
      FROM public.properties
     WHERE status = 'pending'::public.property_status;

    RETURN pg_catalog.jsonb_build_object(
      'as_of', v_now,
      'pending', v_pending
    );
  END IF;

  SELECT
    count(*) FILTER (WHERE status = 'published'::public.property_status),
    count(*) FILTER (WHERE status = 'expired'::public.property_status),
    count(*) FILTER (WHERE status = 'pending'::public.property_status),
    count(*) FILTER (
      WHERE status = 'published'::public.property_status
        AND verification_due_at >= v_now
        AND verification_due_at < v_soon
    ),
    count(*) FILTER (WHERE status = 'draft'::public.property_status),
    count(*) FILTER (WHERE status = 'paused'::public.property_status),
    count(*) FILTER (WHERE status = 'rejected'::public.property_status),
    count(*) FILTER (WHERE status = 'pending_update'::public.property_status)
    INTO
      v_published,
      v_expired,
      v_pending,
      v_soon_count,
      v_draft,
      v_paused,
      v_rejected,
      v_updates
    FROM public.properties;

  SELECT
    count(*),
    count(*) FILTER (WHERE created_at >= v_start AND created_at < v_now),
    count(*) FILTER (WHERE created_at >= v_previous AND created_at < v_start)
    INTO v_users, v_new_users, v_previous_users
    FROM public.profiles;

  SELECT
    count(*) FILTER (WHERE created_at >= v_start AND created_at < v_now),
    count(*) FILTER (WHERE created_at >= v_previous AND created_at < v_start)
    INTO v_links, v_previous_links
    FROM public.opportunity_property_registrations;

  SELECT
    count(*) FILTER (WHERE created_at >= v_start AND created_at < v_now),
    count(*) FILTER (WHERE created_at >= v_previous AND created_at < v_start)
    INTO v_contacts, v_previous_contacts
    FROM public.property_contacts;

  SELECT
    count(*) FILTER (WHERE created_at >= v_start AND created_at < v_now),
    count(*) FILTER (WHERE created_at >= v_previous AND created_at < v_start)
    INTO v_visits, v_previous_visits
    FROM public.site_visits;

  RETURN pg_catalog.jsonb_build_object(
    'as_of', v_now,
    'published', v_published,
    'expired', v_expired,
    'users', v_users,
    'pending', v_pending,
    'links', v_links,
    'previous_links', v_previous_links,
    'contacts', v_contacts,
    'previous_contacts', v_previous_contacts,
    'visits', v_visits,
    'previous_visits', v_previous_visits,
    'soon', v_soon_count,
    'draft', v_draft,
    'paused', v_paused,
    'rejected', v_rejected,
    'updates', v_updates,
    'new_users', v_new_users,
    'previous_users', v_previous_users
  );
END;
$$;
