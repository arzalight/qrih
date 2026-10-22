'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'
import { PropertyStatusBadge } from '@/components/PropertyStatusBadge'
import { AdminPropertyThumbnail } from '@/components/AdminPropertyThumbnail'

type AdminProperty = {
  id: string
  title: string | null
  operation: string | null
  status: string | null
  zone_general: string | null
  zone: string | null
  price_display: string | null
  price_value?: number | null
  price_currency?: string | null
  price_unit?: string | null
  total_area: number | null
  slug: string | null
  coverUrl?: string | null
  profiles?: {
    full_name?: string | null
    company_name?: string | null
  } | null
}

type AdminPropertiesTableProps = {
  properties: AdminProperty[]
}

const PAGE_SIZE_OPTIONS = [20, 35, 50, 60, 100]

export function AdminPropertiesTable({
  properties,
}: AdminPropertiesTableProps) {
  const [pageSize, setPageSize] = useState(35)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(properties.length / pageSize))

  useEffect(() => {
    setCurrentPage(1)
  }, [properties, pageSize])

  const visibleProperties = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return properties.slice(start, start + pageSize)
  }, [properties, currentPage, pageSize])

  const startItem =
    properties.length === 0 ? 0 : (currentPage - 1) * pageSize + 1

  const endItem = Math.min(currentPage * pageSize, properties.length)

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from(
        { length: totalPages },
        (_, index) => index + 1
      )
    }

    const pages: (number | 'ellipsis')[] = [1]

    if (currentPage > 4) {
      pages.push('ellipsis')
    }

    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    for (let page = startPage; page <= endPage; page += 1) {
      pages.push(page)
    }

    if (currentPage < totalPages - 3) {
      pages.push('ellipsis')
    }

    pages.push(totalPages)

    return pages
  }, [currentPage, totalPages])

  return (
    <>
      <div
        className="ui-table-scroll"
        role="region"
        aria-label="Tabla de propiedades; desplázate horizontalmente para ver todas las columnas"
        tabIndex={0}
        style={{
          width: '100%',
          overflowX: 'auto',
          border: "1px solid var(--line)",
          borderRadius: '12px',
          background: "var(--surface)",
        }}
      >
        <table
          className="admin-properties-table"
          style={{
            width: '100%',
            minWidth: '1000px',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <caption className="sr-only">Propiedades y acciones administrativas</caption>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #dcdcdc',
                background: "var(--surface-subtle)",
              }}
            >
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Propiedad
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Asesor
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Zona
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Operación
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Estado
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Precio
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'left' }}>
                Superficie
              </th>
              <th scope="col" style={{ padding: '12px 14px', textAlign: 'right' }}>
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleProperties.map((property) => (
              <tr
                key={property.id}
                style={{
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <td style={{ padding: '14px' }}>
                  <div className="admin-property-identity">
                    <AdminPropertyThumbnail key={property.coverUrl || 'empty'} url={property.coverUrl} />
                    <strong>{property.title}</strong>
                  </div>
                </td>

                <td style={{ padding: '14px', color: "var(--muted)" }}>
                  {property.profiles?.full_name ||
                    property.profiles?.company_name ||
                    'Sin asesor'}
                </td>

                <td style={{ padding: '14px', color: "var(--muted)" }}>
                  {property.zone_general || 'Zona no especificada'}
                  {property.zone ? ` · ${property.zone}` : ''}
                </td>

                <td className="admin-properties-table__tag" style={{ padding: '14px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 9px',
                      borderRadius: '999px',
                      background:
                        property.operation === 'Renta'
                          ? '#eef7f0'
                          : '#fff3e0',
                      color:
                        property.operation === 'Renta'
                          ? '#27613a'
                          : '#8a4b08',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {property.operation}
                  </span>
                </td>

                <td className="admin-properties-table__tag" style={{ padding: '14px' }}>
                  <PropertyStatusBadge status={property.status} />
                </td>

                <td
                  style={{
                    padding: '14px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {propertyPrice(property)}
                </td>

                <td
                  style={{
                    padding: '14px',
                    color: "var(--muted)",
                    whiteSpace: 'nowrap',
                  }}
                >
                  {property.total_area || 'N/D'} m²
                </td>

                <td
                  style={{
                    padding: '14px',
                    textAlign: 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Link
                      href={`/admin/${property.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: '7px',
                        background: "var(--primary)",
                        color: "var(--surface)",
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      Ver información
                    </Link>

                    {property.status === 'published' && (
                      <a
                        href={`/bodegas/${property.slug?.trim()}`}
                        style={{
                          display: 'inline-block',
                          padding: '8px 12px',
                          borderRadius: '7px',
                          border: '1px solid #111',
                          background: "var(--surface)",
                          color: "var(--primary)",
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Ver publicada
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginTop: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: "var(--muted)",
            fontSize: '13px',
          }}
        >
          <span>
            Mostrando {startItem}–{endItem} de {properties.length}
          </span>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
            }}
          >
            <span>Mostrar:</span>

            <select
              value={pageSize}
              onChange={(event) =>
                setPageSize(Number(event.target.value))
              }
              style={{
                padding: '7px 10px',
                border: '1px solid #d5d5d5',
                borderRadius: '8px',
                background: "var(--surface)",
                fontSize: '13px',
              }}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage === 1}
              style={{
                padding: '8px 11px',
                border: '1px solid #d5d5d5',
                borderRadius: '8px',
                background: "var(--surface)",
                color: currentPage === 1 ? '#aaa' : "var(--ink)",
                cursor: currentPage === 1 ? 'default' : 'pointer',
                fontSize: '13px',
              }}
            >
              ← Anterior
            </button>

            {pageNumbers.map((page, index) =>
              page === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  style={{
                    minWidth: '34px',
                    textAlign: 'center',
                    color: "var(--muted)",
                    fontSize: '13px',
                  }}
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  aria-label={`Página ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: '44px',
                    padding: '8px 9px',
                    border: '1px solid #d5d5d5',
                    borderRadius: '8px',
                    background:
                      currentPage === page ? "var(--primary)" : "var(--surface)",
                    color:
                      currentPage === page ? "var(--surface)" : "var(--ink)",
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: currentPage === page ? 700 : 500,
                  }}
                >
                  {page}
                </button>
              )
            )}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 11px',
                border: '1px solid #d5d5d5',
                borderRadius: '8px',
                background: "var(--surface)",
                color:
                  currentPage === totalPages ? '#aaa' : "var(--ink)",
                cursor:
                  currentPage === totalPages
                    ? 'default'
                    : 'pointer',
                fontSize: '13px',
              }}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </>
  )
}
