'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { propertyPrice } from '@/lib/property-price'

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
        style={{
          width: '100%',
          overflowX: 'auto',
          border: '1px solid #e5e5e5',
          borderRadius: '12px',
          background: '#fff',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: '1000px',
            borderCollapse: 'collapse',
            fontSize: '14px',
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: '1px solid #dcdcdc',
                background: '#fafafa',
              }}
            >
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Propiedad
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Asesor
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Zona
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Operación
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Estado
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Precio
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>
                Superficie
              </th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>
                Acciones
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleProperties.map((property) => (
              <tr
                key={property.id}
                style={{
                  borderBottom: '1px solid #e5e5e5',
                }}
              >
                <td style={{ padding: '14px' }}>
                  <strong>{property.title}</strong>
                </td>

                <td style={{ padding: '14px', color: '#555' }}>
                  {property.profiles?.full_name ||
                    property.profiles?.company_name ||
                    'Sin asesor'}
                </td>

                <td style={{ padding: '14px', color: '#666' }}>
                  {property.zone_general || 'Zona no especificada'}
                  {property.zone ? ` · ${property.zone}` : ''}
                </td>

                <td style={{ padding: '14px' }}>
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

                <td style={{ padding: '14px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '5px 9px',
                      borderRadius: '999px',
                      background:
                        property.status === 'published'
                          ? '#e8f5e9'
                          : property.status === 'pending'
                            ? '#fff3e0'
                            : property.status === 'draft'
                              ? '#f5f5f5'
                              : property.status === 'rejected'
                                ? '#ffebee'
                                : property.status === 'pending_update'
                                  ? '#fff8e1'
                                  : property.status === 'paused'
                                    ? '#e3f2fd'
                                    : property.status === 'expired'
                                      ? '#f3e5f5'
                                      : '#f5f5f5',
                      color:
                        property.status === 'published'
                          ? '#2e7d32'
                          : property.status === 'pending'
                            ? '#ef6c00'
                            : property.status === 'draft'
                              ? '#666'
                              : property.status === 'rejected'
                                ? '#c62828'
                                : property.status === 'pending_update'
                                  ? '#f9a825'
                                  : property.status === 'paused'
                                    ? '#1565c0'
                                    : property.status === 'expired'
                                      ? '#7b1fa2'
                                      : '#555',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}
                  >
                    {property.status}
                  </span>
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
                    color: '#555',
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
                        background: '#111',
                        color: '#fff',
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
                          background: '#fff',
                          color: '#111',
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
            color: '#666',
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
                background: '#fff',
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
                background: '#fff',
                color: currentPage === 1 ? '#aaa' : '#222',
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
                    color: '#888',
                    fontSize: '13px',
                  }}
                >
                  …
                </span>
              ) : (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  style={{
                    minWidth: '34px',
                    padding: '8px 9px',
                    border: '1px solid #d5d5d5',
                    borderRadius: '8px',
                    background:
                      currentPage === page ? '#111' : '#fff',
                    color:
                      currentPage === page ? '#fff' : '#222',
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
                background: '#fff',
                color:
                  currentPage === totalPages ? '#aaa' : '#222',
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
