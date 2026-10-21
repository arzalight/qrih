"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase";
import { optimizeImage } from "@/lib/image-optimizer";

type ProfileAvatarFormProps = {
  profileId: string;
  avatarUrl: string | null;
};

export function ProfileAvatarForm({
  profileId,
  avatarUrl,
}: ProfileAvatarFormProps) {
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSaving(true);
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("Selecciona una imagen válida.");
      setSaving(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("La imagen no puede superar 5 MB.");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setMessage("No se pudo conectar con Supabase.");
      setSaving(false);
      return;
    }

    const form = new FormData();
    form.set("kind", "avatar");
    let publicUrl: string;
    try {
      const optimized = await optimizeImage(file);
      URL.revokeObjectURL(optimized.previewUrl);
      form.set("image", optimized.file);
      const response = await fetch("/api/imagenes", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok || !result.publicUrl) throw new Error("upload");
      publicUrl = result.publicUrl;
    } catch {
      setMessage("No se pudo guardar la foto. Revisa formato, tamaño y límite de cargas.");
      setSaving(false);
      return;
    }

    setCurrentAvatar(publicUrl);
    setMessage("Foto actualizada.");
    setSaving(false);
    event.target.value = "";
  }

  return (
    <div>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        {currentAvatar ? (
          <img
            src={currentAvatar}
            alt="Foto de perfil"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              color: "var(--muted)",
              fontSize: 32,
              fontWeight: 700,
            }}
          >
            ?
          </span>
        )}
      </div>

      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "10px 16px",
          borderRadius: 9,
          background: "var(--ink)",
          color: "var(--surface)",
          fontWeight: 600,
          cursor: saving ? "wait" : "pointer",
        }}
      >
        {saving ? "Subiendo..." : "Cambiar foto"}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={saving}
          style={{ display: "none" }}
        />
      </label>

      <p
        style={{
          margin: "10px 0 0",
          color: "var(--muted)",
          fontSize: 13,
        }}
      >
        JPG, PNG o WebP. Máximo 5 MB.
      </p>

      {message && (
        <p
          style={{
            margin: "10px 0 0",
            color: "var(--ink)",
            fontSize: 14,
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
