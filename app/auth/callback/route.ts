import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=confirmation', requestUrl.origin)
    )
  }

  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return NextResponse.redirect(
      new URL('/login?error=config', requestUrl.origin)
    )
  }

  const { error } =
    await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=confirmation', requestUrl.origin)
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login?error=confirmation', requestUrl.origin)
    )
  }

  const metadata = user.user_metadata || {}

  // Un callback repetido no debe sobrescribir rol, plan ni identidad existentes.
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles').select('id').eq('id', user.id).maybeSingle()
  if (lookupError) return NextResponse.redirect(new URL('/login?error=profile', requestUrl.origin))
  if (existingProfile) return NextResponse.redirect(new URL('/publicar', requestUrl.origin))

  const { error: profileError } =
    await supabase
      .from('profiles')
      .insert(
        {
          id: user.id,
          full_name: String(metadata.full_name || '').trim().slice(0, 120),
          phone: typeof metadata.phone === 'string' ? metadata.phone.slice(0, 30) : null,
          company_name:
            typeof metadata.company_name === 'string' ? metadata.company_name.slice(0, 160) : null,
          user_type: ['advisor', 'owner'].includes(metadata.user_type) ? metadata.user_type : null,
        }
      )

  if (profileError) {
    return NextResponse.redirect(
      new URL(
        '/login?error=profile',
        requestUrl.origin
      )
    )
  }

  return NextResponse.redirect(
    new URL('/publicar', requestUrl.origin)
  )
}
