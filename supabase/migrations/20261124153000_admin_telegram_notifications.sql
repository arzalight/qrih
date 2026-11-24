-- Admin Telegram notifications via pg_net + Supabase Vault + Edge Function (notify-admin-events)
-- Fires asynchronously and fails open (never blocks user signup, property submission, or demand creation).

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.qrih_dispatch_admin_notification(p_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url
  FROM vault.decrypted_secrets
  WHERE name = 'qrih_admin_notify_url'
  LIMIT 1;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'qrih_admin_webhook_secret'
  LIMIT 1;

  IF v_url IS NULL OR btrim(v_url) = '' OR v_secret IS NULL OR btrim(v_secret) = '' THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-qrih-webhook-secret', v_secret
    ),
    body := p_payload,
    timeout_milliseconds := 5000
  );
EXCEPTION WHEN OTHERS THEN
  -- Never roll back business writes if notification delivery is temporarily unavailable.
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_dispatch_admin_notification(jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.qrih_trg_notify_admin_profile_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.qrih_dispatch_admin_notification(
    jsonb_build_object(
      'event', 'profile_created',
      'entity_id', NEW.id,
      'full_name', NEW.full_name,
      'company', NEW.company_name,
      'role', NEW.role,
      'user_type', NEW.user_type
    )
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_trg_notify_admin_profile_created() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_qrih_notify_admin_profile_created
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.qrih_trg_notify_admin_profile_created();

CREATE OR REPLACE FUNCTION public.qrih_trg_notify_admin_property_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_event text;
BEGIN
  IF NEW.status::text = 'pending' AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM 'pending') THEN
    v_event := 'property_pending';
  ELSIF NEW.status::text = 'pending_update' AND (TG_OP = 'INSERT' OR OLD.status::text IS DISTINCT FROM 'pending_update') THEN
    v_event := 'property_pending_update';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.qrih_dispatch_admin_notification(
    jsonb_build_object(
      'event', v_event,
      'entity_id', NEW.id,
      'title', NEW.title,
      'operation', NEW.operation,
      'zone_general', NEW.zone_general,
      'zone', NEW.zone,
      'total_area', NEW.total_area,
      'price_display', NEW.price_display
    )
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_trg_notify_admin_property_review() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_qrih_notify_admin_property_review
AFTER INSERT OR UPDATE OF status ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.qrih_trg_notify_admin_property_review();

CREATE OR REPLACE FUNCTION public.qrih_trg_notify_admin_demand_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.qrih_dispatch_admin_notification(
    jsonb_build_object(
      'event', 'demand_created',
      'entity_id', NEW.id,
      'operation', NEW.operation,
      'zone_general', NEW.zone_general,
      'zone', NEW.zone,
      'area_min', NEW.area_min,
      'area_max', NEW.area_max,
      'company', NEW.company
    )
  );
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_trg_notify_admin_demand_created() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_qrih_notify_admin_demand_created
AFTER INSERT ON public.demand_requests
FOR EACH ROW
EXECUTE FUNCTION public.qrih_trg_notify_admin_demand_created();
