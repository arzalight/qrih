export type MatchingProperty = {
  operation?: string | null
  zone_general?: string | null
  zone?: string | null
  surface_m2?: number | null
  price_value?: number | null
  price_unit?: string | null
  price_currency?: string | null
}

export type MatchingDemand = {
  operation?: string | null
  zone_general?: string | null
  zone?: string | null
  area_min?: number | null
  area_max?: number | null
  budget_currency?: string | null
  budget_min?: number | null
  budget_max?: number | null
}

export type MatchingResult = {
  operation: number
  zoneGeneral: number
  zoneIndustrial: number
  surface: number
  budget: number
  total: number
}

export type RankedDemand<T extends MatchingDemand> = {
  demand: T
  result: MatchingResult
}

export type RankedProperty<T extends MatchingProperty> = {
  property: T
  result: MatchingResult
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function rangeScore(
  value: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
) {
  if (value == null) return 0

  if (min != null && value < min) {
    if (min === 0) return 0
    return Math.max(0, 1 - (min - value) / min)
  }

  if (max != null && value > max) {
    if (max === 0) return 0
    return Math.max(0, 1 - (value - max) / max)
  }

  return 1
}

function getComparablePrice(property: MatchingProperty) {
  if (property.price_value == null) return null

  const unit = normalize(property.price_unit)

  if (unit === 'm2' || unit === 'm²') {
    if (property.surface_m2 == null) return null
    return property.price_value * property.surface_m2
  }

  return property.price_value
}

export function calculateMatch(
  property: MatchingProperty,
  demand: MatchingDemand
): MatchingResult {
  const operation =
    normalize(property.operation) !== '' &&
    normalize(property.operation) === normalize(demand.operation)
      ? 1
      : 0

  const zoneGeneral =
    normalize(property.zone_general) !== '' &&
    normalize(property.zone_general) === normalize(demand.zone_general)
      ? 1
      : 0

  const zoneIndustrial =
    normalize(property.zone) !== '' &&
    normalize(property.zone) === normalize(demand.zone)
      ? 1
      : 0

  const surface = rangeScore(
    property.surface_m2,
    demand.area_min,
    demand.area_max
  )

  const comparablePrice = property.price_currency && ['MXN', 'USD'].includes(property.price_currency)
    && property.price_currency === demand.budget_currency ? getComparablePrice(property) : null

  const budget = rangeScore(
    comparablePrice,
    demand.budget_min,
    demand.budget_max
  )

  const total =
    operation * 30 +
    zoneGeneral * 20 +
    zoneIndustrial * 20 +
    surface * 15 +
    budget * 15

  return {
    operation,
    zoneGeneral,
    zoneIndustrial,
    surface,
    budget,
    total,
  }
}

export function rankDemandsForProperty<T extends MatchingDemand>(
  property: MatchingProperty,
  demands: T[]
): RankedDemand<T>[] {
  return demands
    .filter((demand) => isSurfaceInDemandRange(property, demand))
    .map((demand) => ({
      demand,
      result: calculateMatch(property, demand),
    }))
    .sort((a, b) => b.result.total - a.result.total)
}

export function rankPropertiesForDemand<T extends MatchingProperty>(
  demand: MatchingDemand,
  properties: T[]
): RankedProperty<T>[] {
  return properties
    .filter((property) => isSurfaceInDemandRange(property, demand))
    .map((property) => ({
      property,
      result: calculateMatch(property, demand),
    }))
    .sort((a, b) => b.result.total - a.result.total)
}

// A declared surface range is an eligibility constraint, not a scoring bonus.
// Leave the existing score intact for ordering eligible suggestions and SQL parity.
function isSurfaceInDemandRange(property: MatchingProperty, demand: MatchingDemand) {
  const { area_min: min, area_max: max } = demand
  if (min == null && max == null) return true
  if ((min != null && (!Number.isFinite(min) || min < 0))
    || (max != null && (!Number.isFinite(max) || max < 0))
    || (min != null && max != null && min > max)) return false
  const area = property.surface_m2
  if (area == null || !Number.isFinite(area) || area < 0) return false
  return (min == null || area >= min) && (max == null || area <= max)
}
