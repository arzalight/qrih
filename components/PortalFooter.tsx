'use client'

import { usePathname } from 'next/navigation'
export function PortalFooter({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/ficha/') ? null : children
}
