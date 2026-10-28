import { isPriceCurrency, parsePriceInput, propertyPriceForStorage as propertyPrice } from './property-price'

function optionalNumber(value: FormDataEntryValue | null) {
  if (!value || String(value).trim() === '') {
    return null
  }

  const number = Number(value)

  if (!Number.isFinite(number)) throw new Error('Ingresa cantidades numéricas válidas.')
  return number
}

export function parsePropertySubmission(form: FormData) {
    const title = String(form.get('title') || '').trim()
    const currentOperation = String(form.get('operation') || '')
    const priceValue = parsePriceInput(form.get('price'))
    const currency = form.get('price_currency')

    const zoneGeneral = String(
      form.get('zone_general') || ''
    ).trim()

    const zone = String(form.get('zone') || '').trim()
    const visibility = String(form.get('visibility') || 'zone')
    const address = String(form.get('address') || '').trim()

    const totalArea = Number(form.get('area') || 0)
    const coveredArea = optionalNumber(form.get('covered'))
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
    const shareCommission = form.get('commission') === 'on'

    const publicationAuthorized =
      form.get('publication_authorized') === 'on'

    const termsAccepted =
      form.get('terms_accepted') === 'on'

    if (
      !title ||
      !currentOperation ||
      !priceValue ||
      !zoneGeneral ||
      !zone ||
      !totalArea ||
      !publicationAuthorized ||
      !termsAccepted
    ) {
      throw new Error('Completa los campos obligatorios y acepta las condiciones.')
    }

    if (!priceValue || !isPriceCurrency(currency)) {
      throw new Error('Ingresa un precio válido.')
    }

    const priceUnit =
      currentOperation === 'Renta'
        ? 'm2'
        : 'total'

    const priceDisplay = propertyPrice({ price_value: priceValue, price_currency: currency, price_unit: priceUnit, operation: currentOperation })


    if (title.length > 200 || !['Renta','Venta'].includes(currentOperation)
      || !['zone','address'].includes(visibility) || zoneGeneral.length > 160 || zone.length > 160
      || !Number.isFinite(totalArea) || totalArea <= 0 || totalArea > 1e12
      || [coveredArea, exteriorArea, officesArea, parking, docks].some(n => n !== null && (!Number.isFinite(n) || n < 0 || n > 1e12))
      || [parking, docks].some(n => n !== null && !Number.isInteger(n))
      || description.length > 10000 || address.length > 1000 || maxHeight.length > 80) throw new Error('Revisa los datos de la propiedad.')
    return {
        title,
        operation: currentOperation,
        // No enviar a moderación hasta que la galería esté registrada.
        status: 'draft',

        zone_general: zoneGeneral,
        zone,
        address: address || null,
        location_visibility: visibility,

        price_display: priceDisplay,
        price_value: priceValue,
        price_currency: currency,
        price_unit: priceUnit,
        price_plus_vat: pricePlusVat,
        price_plus_maintenance: pricePlusMaintenance,
        negotiable,

        total_area: totalArea,
        covered_area: coveredArea,
        exterior_area: exteriorArea,
        max_height: maxHeight || null,
        offices_area: officesArea,
        parking,
        docks,

        description,

        share_commission: shareCommission,

    }
}
