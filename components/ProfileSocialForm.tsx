"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

type ProfileSocialFormProps = {
  profileId: string;
  whatsapp: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
};

export function ProfileSocialForm({
  profileId,
  whatsapp,
  instagramUrl,
  facebookUrl,
  linkedinUrl,
}: ProfileSocialFormProps) {
  const [form, setForm] = useState({
    whatsapp: whatsapp ?? "",
    instagram_url: instagramUrl ?? "",
    facebook_url: facebookUrl ?? "",
    linkedin_url: linkedinUrl ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();

    if (!supabase) {
      setMessage("No se pudo conectar con Supabase.");
      setSaving(false);
      return;
    }

    const normalizedWhatsapp = form.whatsapp
      .replace(/\D/g, "")
      .replace(/^52/, "");

    if (normalizedWhatsapp && normalizedWhatsapp.length !== 10) {
      setMessage("WhatsApp debe tener 10 dígitos.");
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        whatsapp: normalizedWhatsapp || null,
        instagram_url: form.instagram_url.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
      })
      .eq("id", profileId);

    if (error) {
      console.warn('QRIH_COMPONENTS_PROFILESOCIALFORM_65_FAILED');
      setMessage("No se pudieron guardar los cambios.");
      setSaving(false);
      return;
    }

    setForm((current) => ({
      ...current,
      whatsapp: normalizedWhatsapp,
    }));

    setMessage("Cambios guardados.");
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        WhatsApp
        <input
          type="tel"
          value={form.whatsapp}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              whatsapp: event.target.value,
            }))
          }
          placeholder="4421234567"
        />
      </label>

      <label>
        Instagram
        <input
          type="url"
          value={form.instagram_url}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              instagram_url: event.target.value,
            }))
          }
          placeholder="https://instagram.com/usuario"
        />
      </label>

      <label>
        Facebook
        <input
          type="url"
          value={form.facebook_url}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              facebook_url: event.target.value,
            }))
          }
          placeholder="https://facebook.com/usuario"
        />
      </label>

      <label>
        LinkedIn
        <input
          type="url"
          value={form.linkedin_url}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              linkedin_url: event.target.value,
            }))
          }
          placeholder="https://linkedin.com/in/usuario"
        />
      </label>

      <button type="submit" disabled={saving}>
        {saving ? "Guardando..." : "Guardar redes sociales"}
      </button>

      {message && <p>{message}</p>}
    </form>
  );
}
