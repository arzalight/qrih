import { validUuid } from '@/lib/request-security'

export type OwnerContactRecord = { id: string; advisor_id: string; name: string; company: string | null; phone: string | null; email: string | null; notes: string | null; archived_at: string | null; created_at: string; updated_at: string }
export type PendingOwner = { request_id: string; name: string; company: string | null; phone: string | null; email: string | null }
export type OwnerChoice = { id: string; name: string; company: string | null }
export type PropertyPrivateDetails = { internal_name: string | null; owner_contact_id: string | null; pending_owner?: PendingOwner | null }
export function normalizeOwnerName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}
export function ownerSaveError(error: unknown) {
  return error && typeof error === 'object' && 'message' in error && error.message === 'OWNER_EQUIVALENT_EXISTS'
    ? 'Ya existe un propietario equivalente. Búscalo y selecciónalo para evitar un duplicado; conservamos los datos del formulario.'
    : 'No pudimos confirmar el guardado. Conservamos los datos del formulario. Revisa Mis propiedades antes de reintentar.'
}
export function pendingOwnerInput(value: unknown): PendingOwner | null {
  if (value === null) return null
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Propietario pendiente inválido.')
  const input = value as Record<string, unknown>
  if (Object.keys(input).some(key => !['request_id', 'name', 'company', 'phone', 'email'].includes(key)) || !validUuid(input.request_id)) throw Error('Propietario pendiente inválido.')
  const data = ownerInput(input)
  return { request_id: input.request_id, name: data.name!, company: data.company, phone: data.phone, email: data.email }
}
export function ownerInput(input: Record<string, unknown>) {
  const fields = { name: 160, company: 200, phone: 40, email: 254, notes: 3000 }
  const data: Record<string, string | null> = {}
  for (const [key, max] of Object.entries(fields)) {
    const value = input[key] == null ? '' : input[key]
    if (typeof value !== 'string' || value.trim().length > max || /\u0000/.test(value)) throw Error('Datos privados inválidos.')
    data[key] = value.trim() || null
  }
  if (!data.name || (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) throw Error('Revisa el nombre y el correo del propietario.')
  return data
}
export function privatePropertyInput(form: FormData): PropertyPrivateDetails | null {
  const state = form.get('private_fields_present')
  if (state == null || state === 'disabled') return null
  if (state !== 'ready') throw Error('Espera a que se comprueben los datos privados o recarga antes de guardar.')
  if (form.get('owner_unresolved') === '1') throw Error('Selecciona un propietario o confirma «Crear nuevo propietario» antes de guardar.')
  const internal_name = String(form.get('internal_name') || '').trim()
  const owner = String(form.get('owner_contact_id') || '')
  if (internal_name.length > 160 || /\u0000/.test(internal_name) || (owner && !validUuid(owner))) throw Error('Revisa los datos privados de la propiedad.')
  const details: PropertyPrivateDetails = { internal_name: internal_name || null, owner_contact_id: owner || null }
  if (form.has('pending_owner')) {
    try { details.pending_owner = pendingOwnerInput(JSON.parse(String(form.get('pending_owner')))) }
    catch { throw Error('Revisa los datos del propietario pendiente.') }
    if (owner && details.pending_owner) throw Error('Elige un propietario existente o uno pendiente, no ambos.')
  }
  return details
}

export type UrgencyState = { demand_request_id?: string; expires_at?: string | null; urgency_expires_at?: string | null }
export function activeDemand(demand: { status?: string; created_at?: string }, now = Date.now()) {
  const created = Date.parse(demand.created_at || '')
  return demand.status === 'new' && Number.isFinite(created) && created >= now - 45 * 86400000
}
export function urgencyActive(demand: { status?: string; created_at?: string } & UrgencyState, now = Date.now()) {
  const expires = Date.parse(demand.urgency_expires_at || demand.expires_at || '')
  return activeDemand(demand, now) && Number.isFinite(expires) && expires > now
}
export function prioritizeUrgencies<T extends { status?: string; created_at?: string } & UrgencyState>(items: T[], now = Date.now()) {
  return items.map((item, index) => ({ item, index })).sort((a, b) => Number(urgencyActive(b.item, now)) - Number(urgencyActive(a.item, now)) || a.index - b.index).map(({ item }) => item)
}
