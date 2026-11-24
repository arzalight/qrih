-- User transactional email notifications via pg_net + Supabase Vault + Edge Function (notify-user-email)
-- Triggered on public.notifications INSERT; fails open so portal writes are never blocked.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.qrih_dispatch_user_email_notification(p_payload jsonb)
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
  WHERE name = 'qrih_user_email_notify_url'
  LIMIT 1;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = 'qrih_user_email_webhook_secret'
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
  -- Never roll back portal mutations if email delivery is temporarily unavailable.
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_dispatch_user_email_notification(jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.qrih_trg_notify_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_email text;
  v_name text;
  v_account_status text;
  v_property_title text;
  v_property_slug text;
BEGIN
  IF NEW.type NOT IN (
    'property_published',
    'property_rejected',
    'property_contact_request',
    'property_contact_authorized',
    'opportunity_property_registered'
  ) THEN
    RETURN NEW;
  END IF;

  -- Only deliver to confirmed auth users with an active QRIH profile.
  SELECT u.email
    INTO v_email
  FROM auth.users u
  WHERE u.id = NEW.user_id
    AND u.email IS NOT NULL
    AND u.email_confirmed_at IS NOT NULL
  LIMIT 1;

  IF v_email IS NULL OR btrim(v_email) = '' THEN
    RETURN NEW;
  END IF;

  SELECT p.full_name, p.account_status
    INTO v_name, v_account_status
  FROM public.profiles p
  WHERE p.id = NEW.user_id
  LIMIT 1;

  IF v_account_status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF NEW.property_id IS NOT NULL THEN
    SELECT
      pr.title,
      CASE WHEN pr.status::text = 'published' THEN pr.slug ELSE NULL END
      INTO v_property_title, v_property_slug
    FROM public.properties pr
    WHERE pr.id = NEW.property_id
    LIMIT 1;
  END IF;

  PERFORM public.qrih_dispatch_user_email_notification(
    jsonb_build_object(
      'notification_id', NEW.id,
      'type', NEW.type,
      'to_email', v_email,
      'recipient_name', v_name,
      'title', NEW.title,
      'message', NEW.message,
      'property_title', v_property_title,
      'property_slug', v_property_slug
    )
  );

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.qrih_trg_notify_user_email() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE TRIGGER trg_qrih_notify_user_email
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.qrih_trg_notify_user_email();
