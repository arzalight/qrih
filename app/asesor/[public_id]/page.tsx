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

      <section className="title advisor-banner">
        <div className="advisor-banner__inner">
          <a href="/inventario" className="advisor-banner__back">← Volver al inventario</a>

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
              <h1 className="advisor-profile-name">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            )}

            {catalog.phone && (
              <a
                href={`tel:${catalog.phone}`}
                className="advisor-contact-secondary"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
                </svg>
                <span>Llamar</span>
              </a>
            )}

            {catalog.website && (
              <a
                href={catalog.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
                </svg>
                <span>Sitio web</span>
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
        </div>
      </section>

      <main className="advisor-page">
        <div className="head advisor-page__head">
          <h2>Propiedades disponibles</h2>
          <span className="advisor-page__count">
            {catalog.properties.length} {catalog.properties.length === 1 ? 'propiedad' : 'propiedades'}
          </span>
        </div>

        {catalog.properties.length > 0 ? (
          <div className="cards">
            {catalog.properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <p className="ui-empty">Este asesor no tiene propiedades publicadas actualmente.</p>
        )}
      </main>
    </>
  );
}
