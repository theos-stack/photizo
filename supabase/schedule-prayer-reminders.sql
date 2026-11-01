-- Enable pg_cron, pg_net, and Vault in the Supabase project first.
-- Store supabase_url and prayer_cron_secret in Vault.
-- The Edge Function also checks x-prayer-cron-secret before processing any work.
select cron.unschedule(jobid)
from cron.job
where jobname = 'photizo-prayer-reminders-quarter-hourly';

select cron.schedule(
  'photizo-prayer-reminders-quarter-hourly',
  '*/15 * * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'supabase_url') || '/functions/v1/prayer-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-prayer-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'prayer_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $job$
);
