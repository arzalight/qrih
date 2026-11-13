import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/Header'
import { OwnerDirectory } from '@/components/OwnerDirectory'
import { privateCommercialActor } from '@/lib/private-commercial-server'
import { validUuid } from '@/lib/request-security'

export default async function OwnersPage({ searchParams }: { searchParams: Promise<{ advisor?: string }> }) {
  const actor = await privateCommercialActor()
  if (!actor) redirect('/login?next=%2Fperfil%2Fpropietarios')
  const { advisor } = await searchParams
  if (advisor && (!actor.admin || !validUuid(advisor))) return <main><h1>Directorio no disponible</h1></main>
  return <><Header /><main className="workspace-page owners-page"><Link href="/perfil">← Volver a Mi perfil</Link><h1>Mis propietarios</h1>
    <OwnerDirectory advisor={advisor} readOnly={!!advisor && advisor !== actor.id} />
  </main></>
}
