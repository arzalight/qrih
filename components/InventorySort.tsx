import { carriedParams, INVENTORY_SORTS } from '@/lib/property-display'

// Plain GET form (works without JavaScript). Existing filters travel as hidden fields, so
// sorting never resets them. An explicit button avoids re-querying on every arrow key.
export function InventorySort({
  value,
  query,
}: {
  value: string
  query: Record<string, string | undefined>
}) {
  return (
    <form method="get" action="/inventario" className="inventory-sort">
      {carriedParams(query, ['sort']).map(([name, fieldValue]) => (
        <input key={name} type="hidden" name={name} value={fieldValue} />
      ))}
      <label htmlFor="inventory-sort">Ordenar por</label>
      <select id="inventory-sort" name="sort" defaultValue={value}>
        {INVENTORY_SORTS.map((sort) => (
          <option key={sort.value} value={sort.value}>
            {sort.label}
          </option>
        ))}
      </select>
      <button type="submit" className="button button--secondary">Ordenar</button>
    </form>
  )
}
