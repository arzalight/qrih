import { NextResponse } from 'next/server'
import { privatePropertyInput, ownerSaveError } from './private-commercial'
import { isPriceCurrency, parsePriceInput, propertyPriceForStorage as propertyPrice } from './property-price'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadVerifiedImage } from '@/lib/verified-media-server'
import { assertSameOrigin, readForm, validUuid } from '@/lib/request-security'

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === '') {
    return null
  }

  const number = Number(value)

  return Number.isFinite(number) ? number : null
}

type GalleryEntry =
  | {
      kind: 'existing'
      storage_path: string
      title: string
    }
  | { kind: 'uploaded'; storage_path: string; title: string }
  | {
      kind: 'new'
      title: string
      file_index: number
    }

export async function saveProperty(request: Request, duplicate = false) {
  try { return await performSave(request, duplicate) }
  catch { return NextResponse.json({ error: 'No pudimos confirmar el guardado. Revisa Mis propiedades antes de reintentar.' }, { status: 503 }) }
}

async function performSave(request: Request, duplicate: boolean) {
  const supabase = await createServerSupabaseClient()

  if (!supabase) {
    return NextResponse.json(
      {
        error: 'Supabase no está configurado correctamente.',
      },
      { status: 500 }
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Necesitas iniciar sesión para guardar la edición.' }, { status: 401 })
  }

  let form: FormData
  try { assertSameOrigin(request); form = await readForm(request, 4 * 1024 * 1024) }
  catch { return NextResponse.json({ error: 'Solicitud inválida o demasiado grande.' }, { status: 400 }) }
  let privateDetails
  try { privateDetails = privatePropertyInput(form) }
  catch { return NextResponse.json({ error: 'No se pudieron validar los datos privados. Recarga antes de guardar.' }, { status: 400 }) }

  const id = String(form.get('id') || '')
  const requestId = String(form.get('request_id') || '')
  if (duplicate && !validUuid(requestId)) return NextResponse.json({ error: 'Intento de creación inválido.' }, { status: 400 })
  const submissionAction =
    duplicate || form.get('submission_action') === 'draft'
      ? 'draft'
      : 'pending'

  const title = String(form.get('title') || '').trim()
  const operation = String(form.get('operation') || '')
  const price = parsePriceInput(form.get('price'))
  const currency = form.get('price_currency')
  const priceUnit = String(form.get('price_unit') || '')
  if (!price || !isPriceCurrency(currency) || !form.has('price_unit') || !['', 'm2', 'total'].includes(priceUnit)) {
    return NextResponse.json({ error: 'Ingresa un precio numérico válido para la nueva propiedad.' }, { status: 400 })
  }
  const zoneGeneral = String(form.get('zone_general') || '').trim()
  const zone = String(form.get('zone') || '').trim()
  const visibility = String(form.get('visibility') || 'zone')
  const address = String(form.get('address') || '').trim()

  const area = Number(form.get('area') || 0)
  const covered = optionalNumber(form.get('covered'))
  const exteriorArea = optionalNumber(form.get('exterior_area'))
  const officesArea = optionalNumber(form.get('offices_area'))
  const parking = optionalNumber(form.get('parking'))
  const docks = optionalNumber(form.get('docks'))

  const maxHeight = String(form.get('max_height') || '').trim()
  const description = String(form.get('description') || '').trim()

  const pricePlusVat = form.get('price_plus_vat') === 'on'
  const pricePlusMaintenance =
    form.get('price_plus_maintenance') === 'on'
  const negotiable = form.get('negotiable') === 'on'
  const commission = form.get('commission') === 'on'

  const images = form
    .getAll('images')
    .filter(
      (value): value is File =>
        value instanceof File && value.size > 0
    )

  if (images.length > 7) {
    return NextResponse.json(
      {
        error:
          'Puedes subir un máximo de 7 fotografías por propiedad.',
      },
      { status: 400 }
    )
  }

  if (
    images.some(
      (image) =>
        image.type !== 'image/webp' ||
        image.size > 20 * 1024 * 1024
    )
  ) {
    return NextResponse.json(
      {
        error:
          'Las fotografías deben optimizarse a WebP antes de subirlas.',
      },
      { status: 400 }
    )
  }

  if (!validUuid(id) || !title || title.length > 200 || !price || price.length > 80
    || !zoneGeneral || zoneGeneral.length > 160 || !zone || zone.length > 160
    || !Number.isFinite(area) || area <= 0 || area > 1e12 || description.length > 10000
    || address.length > 1000 || maxHeight.length > 80
    || !['Renta','Venta'].includes(operation) || !['zone','address'].includes(visibility)
    || [covered,exteriorArea,officesArea,parking,docks].some((n) => n !== null && (n < 0 || n > 1e12))
    || [parking,docks].some((n) => n !== null && !Number.isInteger(n))) {
    return NextResponse.json(
      {
        error: 'Faltan datos obligatorios.',
      },
      { status: 400 }
    )
  }

  let gallery: GalleryEntry[]

  try {
    const rawGallery = String(form.get('gallery') || '')

    if (!rawGallery) {
      throw new Error('La galería no fue enviada.')
    }

    const parsedGallery = JSON.parse(rawGallery)

    if (!Array.isArray(parsedGallery) || parsedGallery.some((entry) =>
      !entry || typeof entry !== 'object' || !['existing','new','uploaded'].includes(entry.kind)
      || typeof entry.title !== 'string' || entry.title.length > 120
      || (entry.kind !== 'new' && typeof entry.storage_path !== 'string'))) {
      throw new Error('La galería no tiene un formato válido.')
    }

    gallery = parsedGallery
  } catch {
    return NextResponse.json(
      {
        error:
          'No fue posible interpretar la galería de fotografías.',
      },
      { status: 400 }
    )
  }

  if (gallery.length < (duplicate ? 0 : 1) || gallery.length > 7) {
    return NextResponse.json(
      {
        error:
          duplicate ? 'El borrador puede tener máximo 7 fotografías.' : 'La propiedad debe conservar al menos una fotografía y puede tener máximo 7.',
      },
      { status: 400 }
    )
  }

  const {
    data: property,
    error: propertyError,
  } = await supabase
    .from('properties')
    .select(`
      id,
      main_image_path,
      updated_at,
      status,
      title,
      operation,
      price_display,
      price_plus_vat,
      price_plus_maintenance,
      negotiable,
      zone_general,
      zone,
      location_visibility,
      address,
      total_area,
      covered_area,
      exterior_area,
      max_height,
      offices_area,
      parking,
      docks,
      description,
      share_commission,
      rejection_reason
    `)
    .eq('id', id)
    .eq('owner_id', user.id)
    .in('status', duplicate ? ['draft', 'pending', 'published', 'paused', 'rejected', 'expired', 'pending_update'] : ['draft', 'rejected'])
    .single()

  if (propertyError || !property) {
    return NextResponse.json(
      {
        error:
          'Esta propiedad no existe, no te pertenece o ya no puede editarse.',
      },
      { status: 403 }
    )
  }

  if (duplicate) {
    const { data: profile } = await supabase.from('profiles').select('account_status').eq('id', user.id).single()
    if (profile?.account_status !== 'active') return NextResponse.json({ error: 'Necesitas una cuenta activa.' }, { status: 403 })
    // Idempotency lookup and migration preflight before generating any objects.
    const previous = await supabase.rpc('qrih_duplicate_property', {
      p_source_id: id, p_request_id: requestId, p_changes: null, p_images: null,
    })
    if (previous.error) return NextResponse.json({ error: 'La creación de duplicados no está disponible. No se cambió la propiedad original.' }, { status: 503 })
    if (previous.data) {
      if (!validUuid(previous.data)) return NextResponse.json({ error: 'No pudimos confirmar la creación.' }, { status: 503 })
      return NextResponse.json({ success: true, id: previous.data, status: 'draft' })
    }
  }

  const {
    data: currentImages,
    error: currentImagesError,
  } = await supabase
    .from('property_images')
    .select('storage_path, title, position')
    .eq('property_id', property.id)
    .order('position', { ascending: true })

  if (currentImagesError) {
    return NextResponse.json(
      {
        error:
          'No fue posible consultar la galería actual de la propiedad.',
      },
      { status: 400 }
    )
  }

  const currentStoragePaths = new Set(
    (currentImages || []).map((image) => image.storage_path)
  )
  if (duplicate && property.main_image_path && !currentStoragePaths.size) currentStoragePaths.add(property.main_image_path)

  const existingPaths = new Set<string>()

  for (const entry of gallery) {
    if (entry.kind === 'uploaded' && !entry.storage_path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Fotografía no autorizada.' }, { status: 400 })
    }
    if (entry.kind !== 'existing') {
      continue
    }

    if (
      !entry.storage_path ||
      !entry.storage_path.startsWith(`${user.id}/`) ||
      !currentStoragePaths.has(entry.storage_path) ||
      existingPaths.has(entry.storage_path)
    ) {
      return NextResponse.json(
        {
          error:
            'La galería contiene una fotografía existente no válida.',
        },
        { status: 400 }
      )
    }

    existingPaths.add(entry.storage_path)
  }

  const newEntries = gallery.filter(
    (entry): entry is Extract<GalleryEntry, { kind: 'new' }> =>
      entry.kind === 'new'
  )

  if (
    newEntries.some(
      (entry) =>
        !Number.isInteger(entry.file_index) ||
        entry.file_index < 0 ||
        entry.file_index >= images.length
    )
  ) {
    return NextResponse.json(
      {
        error:
          'La galería contiene referencias inválidas a fotografías nuevas.',
      },
      { status: 400 }
    )
  }

  const referencedNewIndexes = new Set(
    newEntries.map((entry) => entry.file_index)
  )

  if (referencedNewIndexes.size !== images.length || newEntries.length !== images.length) {
    return NextResponse.json(
      {
        error:
          'Las fotografías nuevas no coinciden con la galería enviada.',
      },
      { status: 400 }
    )
  }

  const uploadedImages: {
    path: string
  }[] = []

  const storage = supabase.storage
  const copiedPaths = new Map<string, string>()

  async function removeUploadedImages() {
    if (!uploadedImages.length) {
      return
    }

    await storage
      .from('property-images')
      .remove(uploadedImages.map((image) => image.path))
  }

  if (duplicate) {
    try {
      // Only paths authorized as source-gallery members and belonging to this
      // actor above. No caller URLs, signed-URL persistence or shared objects.
      for (const path of existingPaths) {
        const { data: bytes, error } = await storage.from('property-images').download(path)
        if (error || !bytes || bytes.size > 20 * 1024 * 1024) throw new Error('Image unavailable')
        const copy = await uploadVerifiedImage(new File([bytes], 'copy.webp', { type: 'image/webp' }), user.id, 'property-images')
        uploadedImages.push(copy)
        copiedPaths.set(path, copy.path)
      }
    } catch {
      await removeUploadedImages()
      return NextResponse.json({ error: 'No se pudieron copiar todas las fotografías. Conservamos el formulario y la propiedad original.' }, { status: 400 })
    }
  }

  const newImageOffset = uploadedImages.length
  for (const [index, image] of images.entries()) {
    try {
      const { path } = await uploadVerifiedImage(image, user.id, 'property-images')
      uploadedImages.push({ path })
    } catch {
      await removeUploadedImages()

      return NextResponse.json(
        {
          error: `No fue posible subir la fotografía ${
            index + 1
          }. Revisa formato, tamaño y límite de fotografías.`,
        },
        { status: 400 }
      )
    }
  }

  const finalImages = gallery.map((entry) => {
    if (entry.kind !== 'new') {
      return {
        storage_path: duplicate && entry.kind === 'existing' ? copiedPaths.get(entry.storage_path)! : entry.storage_path,
        title: entry.title.trim().slice(0, 120),
      }
    }

    return {
      storage_path: uploadedImages[newImageOffset + entry.file_index].path,
      title: entry.title.trim().slice(0, 120),
    }
  })

  let updateError: unknown
  try {
    const result = await supabase.rpc(privateDetails ? ('pending_owner' in privateDetails ? 'qrih_save_property_with_owner' : 'qrih_save_property_with_private') : duplicate ? 'qrih_duplicate_property' : 'qrih_update_property_with_images', {
      ...(privateDetails ? { p_mode: duplicate ? 'duplicate' : 'update', p_property_id: property.id,
        p_request_id: duplicate ? requestId : null, p_expected_updated_at: property.updated_at, p_private: privateDetails } : duplicate ? { p_source_id: property.id, p_request_id: requestId } : {
        p_property_id: property.id, p_expected_updated_at: property.updated_at,
      }),
      p_images: finalImages,
      p_changes: {
        title,
        operation,
        price_display: propertyPrice({ price_value: price, price_currency: currency, price_unit: priceUnit, operation }),
        price_value: price,
        price_unit: priceUnit || null,
        price_currency: currency,
        price_plus_vat: pricePlusVat,
        price_plus_maintenance: pricePlusMaintenance,
        negotiable,
        zone_general: zoneGeneral,
        zone,
        location_visibility: visibility,
        address: address || null,
        total_area: area,
        covered_area: covered,
        exterior_area: exteriorArea,
        max_height: maxHeight || null,
        offices_area: officesArea,
        parking,
        docks,
        description,
        share_commission: commission,
        status: submissionAction,
      },
    })
    updateError = result.error
    if (!updateError && duplicate) {
      if (!validUuid(result.data)) return NextResponse.json({ error: 'No pudimos confirmar la creación. Revisa Mis propiedades.' }, { status: 503 })
      return NextResponse.json({ success: true, id: result.data, status: 'draft' })
    }
  } catch {
    return NextResponse.json({ error: 'No pudimos confirmar el guardado. Recarga la propiedad antes de reintentar.' }, { status: 503 })
  }

  if (updateError) {
    // Una respuesta perdida no demuestra rollback. Conservar las fotografías
    // hasta conciliar referencias; nunca limpiar a partir de ese error solamente.

    return NextResponse.json(
      {
        error: ownerSaveError(updateError),
      },
      { status: 400 }
    )
  }

  const removedPaths = (currentImages || [])
    .map((image) => image.storage_path)
    .filter((path) => !existingPaths.has(path))

  if (!duplicate && removedPaths.length) {
    const storage = supabase.storage
    let storageDeleteError: unknown
    try {
      const result = await storage
        .from('property-images')
        .remove(removedPaths)
      storageDeleteError = result.error
    } catch {
      storageDeleteError = true
    }

    if (storageDeleteError) {
      return NextResponse.json({
        success: true,
        warning:
          'La propiedad fue actualizada, pero algunas fotografías eliminadas podrían seguir almacenadas.',
        message:
          'Propiedad enviada nuevamente a revisión.',
      })
    }
  }

  return NextResponse.json({
    success: true,
    message:
      'Propiedad actualizada y enviada nuevamente a revisión.',
  })
}
