// A presentation is not a private capability. Non-published properties have no link.
export function presentationPath(slug: string) {
  return `/ficha/${encodeURIComponent(slug)}`
}
export function canShareProperty(status: string, disabled: boolean) {
  return status === 'published' && !disabled
}
export function presentationLinks(origin: string, slug: string, title: string) {
  const url = new URL(presentationPath(slug), origin).href
  return { url, whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}` }
}
