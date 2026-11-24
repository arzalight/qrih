import { NextResponse } from 'next/server'
import { assertSameOrigin, limitedBody } from '@/lib/request-security'
import { createPublicServerSupabaseClient } from '@/lib/supabase-public-server'
import {
  classifyPublicVisitPath,
  hashVisitSession,
  isLikelyBotUserAgent,
  utcDayKey,
} from '@/lib/site-visits'

const PRIVATE_HEADERS = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
}

function privateJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: PRIVATE_HEADERS })
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request)
  } catch {
    return privateJson({ error: 'Origen inválido.' }, 403)
  }

  if (isLikelyBotUserAgent(request.headers.get('user-agent'))) {
    return privateJson({ ok: true, recorded: false, ignored: 'bot' }, 200)
  }

  let payload: Record<string, unknown>
  try {
    const raw = await limitedBody(request, 2048)
    const parsed: unknown = JSON.parse(new TextDecoder().decode(raw))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return privateJson({ error: 'Solicitud inválida.' }, 400)
    }
    payload = parsed as Record<string, unknown>
  } catch {
    return privateJson({ error: 'Solicitud inválida.' }, 400)
  }

  const landingGroup = classifyPublicVisitPath(payload.path)
  if (!landingGroup) {
    return privateJson({ ok: true, recorded: false, ignored: 'non_public_path' }, 200)
  }

  const sessionId = typeof payload.sessionId === 'string' ? payload.sessionId.trim() : ''
  const sessionHash = hashVisitSession(sessionId, utcDayKey())
  if (!sessionHash) {
    return privateJson({ error: 'Sesión inválida.' }, 400)
  }

  const supabase = createPublicServerSupabaseClient()
  if (!supabase) {
    return privateJson({ ok: false, recorded: false }, 503)
  }

  try {
    const { data, error } = await supabase.rpc('qrih_record_site_visit', {
      p_session_hash: sessionHash,
      p_landing_group: landingGroup,
    })

    if (error) {
      return privateJson({ ok: false, recorded: false }, 503)
    }

    return privateJson({ ok: true, recorded: Boolean(data) }, 200)
  } catch {
    return privateJson({ ok: false, recorded: false }, 503)
  }
}
