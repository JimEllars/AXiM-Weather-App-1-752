-- Enable pg_net if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to handle global_alerts insertion
CREATE OR REPLACE FUNCTION public.handle_critical_alert_push()
RETURNS TRIGGER AS $$
DECLARE
  push_subs jsonb;
  request_id bigint;
  webhook_url text := 'https://axim-weather.pages.dev/api/send-push'; -- Replace with actual domain
  secret_token text := current_setting('app.settings.push_secret_token', true); -- Read from vault/settings in production
BEGIN
  -- Only process if severity is 'critical'
  IF NEW.severity = 'critical' THEN

    -- Aggregate all push subscriptions from user_profiles or similar table
    -- Assuming a 'push_subscriptions' table exists with a 'subscription' jsonb column
    -- If it's a different structure, this needs to be adjusted.
    -- For now, we simulate fetching all subscriptions.
    SELECT json_agg(subscription) INTO push_subs
    FROM public.push_subscriptions
    WHERE is_active = true;

    -- If there are subscriptions, make the HTTP request
    IF push_subs IS NOT NULL AND jsonb_array_length(push_subs) > 0 THEN

      SELECT
        net.http_post(
          url := webhook_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(secret_token, 'FALLBACK_TOKEN_REPLACE_ME')
          ),
          body := jsonb_build_object(
            'message', NEW.message,
            'subscriptions', push_subs
          )
        ) INTO request_id;

      -- Log the request_id or handle failure if needed
      RAISE NOTICE 'Push notification request sent, ID: %', request_id;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on global_alerts
DROP TRIGGER IF EXISTS on_critical_alert_insert ON public.global_alerts;
CREATE TRIGGER on_critical_alert_insert
  AFTER INSERT ON public.global_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_critical_alert_push();
