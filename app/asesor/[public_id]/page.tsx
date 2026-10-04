import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { createPublicServerSupabaseClient } from "@/lib/supabase-public-server";
import { createSignedPropertyImageUrlMap, PROPERTY_IMAGE_TTL_SECONDS } from '@/lib/property-image-urls';
import { PropertyCard } from "@/components/PropertyCard";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export const dynamic = 'force-dynamic';

type Property = {
  id: string;
  slug: string;
  title: string;
  operation: string;
  zone: string;
  price_display: string;
  total_area: number | null;
  covered_area: number | null;
  max_height: string | null;
  share_commission: boolean | null;
  main_image: string | null;
  main_image_path: string | null;
};

type Catalog = {
  public_id: number;
  name: string;
  company: string | null;
  website: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  phone: string | null;
  whatsapp: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  properties: Property[];
};

type PageProps = {
  params: Promise<{
    public_id: string;
  }>;
};

export default async function AdvisorCatalogPage({ params }: PageProps) {
  const { public_id } = await params;

  const advisorId = Number(public_id);

  if (!advisorId) {
    notFound();
  }

  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    notFound();
  }

  const { data, error } = await supabase.rpc("get_advisor_catalog", {
    advisor_public_id: advisorId,
  });

  if (error || !data) {
    console.warn('QRIH_APP_ASESOR_PUBLIC_ID_PAGE_66_FAILED');
    notFound();
  }

  const catalog = data as Catalog;

  if (!catalog) {
    notFound();
  }
  const urls = await createSignedPropertyImageUrlMap(supabase,
    catalog.properties.map((property) => property.main_image_path), PROPERTY_IMAGE_TTL_SECONDS.public);
  catalog.properties = catalog.properties.map((property) => ({
    ...property, main_image: urls.get(property.main_image_path || '') || null,
  }));

  const whatsappDigits = catalog.whatsapp?.replace(/\D/g, "");
  const whatsappUrl =
    whatsappDigits && whatsappDigits.length === 10
      ? `https://wa.me/52${whatsappDigits}`
      : null;

  return (
    <>
      <Header />

      <main>
        <div style={{ marginBottom: 24 }}>
          <a href="/inventario">← Volver al inventario</a>
        </div>

        <section className="title">
          <div className="advisor-profile-header">
            <div className="advisor-profile-avatar">
              {catalog.avatar_url ? (
                <img
                  src={catalog.avatar_url}
                  alt={`Foto de ${catalog.name}`}
                />
              ) : (
                <span>
                  {catalog.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase())
                    .join("")}
                </span>
              )}
            </div>

            <div className="advisor-profile-info">
              <small>ASESOR INMOBILIARIO</small>

              <h1
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>{catalog.name}</span>
                {catalog.is_verified && <VerifiedBadge />}
              </h1>

              {catalog.company && <p>{catalog.company}</p>}
            </div>
          </div>

          <div className="advisor-contact-actions">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="advisor-contact-primary"
              >
                💬 WhatsApp
              </a>
            )}

            {catalog.phone && (
              <a
                href={`tel:${catalog.phone}`}
                className="advisor-contact-secondary"
              >
                📞 Llamar
              </a>
            )}

            {catalog.website && (
              <a
                href={catalog.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                🌐 Sitio web
              </a>
            )}

            {catalog.instagram_url && (
              <a
                href={catalog.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="advisor-contact-social"
              >
                Instagram
              </a>
            )}

            {catalog.facebook_url && (
              <a
                href={catalog.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="advisor-contact-social"
              >
                Facebook
              </a>
            )}

            {catalog.linkedin_url && (
              <a
                href={catalog.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="advisor-contact-social"
              >
                LinkedIn
              </a>
            )}
          </div>
        </section>

        <div className="head">
          <div>
            <h2>Propiedades disponibles</h2>
          </div>

          <span>{catalog.properties.length} propiedades</span>
        </div>

        {catalog.properties.length > 0 ? (
          <div className="cards">
            {catalog.properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p>Este asesor no tiene propiedades publicadas actualmente.</p>
        )}
      </main>
    </>
  );
}
