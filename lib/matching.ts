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

// Detail discovery only. Demand matching's declared area bounds remain mandatory.
export function similarPropertyRange(property: MatchingProperty) {
  const area = property.surface_m2
  if (area == null || !Number.isFinite(area) || area <= 0
    || !normalize(property.operation) || !normalize(property.zone_general)) return null
  return { area_min: area * 0.5, area_max: area * 2 }
}

type SimilarCandidate = MatchingProperty & {
  id: string
  status?: string | null
  covered_area?: number | null
  max_height?: string | null
  docks?: number | null
}

export function rankSimilarProperties<T extends SimilarCandidate>(
  property: MatchingProperty & { id: string }, candidates: T[],
): RankedProperty<T>[] {
  const range = similarPropertyRange(property)
  if (!range) return []
  const source = property as SimilarCandidate
  const seen = new Set<string>([property.id])
  const ranked = candidates.filter(candidate => {
    if (seen.has(candidate.id) || (candidate.status != null && candidate.status !== 'published')) return false
    if (normalize(candidate.operation) !== normalize(property.operation)
      || normalize(candidate.zone_general) !== normalize(property.zone_general)
      || !isSurfaceInDemandRange(candidate, range)) return false
    seen.add(candidate.id)
    return true
  }).map(candidate => {
    const ratio = candidate.surface_m2! / property.surface_m2!
    const strict = ratio >= 0.75 && ratio <= 1.25
    const medium = ratio >= 0.5 && ratio <= 1.5
    const sameZone = normalize(property.zone) !== '' && normalize(candidate.zone) === normalize(property.zone)
    const tier = strict ? (sameZone ? 0 : 1) : medium ? (sameZone ? 2 : 3) : (sameZone ? 4 : 5)
    // Optional industrial features only break ties; unknown values never earn points.
    const features = (['covered_area', 'docks', 'max_height'] as const).reduce((score, field) => {
      const a = Number(source[field]), b = Number(candidate[field])
      return score + (a > 0 && b > 0 && Number.isFinite(a) && Number.isFinite(b) ? Math.min(a, b) / Math.max(a, b) : 0)
    }, 0)
    const result = calculateMatch(candidate, { ...range, operation: property.operation, zone_general: property.zone_general, zone: property.zone })
    return { property: candidate, result, tier, distance: Math.abs(Math.log(ratio)), features }
  })
  return ranked.sort((a, b) => a.tier - b.tier || a.distance - b.distance || b.features - a.features
    || b.result.total - a.result.total || a.property.id.localeCompare(b.property.id))
    .slice(0, 6).map(({ property: candidate, result }) => ({ property: candidate, result }))
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
