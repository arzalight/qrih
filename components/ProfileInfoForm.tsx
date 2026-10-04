"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase";

type ProfileInfoFormProps = {
  profileId: string;
  email: string;
  fullName: string;
  phone: string | null;
  companyName: string | null;
  website: string | null;
  identityChangeLockedUntil: string | null;
};

export function ProfileInfoForm({
  profileId,
  email,
  fullName,
  phone,
  companyName,
  website,
  identityChangeLockedUntil,
}: ProfileInfoFormProps) {
  const [form, setForm] = useState({
    full_name: fullName,
    phone: phone ?? "",
    company_name: companyName ?? "",
    website: website ?? "",
  });

  const [lockedUntil, setLockedUntil] = useState(
    identityChangeLockedUntil
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const identityLocked =
    !!lockedUntil && new Date(lockedUntil).getTime() > Date.now();

  const formatLockedUntil = () => {
    if (!lockedUntil) return "";

    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "long",
    }).format(new Date(lockedUntil));
  };

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

    const normalizedName = form.full_name.trim();
    const normalizedCompany = form.company_name.trim();
    const normalizedPhone = form.phone.trim();
    const normalizedWebsite = form.website.trim();

    if (!normalizedName) {
      setMessage("El nombre es obligatorio.");
      setSaving(false);
      return;
    }

    const identityChanged =
      normalizedName !== fullName.trim() ||
      normalizedCompany !== (companyName ?? "").trim();

    if (identityChanged && identityLocked) {
      setMessage(
        `El nombre y la empresa están bloqueados hasta ${formatLockedUntil()}.`
      );
      setSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: normalizedName,
        phone: normalizedPhone || null,
        company_name: normalizedCompany || null,
        website: normalizedWebsite || null,
      })
      .eq("id", profileId)
      .select(
        "full_name, phone, company_name, website, identity_change_locked_until"
      )
      .single();

    if (error) {
      console.warn('QRIH_COMPONENTS_PROFILEINFOFORM_100_FAILED');

      if (error.message.includes("bloqueados hasta")) {
        setMessage(error.message);
      } else {
        setMessage("No se pudieron guardar los cambios.");
      }

      setSaving(false);
      return;
    }

    setForm({
      full_name: data.full_name,
      phone: data.phone ?? "",
      company_name: data.company_name ?? "",
      website: data.website ?? "",
    });

    setLockedUntil(data.identity_change_locked_until);
    setMessage("Cambios guardados.");
    setSaving(false);
  }

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "10px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 9,
    fontSize: 14,
    color: "#111827",
    background: "#fff",
  };

  const labelStyle = {
    display: "grid",
    gap: 7,
  };

  const labelTextStyle = {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: 600,
  };

  return (
    <form onSubmit={handleSubmit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 16,
        }}
      >
        <label style={labelStyle}>
          <span style={labelTextStyle}>Nombre</span>
          <input
            type="text"
            value={form.full_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                full_name: event.target.value,
              }))
            }
            disabled={identityLocked}
            style={{
              ...inputStyle,
              background: identityLocked ? "#f3f4f6" : "#fff",
            }}
          />
        </label>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Correo electrónico</span>
          <input
            type="email"
            value={email}
            readOnly
            style={{
              ...inputStyle,
              background: "#f3f4f6",
              color: "#6b7280",
            }}
          />
        </label>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Teléfono</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                phone: event.target.value,
              }))
            }
            placeholder="4421234567"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          <span style={labelTextStyle}>Empresa / inmobiliaria</span>
          <input
            type="text"
            value={form.company_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                company_name: event.target.value,
              }))
            }
            disabled={identityLocked}
            style={{
              ...inputStyle,
              background: identityLocked ? "#f3f4f6" : "#fff",
            }}
          />
        </label>

        <label
          style={{
            ...labelStyle,
            gridColumn: "1 / -1",
          }}
        >
          <span style={labelTextStyle}>Sitio web</span>
          <input
            type="url"
            value={form.website}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                website: event.target.value,
              }))
            }
            placeholder="https://tusitio.com"
            style={inputStyle}
          />
        </label>
      </div>

      {identityLocked && (
        <p
          style={{
            margin: "16px 0 0",
            padding: 12,
            borderRadius: 9,
            background: "#f3f4f6",
            color: "#4b5563",
            fontSize: 13,
          }}
        >
          El nombre y la empresa se pueden volver a cambiar a partir del{" "}
          <strong>{formatLockedUntil()}</strong>.
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginTop: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          type="submit"
          disabled={saving}
          style={{
            border: 0,
            borderRadius: 9,
            padding: "10px 16px",
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>

        {message && (
          <span
            style={{
              fontSize: 14,
              color: "#374151",
            }}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
