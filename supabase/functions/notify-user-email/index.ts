// Edge Function: notify-user-email
// @ts-nocheck — Entorno Deno Edge Runtime de Supabase.
import { createNotifyUserEmailHandler } from './core.ts'

const handler = createNotifyUserEmailHandler({
  webhookSecret: (Deno.env.get('USER_EMAIL_WEBHOOK_SECRET') ?? '').trim(),
  resendApiKey: (Deno.env.get('RESEND_API_KEY') ?? '').trim(),
  resendFrom: (Deno.env.get('RESEND_FROM') ?? '').trim(),
  portalUrl: (Deno.env.get('QRIH_PORTAL_URL') ?? 'https://qrih-staging.netlify.app').trim(),
  overrideTo: (Deno.env.get('RESEND_OVERRIDE_TO') ?? '').trim(),
  replyTo: (Deno.env.get('RESEND_REPLY_TO') ?? '').trim(),
})

Deno.serve(handler)
