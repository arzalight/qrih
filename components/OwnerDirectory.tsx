'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { OwnerContactFields, ownerBody, usePrivateSessionGuard } from './PrivateOwnerFields'
import type { OwnerContactRecord } from '@/lib/private-commercial'
type LinkedProperty = { id: string; title: string; internal_name?: string | null }

export function OwnerDirectory({ advisor, readOnly = false }: { advisor?: string; readOnly?: boolean }) {
  const [owners, setOwners] = useState<OwnerContactRecord[]>([])
  const [selected, setSelected] = useState<OwnerContactRecord | null>(null)
  const [properties, setProperties] = useState<LinkedProperty[]>([])
  const [choices, setChoices] = useState<LinkedProperty[]>([])
  const [choiceCount, setChoiceCount] = useState(0)
  const [choicePage, setChoicePage] = useState(0)
  const [q, setQ] = useState('')
  const [archived, setArchived] = useState(false)
  const [page, setPage] = useState(0)
  const [count, setCount] = useState(0)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [available, setAvailable] = useState(false)
  const [message, setMessage] = useState('')
  const working = useRef(false)
  const attempt = useRef<string | null>(null)
  const changed = usePrivateSessionGuard()
  const params = (extra: Record<string, string> = {}) => new URLSearchParams({ ...(advisor ? { advisor } : {}), ...extra }).toString()
  useEffect(() => {
    const controller = new AbortController();setLoading(true)
    const query = new URLSearchParams({ archived: archived ? '1' : '0', page: String(page), ...(advisor ? { advisor } : {}) })
    const timer = setTimeout(() => {
      void fetch('/api/propietarios?' + query, { headers: { 'X-QRIH-Owner-Search': encodeURIComponent(q) }, signal: controller.signal, cache: 'no-store' }).then(async response => {
        const data = await response.json()
        if (controller.signal.aborted) return
        if (!response.ok) { setOwners([]);setAvailable(false);setMessage(data.error || 'Directorio no disponible.');return }
        setOwners(data.owners);setCount(data.count || 0);setAvailable(true)
      }).catch(() => { if (!controller.signal.aborted) { setOwners([]);setAvailable(false);setMessage('No fue posible consultar el directorio.') } })
        .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    }, 250)
    return () => { clearTimeout(timer);controller.abort() }
  }, [q, archived, page, advisor, version])
  useEffect(() => {
    if (!selected) { setProperties([]);return }
    const controller = new AbortController()
    const query = new URLSearchParams({ id: selected.id, archived: '1', ...(advisor ? { advisor } : {}) })
    void fetch('/api/propietarios?' + query, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (controller.signal.aborted) return
      setProperties(response.ok ? data.properties : [])
      if (!response.ok) setMessage('No fue posible consultar las asociaciones. Recarga antes de cambiar datos.')
    }).catch(() => { if (!controller.signal.aborted) setMessage('No fue posible consultar las asociaciones.') })
    return () => controller.abort()
  }, [selected, advisor, version])
  async function write(body: Record<string, unknown>) {
    if (working.current || readOnly || changed) return null
    working.current = true;setBusy(true);setMessage('')
    try {
      const response = await fetch('/api/propietarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw Error(data.error || 'No fue posible confirmar el cambio.')
      setMessage('Cambio guardado.');setVersion(value => value + 1)
      if (data.owner) setSelected(data.owner)
      return data
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No pudimos confirmar el guardado. Revisa el directorio antes de reintentar.');return null }
    finally { working.current = false;setBusy(false) }
  }
  async function loadChoices(page = 0) {
    if (working.current || readOnly || changed) return
    working.current = true;setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/propietarios?' + params({ choices: 'properties', page: String(page) }), { cache: 'no-store' })
      const data = await response.json();if (!response.ok) throw Error('Unavailable')
      setChoices(previous => page ? [...previous, ...data.properties] : data.properties);setChoiceCount(data.count || data.properties.length);setChoicePage(page)
    } catch { setMessage('No fue posible consultar las propiedades.') }
    finally { working.current = false;setBusy(false) }
  }
  if (changed) return <p role="alert">La sesión cambió. Recarga para consultar el directorio privado de la cuenta actual.</p>
  return <section className="owner-directory" aria-label="Directorio privado de propietarios">
    <p className="ui-help">Datos privados. No aparecen en el catálogo, las fichas compartidas ni los PDF.{readOnly ? ' Consulta administrativa de sólo lectura.' : ''}</p>
    <div className="ui-actions"><label>Buscar por nombre<input value={q} maxLength={160} onChange={event => { setQ(event.target.value);setPage(0) }} /></label>
      <label><input type="checkbox" checked={archived} onChange={event => { setArchived(event.target.checked);setPage(0) }} /> Incluir archivados</label>
      {!readOnly && <button type="button" onClick={() => { setSelected(null);attempt.current = null;setMessage('') }} disabled={!available || busy}>Nuevo propietario</button>}</div>
    {loading && <p role="status">Consultando directorio…</p>}
    {message && <p role="status">{message}</p>}
    {available && <div className="owner-directory__grid"><div>
      {owners.length === 0 && <p>No hay propietarios con estos criterios.</p>}
      <ul className="owner-directory__list">{owners.map(owner => <li key={owner.id}><button type="button" disabled={busy} onClick={() => setSelected(owner)} aria-pressed={selected?.id === owner.id}>
        <strong>{owner.name}</strong><span>{owner.company || 'Sin empresa'}{owner.archived_at ? ' · Archivado' : ''}</span></button></li>)}</ul>
      <div className="ui-actions"><button type="button" disabled={!page || busy} onClick={() => setPage(value => value - 1)}>Anteriores</button><span>Página {page + 1} · {count} contactos</span><button type="button" disabled={(page + 1) * 50 >= count || busy} onClick={() => setPage(value => value + 1)}>Siguientes</button></div>
    </div><div>
      {(!readOnly || selected) && <form key={selected?.id || 'new'} aria-busy={busy} onSubmit={async event => {
        event.preventDefault();const form = new FormData(event.currentTarget)
        if (!String(form.get('owner_name') || '').trim()) { setMessage('Escribe el nombre del propietario.');return }
        attempt.current ||= crypto.randomUUID()
        await write({ action: selected ? 'update' : 'create', id: selected?.id || attempt.current, updated_at: selected?.updated_at, ...ownerBody(form) })
      }}><h2>{selected ? 'Datos del propietario' : 'Registrar propietario'}</h2><fieldset disabled={busy || readOnly}>
        <OwnerContactFields owner={selected || undefined} />
        {!readOnly && <button type="submit">{busy ? 'Guardando…' : selected ? 'Guardar cambios' : 'Registrar propietario'}</button>}
      </fieldset></form>}
      {selected && <><p className="ui-help">Creado: {new Date(selected.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}<br />Actualizado: {new Date(selected.updated_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}</p>
        {!readOnly && <button type="button" disabled={busy} onClick={() => void write({ action: selected.archived_at ? 'restore' : 'archive', id: selected.id, updated_at: selected.updated_at })}>{selected.archived_at ? 'Restaurar contacto' : 'Archivar contacto'}</button>}
        <h3>Propiedades asociadas</h3>{properties.length === 0 && <p>No hay propiedades asociadas.</p>}
        <ul>{properties.map(property => <li key={property.id}><Link href={readOnly ? `/admin/${property.id}` : `/mis-propiedades/${property.id}`}>{property.internal_name || property.title}</Link>{!readOnly && <button type="button" disabled={busy} onClick={() => void write({ action: 'associate', property_id: property.id, owner_contact_id: null })}>Desvincular</button>}</li>)}</ul>
        {!readOnly && !selected.archived_at && <><button type="button" onClick={() => void loadChoices()}>Consultar mis propiedades para asociar</button>
          {choices.length > 0 && <label>Asociar propiedad<select value="" disabled={busy} onChange={event => { const id = event.target.value;if (id) void write({ action: 'associate', property_id: id, owner_contact_id: selected.id }) }}><option value="">Selecciona una propiedad</option>{choices.map(property => <option key={property.id} value={property.id}>{property.title}</option>)}</select></label>}
          {choices.length < choiceCount && <button type="button" disabled={busy} onClick={() => void loadChoices(choicePage + 1)}>Ver más propiedades para asociar</button>}</>}
      </>}
    </div></div>}
  </section>
}
