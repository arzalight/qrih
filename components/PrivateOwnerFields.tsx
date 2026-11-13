'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { normalizeOwnerName, type OwnerChoice, type PendingOwner, type OwnerContactRecord, type PropertyPrivateDetails } from '@/lib/private-commercial'

export function usePrivateSessionGuard() {
  const [changed, setChanged] = useState(false)
  useEffect(() => {
    const client = createClient()
    if (!client) return
    let identity: string | null | undefined
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      const next = session?.user.id || null
      if (identity !== undefined && next !== identity) setChanged(true)
      identity = next
    })
    return () => subscription.unsubscribe()
  }, [])
  return changed
}
export function OwnerContactFields({ owner }: { owner?: Partial<OwnerContactRecord> }) {
  const id = useId()
  return <div className="private-owner-fields">
    <label htmlFor={id + '-name'}>Nombre del propietario o contacto principal · obligatorio</label>
    <input id={id + '-name'} name="owner_name" defaultValue={owner?.name || ''} maxLength={160} />
    <label htmlFor={id + '-company'}>Empresa o razón social</label>
    <input id={id + '-company'} name="owner_company" defaultValue={owner?.company || ''} maxLength={200} />
    <label htmlFor={id + '-phone'}>Teléfono</label>
    <input id={id + '-phone'} name="owner_phone" type="tel" defaultValue={owner?.phone || ''} maxLength={40} />
    <label htmlFor={id + '-email'}>Correo electrónico</label>
    <input id={id + '-email'} name="owner_email" type="email" defaultValue={owner?.email || ''} maxLength={254} />
    <label htmlFor={id + '-notes'}>Notas privadas</label>
    <textarea id={id + '-notes'} name="owner_notes" rows={3} defaultValue={owner?.notes || ''} maxLength={3000} />
  </div>
}
export function ownerBody(form: FormData) {
  return { name: form.get('owner_name'), company: form.get('owner_company'), phone: form.get('owner_phone'), email: form.get('owner_email'), notes: form.get('owner_notes') }
}

