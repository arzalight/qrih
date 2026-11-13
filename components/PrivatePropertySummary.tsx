import Link from 'next/link'
import { privateCommercialActor, loadPropertyPrivateDetails } from '@/lib/private-commercial-server'

// Only import from authenticated own-property/admin routes. RLS checks every read.
export async function PrivatePropertySummary({ propertyId }: { propertyId: string }) {
  const actor = await privateCommercialActor()
  if (!actor) return null
  try {
    const details = await loadPropertyPrivateDetails(actor.client, propertyId)
    if (!details) return null
    const { data: contact } = details.owner_contact_id ? await actor.client.from('advisor_owners')
      .select('name,company,phone,email,advisor_id,archived_at').eq('id', details.owner_contact_id).maybeSingle() : { data: null }
    return <section className="ui-panel property-detail-section" aria-label="Datos privados de la propiedad">
      <h2>Datos privados</h2><p>No se incluyen en el catálogo, fichas compartidas ni PDF.</p>
      <p><strong>Nombre interno:</strong> {details.internal_name || 'Sin nombre interno'}</p>
      {contact && <><p><strong>Propietario:</strong> {contact.name}{contact.archived_at ? ' (archivado)' : ''}</p>
        <p>{[contact.company, contact.phone, contact.email].filter(Boolean).join(' · ')}</p>
        <Link href={`/perfil/propietarios${contact.advisor_id !== actor.id ? `?advisor=${contact.advisor_id}` : ''}`}>Consultar directorio privado</Link></>}
    </section>
  } catch { return <p role="status">No fue posible cargar los datos privados.</p> }
}
