import { NextResponse } from 'next/server'
import React from 'react'
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer'
import { loadCommercialProperty } from '@/lib/commercial-property-server'
import { propertyPrice } from '@/lib/property-price'
import { preparePdfImages } from '@/lib/pdf-images-server'

export const dynamic = 'force-dynamic'

type RouteProps = {
  params: Promise<{ slug: string }>
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: 'contain',
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  headerLabel: {
    fontSize: 8,
    color: '#6B7280',
    marginBottom: 3,
  },
  title: {
    fontSize: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  image: {
    width: '100%',
    height: 220,
    objectFit: 'cover',
    marginBottom: 12,
    borderRadius: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  description: {
    lineHeight: 1.4,
  },
  operationBox: {
    flexDirection: 'row',
    alignItems: 'stretch',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 7,
    overflow: 'hidden',
  },
  operationLabel: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  operationSale: {
    backgroundColor: '#2563EB',
  },
  operationRent: {
    backgroundColor: '#059669',
  },
  operationOther: {
    backgroundColor: '#6B7280',
  },
  operationPrice: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: 'bold',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  galleryItem: {
    width: '48%',
    height: 145,
    objectFit: 'cover',
    marginBottom: 12,
    borderRadius: 6,
  },
  infoColumns: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoColumn: {
    width: '48%',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 2,
    marginBottom: 10,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 10,
  },
  publicLink: {
    marginTop: 20,
    fontSize: 9,
    color: '#2563EB',
    textDecoration: 'underline',
  },
  legalNote: {
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    fontSize: 8,
    lineHeight: 1.35,
    color: '#4B5563',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    fontSize: 7,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

function showValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return 'N/D'
  }

  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No'
  }

  return String(value)
}

function PropertyPdf({ property, imageUrls, formattedTotalPrice, propertyUrl }: {
  property: Record<string, unknown>
  imageUrls: string[]
  formattedTotalPrice: string | null
  propertyUrl: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>QRIH</Text>

          <View style={styles.headerText}>
            <Text style={styles.headerLabel}>FICHA DE PROPIEDAD</Text>
            <Text style={styles.title}>
              {showValue(property.title)}
            </Text>
          </View>
        </View>

        {imageUrls[0] ? (
          <Image src={imageUrls[0]} style={styles.image} />
        ) : null}

        <View style={styles.operationBox}>
          <Text
            style={[
              styles.operationLabel,
              String(property.operation || '').toLowerCase().includes('rent')
                ? styles.operationRent
                : String(property.operation || '').toLowerCase().includes('renta')
                  ? styles.operationRent
                  : String(property.operation || '').toLowerCase().includes('venta')
                    ? styles.operationSale
                    : styles.operationOther,
            ]}
          >
            {showValue(property.operation).toUpperCase()}
          </Text>

          <Text style={styles.operationPrice}>
            {formattedTotalPrice || showValue(property.price_display)}
          </Text>
        </View>

        <Text style={{ fontSize: 10, marginBottom: 10 }}>
          Precio anunciado: {propertyPrice(property)}
        </Text>

        <Text style={styles.sectionTitle}>Información de la propiedad</Text>
        <View style={styles.sectionDivider} />

        <View style={styles.infoColumns}>
          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Operación:</Text>
              <Text style={styles.value}>{showValue(property.operation)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Zona:</Text>
              <Text style={styles.value}>{showValue(property.zone)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Superficie total:</Text>
              <Text style={styles.value}>{showValue(property.total_area)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Superficie techada:</Text>
              <Text style={styles.value}>{showValue(property.covered_area)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Superficie exterior:</Text>
              <Text style={styles.value}>{showValue(property.exterior_area)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Altura máxima:</Text>
              <Text style={styles.value}>{showValue(property.max_height)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Oficinas:</Text>
              <Text style={styles.value}>{showValue(property.offices_area)}</Text>
            </View>
          </View>

          <View style={styles.infoColumn}>
            <View style={styles.row}>
              <Text style={styles.label}>Estacionamiento:</Text>
              <Text style={styles.value}>{showValue(property.parking)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Andenes:</Text>
              <Text style={styles.value}>{showValue(property.docks)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Precio negociable:</Text>
              <Text style={styles.value}>{showValue(property.negotiable)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>IVA:</Text>
              <Text style={styles.value}>{showValue(property.price_plus_vat)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Mantenimiento:</Text>
              <Text style={styles.value}>{showValue(property.price_plus_maintenance)}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.row}>
              <Text style={styles.label}>Comparte comisión:</Text>
              <Text style={styles.value}>{showValue(property.share_commission)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Ubicación</Text>
        <View style={styles.sectionDivider} />

        <View style={styles.row}>
          <Text style={styles.label}>Zona:</Text>
          <Text style={styles.value}>{showValue(property.zone)}</Text>
        </View>

        {property.location_visibility === 'address' ? (
          <View style={styles.row}>
            <Text style={styles.label}>Dirección:</Text>
            <Text style={styles.value}>{showValue(property.address)}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle} minPresenceAhead={60}>Descripción</Text>
        <View style={styles.sectionDivider} />

        <Text style={styles.description}>
          {showValue(property.description)}
        </Text>

        {imageUrls.length > 1 ? (
          <>
            <Text style={styles.sectionTitle} minPresenceAhead={150}>Galería</Text>

            <View style={styles.galleryGrid}>
              {imageUrls.slice(1).map((url, index) => (
                <Image
                  key={`${url}-${index}`}
                  src={url}
                  style={styles.galleryItem}
                />
              ))}
            </View>
          </>
        ) : null}

        <Link
          src={propertyUrl}
          style={styles.publicLink}
        >
          Ver esta propiedad en línea: {propertyUrl}
        </Link>

        <Text style={styles.legalNote}>
          Nota importante: Toda la información y medidas provistas son aproximadas y deberán ratificarse con la documentación pertinente y no comprometer contractualmente a nuestra empresa. Los gastos expresados refieran a la última información recabada y deberán confirmarse. Fotografías no vinculantes ni contractuales.
        </Text>

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  )
}

export async function GET(
  _request: Request,
  { params }: RouteProps,
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'El slug de la propiedad es obligatorio.' },
        { status: 400 },
      )
    }

    const commercial = await loadCommercialProperty(slug, 'pdf')
    if (!commercial) return NextResponse.json({ error: 'Propiedad no encontrada.' }, { status: 404 })
    const { property, images } = commercial
    const formattedTotalPrice = propertyPrice(property, true)
    const imageUrls = await preparePdfImages(images.map(image => image.url))

    const pdfBuffer = await renderToBuffer(
      <PropertyPdf
        property={property}
        imageUrls={imageUrls}
        formattedTotalPrice={formattedTotalPrice}
        propertyUrl={`${new URL(_request.url).origin}/bodegas/${slug}`}
      />,
    )

    const safeFilename =
      String(property.slug || 'bodega')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFilename}.pdf"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.warn('QRIH_PDF_GENERATION_FAILED')

    return NextResponse.json(
      { error: 'No fue posible generar el PDF.' },
      { status: 500 },
    )
  }
}