export function PrivatePropertyFields({ initial, disabled = false }: { initial?: PropertyPrivateDetails | null; disabled?: boolean }) {
  const [owners, setOwners] = useState<OwnerChoice[]>([])
  const [selected, setSelected] = useState(initial?.owner_contact_id || '')
  const [selectedLabel, setSelectedLabel] = useState('')
  const [pending, setPending] = useState<PendingOwner | null>(initial?.pending_owner || null)
  const [state, setState] = useState('pending')
  const [message, setMessage] = useState('Comprobando herramientas privadas…')
  const [search, setSearch] = useState(initial?.pending_owner?.name || '')
  const [searchState, setSearchState] = useState('idle')
  const [retry, setRetry] = useState(0)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const sessionChanged = usePrivateSessionGuard()
  const id = useId()
  const searchInput = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const controller = new AbortController()
    setState('pending')
    const selection = initial?.owner_contact_id
    void fetch('/api/propietarios?picker=1' + (selection ? '&selection=' + encodeURIComponent(selection) : ''), { signal: controller.signal, cache: 'no-store' }).then(async response => {
      const data = await response.json()
      if (controller.signal.aborted) return
      if (!response.ok) { setState(data.code === 'not_enabled' ? 'disabled' : 'error'); setMessage(data.error || 'No se pudo comprobar el directorio.'); return }
      if (data.owner) { setSelectedLabel(data.owner.name); setSearch(data.owner.name) }
      setState('ready'); setMessage('Datos privados. No aparecen en el catálogo, fichas ni PDF.')
    }).catch(() => { if (!controller.signal.aborted) { setState('error'); setMessage('No se pudo comprobar el directorio. Recarga antes de guardar.') } })
    return () => controller.abort()
  }, [initial?.owner_contact_id])
  useEffect(() => {
    setOwners([]); setActive(-1)
    if (state !== 'ready' || sessionChanged || selected || search.trim().length < 2) { setSearchState('idle'); return }
    const controller = new AbortController()
    setSearchState('loading')
    const timer = setTimeout(() => {
      void fetch('/api/propietarios?picker=1', { headers: { 'X-QRIH-Owner-Search': encodeURIComponent(search) }, signal: controller.signal, cache: 'no-store' }).then(async response => {
        const data = await response.json()
        if (controller.signal.aborted) return
        if (!response.ok) { setSearchState('error'); return }
        setOwners((data.owners || []).slice(0, 3)); setSearchState('ready')
      }).catch(() => { if (!controller.signal.aborted) setSearchState('error') })
    }, 300)
    return () => { clearTimeout(timer); controller.abort() }
  }, [search, selected, state, retry, sessionChanged])
  function choose(owner: OwnerChoice) {
    setSelected(owner.id); setSelectedLabel(owner.name); setSearch(owner.name); setPending(null); setActive(-1); searchInput.current?.focus(); setOpen(false)
  }
  function createPending() {
    setPending(previous => previous || { request_id: crypto.randomUUID(), name: search.trim(), company: null, phone: null, email: null })
    setSelected(''); setActive(-1); searchInput.current?.focus(); setOpen(false)
  }
  const canCreate = !selected && !pending && Boolean(search.trim())
  const exactMatch = !selected && owners.some(owner => normalizeOwnerName(owner.name) === normalizeOwnerName(search))
  const options = [...owners.map(owner => () => choose(owner)), ...(canCreate ? [createPending] : [])]
  function clear() { setSelected(''); setSelectedLabel(''); setSearch(''); setPending(null); setOpen(false); searchInput.current?.focus() }
  if (sessionChanged) return <div role="alert"><input type="hidden" name="private_fields_present" value="error" />La sesión cambió. Recarga antes de continuar con datos privados.</div>
  return <><input type="hidden" name="private_fields_present" value={state} /><fieldset className="private-property-fields" disabled={disabled || state !== 'ready'}>
    <legend>Identificación privada</legend>
    <p className="ui-help" role="status">{message}</p>
    <label htmlFor={id + '-internal'}>Nombre interno de la propiedad</label>
    <input id={id + '-internal'} name="internal_name" maxLength={160} defaultValue={initial?.internal_name || ''} placeholder="Ej. Bodega junto a la gasolinera" />
    <input type="hidden" name="owner_contact_id" value={selected} />
    <input type="hidden" name="pending_owner" value={JSON.stringify(pending)} />
    <input type="hidden" name="owner_unresolved" value={!selected && !pending && search.trim() ? '1' : '0'} />
    <div className="owner-combobox" onBlur={event => {
      // Touch browsers can report a null target before an option's click. Do not
      // unmount that option mid-tap; Escape/selection/known outside focus close it.
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <label htmlFor={id + '-search'}>Propietario asociado · opcional</label>
      <input ref={searchInput} id={id + '-search'} role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open && !selected && Boolean(search.trim())}
        aria-controls={id + '-options'} aria-activedescendant={open && active >= 0 ? id + '-option-' + active : undefined} aria-describedby={id + '-help'}
        value={search} maxLength={160} onFocus={() => setOpen(true)} onChange={event => { setSearch(event.target.value); setSelected(''); setSelectedLabel(''); setPending(null); setOpen(true); setActive(-1) }}
        onKeyDown={event => {
          if (event.key === 'Escape') { event.preventDefault(); setOpen(false); setActive(-1) }
          if (['ArrowDown', 'ArrowUp'].includes(event.key) && !selected && options.length) {
            event.preventDefault(); setOpen(true); setActive(value => value < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1) : (value + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
          }
          if (event.key === 'Enter' && !selected && search.trim()) { event.preventDefault(); if (open && active >= 0) options[active]?.() }
        }} placeholder="Escribe al menos 2 caracteres para buscar" />
      <p id={id + '-help'} className="ui-help" role="status">
        {selected ? `Seleccionado: ${selectedLabel || 'comprobando nombre…'}` : searchState === 'loading' ? 'Buscando en tu directorio…' : searchState === 'error' ? 'No se pudo buscar. Puedes reintentar sin perder tus datos.' : searchState === 'ready' && owners.length === 0 ? 'Sin coincidencias en tu directorio.' : 'Busca por nombre; usa las flechas y Enter para seleccionar.'}
      </p>
      {searchState === 'error' && <button type="button" onClick={() => { setRetry(value => value + 1); setOpen(true) }}>Reintentar búsqueda</button>}
      {exactMatch && <p className="ui-help">Ya hay un nombre coincidente. Si es la misma persona, selecciona el resultado para evitar duplicados.</p>}
      {open && !selected && search.trim() && <div id={id + '-options'} role="listbox" aria-label="Propietarios encontrados" className="owner-combobox__options">
        {owners.map((owner, index) => <button type="button" role="option" tabIndex={-1} aria-selected={active === index} id={id + '-option-' + index} key={owner.id} onClick={() => choose(owner)}>
          {owner.name}{owner.company && <span> · {owner.company}</span>}
        </button>)}
        {canCreate && <button type="button" role="option" tabIndex={-1} aria-selected={active === owners.length} id={id + '-option-' + owners.length} onClick={createPending}>Crear nuevo propietario: {search.trim()}</button>}
      </div>}
      {(selected || pending || search) && <button type="button" onClick={clear}>Limpiar propietario</button>}
    </div>
    {pending && <div className="owner-pending-panel">
      <p role="status"><strong>Propietario pendiente de registro: {pending.name}</strong></p>
      <p className="ui-help">El borrador conserva estos datos privados. El contacto se registrará y asociará sólo al enviar la propiedad a revisión.</p>
      <details><summary>Completar datos opcionales del propietario</summary>
        {([{ key: 'company', label: 'Empresa', max: 200, type: 'text' }, { key: 'phone', label: 'Teléfono', max: 40, type: 'tel' }, { key: 'email', label: 'Correo electrónico', max: 254, type: 'email' }] as const).map(field => <div key={field.key}>
          <label htmlFor={id + '-' + field.key}>{field.label}</label><input id={id + '-' + field.key} type={field.type} maxLength={field.max} value={pending[field.key] || ''} onChange={event => setPending({ ...pending, [field.key]: event.target.value || null })} />
        </div>)}
      </details>
      {owners.length > 0 && <p className="ui-help">Si reconoces un propietario existente, selecciónalo en la búsqueda para evitar duplicados.</p>}
    </div>}
  </fieldset></>
}
