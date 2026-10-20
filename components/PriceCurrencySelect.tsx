export function PriceCurrencySelect({ value = '' }: { value?: string | null }) {
  return <label>Moneda
    <select name="price_currency" required defaultValue={value || ''}>
      <option value="" disabled>Selecciona moneda</option>
      <option value="MXN">MXN — Peso mexicano</option>
      <option value="USD">USD — Dólar estadounidense</option>
    </select>
  </label>
}
