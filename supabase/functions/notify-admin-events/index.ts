// Edge Function: notify-admin-events
// @ts-nocheck — Entorno Deno Edge Runtime de Supabase.
import { createNotifyAdminHandler } from './core.ts'

const handler = createNotifyAdminHandler({
  webhookSecret: (Deno.env.get('ADMIN_WEBHOOK_SECRET') ?? '').trim(),
  telegramBotToken: (Deno.env.get('TELEGRAM_BOT_TOKEN') ?? '').trim(),
  telegramChatId: (Deno.env.get('TELEGRAM_CHAT_ID') ?? '').trim(),
  portalUrl: (Deno.env.get('QRIH_PORTAL_URL') ?? 'https://qrih-staging.netlify.app').trim(),
})

Deno.serve(handler)
