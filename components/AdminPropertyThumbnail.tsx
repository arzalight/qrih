'use client'

import { useState } from 'react'

export function AdminPropertyThumbnail({ url }: { url?: string | null }) {
  const [failed, setFailed] = useState(false)
  return <span className="admin-property-thumbnail">
    {url && !failed
      ? <img src={url} alt="" width={56} height={56} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      : <span aria-label="Sin fotografía" role="img">—</span>}
  </span>
}
