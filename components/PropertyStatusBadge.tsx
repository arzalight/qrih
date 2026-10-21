const labels: Record<string, string> = {
  draft: 'Borrador', pending: 'En revisión', published: 'Publicada',
  paused: 'Pausada', rejected: 'Rechazada', expired: 'Expirada',
  pending_update: 'Actualización en revisión',
}

/** Display only; never grants permissions or changes a property's state. */
export function PropertyStatusBadge({ status }: { status: string | null }) {
  return <span className={`status ${status && labels[status] ? status : 'draft'}`}>
    {status ? labels[status] || status : 'Sin estado'}
  </span>
}
