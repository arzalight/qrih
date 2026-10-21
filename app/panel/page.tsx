import { redirect } from 'next/navigation'

// Preserve old bookmarks without presenting placeholder statistics as live data.
export default function Panel() {
  redirect('/mis-propiedades')
}
