import type { SupabaseClient } from '@supabase/supabase-js'

export type OwnerContact = {
  name: string | null
  phone: string | null
  company: string | null
  email: string | null
}

type ContactState = {
  authorizationId: string
  status: 'pending' | 'authorized'
  owner: OwnerContact | null
}

// Sólo lectura: identidad verificada, autorización propia bajo RLS y RPC existente.
export async function loadOwnPropertyContact(
  supabase: SupabaseClient,
  propertyId: string,
): Promise<ContactState | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null

    const { data: authorization, error } = await supabase
      .from('property_contact_authorizations')
      .select('id, status')
      .eq('property_id', propertyId)
      .eq('advisor_id', user.id)
      .in('status', ['pending', 'authorized'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !authorization || !['pending', 'authorized'].includes(authorization.status)) return null
    const state: ContactState = {
      authorizationId: authorization.id,
      status: authorization.status,
      owner: null,
    }
    if (state.status !== 'authorized') return state

    const { data: contacts, error: contactError } = await supabase.rpc(
      'get_property_publisher_contact', { p_property_id: propertyId },
    )
    if (!contactError && Array.isArray(contacts) && contacts.length) state.owner = contacts[0]
    return state
  } catch {
    // Red/permiso fallido: no datos privados ni mensaje de error arbitrario.
    return null
  }
}
