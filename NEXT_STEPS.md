# NEXT STEPS — QRO INDUSTRIAL HUB / QRIH

## Posterior a auditoría — corte 2026-10-04 (validación ampliada)

No agregar funcionalidades. Estado: **NO-GO externo**; las correcciones locales no equivalen a cierre en Supabase/Netlify.

Canal de entrega **verificado hasta AUD-024**: develop `5fad2925a39034a12aa15b779be5f23d408337b0`, Netlify `6ac31d76c0cc5c000829ea5b` READY/publicado. **AUD-025 requiere nueva entrega funcional a develop**, no un build sólo documental. 29 unit/30 SQL/lint/tipos/build PASS local; falta deployment exacto/UI Safari. Producción/main sólo después de GO explícito; sin migraciones automáticas/flags mutantes/planes pagados.

1. **AUD-025 y borrador privado en Safari:** subir la corrección a develop, verificar READY/commit exacto y humo no mutante. Antes de recargar, conservar datos del formulario fuera del navegador para no perderlos; recargar sólo después de confirmar nuevo deployment, seleccionar de nuevo dos JPG/PNG propias y Guardar borrador, no enviar a revisión. Diagnóstico anterior: tres fallos format, cero propiedades/galerías/procedencias/objetos de fotos; no borrar nada ni reintentar la versión antigua. Verificar Mis propiedades/portada/Editar/galería/recarga, luego agregados BD/Storage y privacidad antes de edición/siete fotos. Probar WebP nativo Chrome y negativos MIME/corrupción/límites sin nuevas cuentas. Auth normal/recuperación ya validados, preservar 3 cuentas/2 perfiles; no repetir alta por este incidente.
2. **Completar AUD-023 / aptitud de correo:** Gmail/587 activo; confirmación inicial y segunda alta con callback directo comprobadas, ahora 3 Auth confirmadas/2 perfiles propios. No equivale a fiabilidad/cuotas/tiempos/spam comprobados para piloto. Completar casos límite de sesión/token/redirect con ensayo acotado y consentimiento; no enlaces/códigos/contraseñas en chat ni reutilización de enlace consumido. Sin bucles/reducción de límites, auto-confirmación, dominio/plan pagado, quitar 2FA o añadir miembros como bypass. Preservar cuentas; todo $0, NO-GO se mantiene.
3. Continuar restantes de staging Free: ingesta HTTP/siete fotos/contactos/demanda/notificaciones/avatar/edición/borrado/carrera de versión/firma 300 s **validados en el ensayo anterior**. Faltan 600/900 s+renovación, red/cold-start controlado, UI/dispositivos reales y recuperación íntegra. No conectar previews al Supabase actual ni dejar pruebas mutantes activadas. Preservar las 3 cuentas y 2 perfiles actuales; suites mutantes previas admiten como máximo una cuenta: no ejecutarlas ni ampliar ese guard dentro de AUD-024. Cualquier nuevo ensayo requiere diseño de preservación/baseline y limpieza sólo de sus IDs sintéticos.
4. Conservar reconciliación/evidencia en `supabase/staging/`: baseline, 044–049 y AUD-019 comprobados. Probar backup/restauración íntegros de BD/Auth **y archivos Storage** por separado; recuperación de título/galería/bytes de fixture con hash no restaura todo el grafo ni demuestra operación de backup.
5. Preflights ya ejecutados en staging sólo lectura; AUD-021 alias SQL corregido y validado. Repetir antes/después del corte real con datos: convertibles/NULL/excepciones, ownership, duplicados, FKs/policies/grants/functions/triggers/helper. No forzar ni borrar datos para pasar.
6. Mantener secreto sólo en Netlify y variables públicas del staging. 044–049 ya aplicadas allí; no repetir ni aplicar en actual todavía. No pegar claves, firmas/cookies ni credenciales SMTP en chat/Git. Conservar compilador sin clave y detector activo.
7. Verificar Storage HTTP + URL pública/CDN histórico al corte del proyecto actual. Mantener buckets/rutas/WebP/máximo siete; no reabrir bucket público como rollback. Firma de cinco minutos probada, no revocación instantánea ni todas las firmas de 10/15 minutos.
8. Completar matriz real de UI pública/A/B/admin/suspensión. Navegador integrado a 375/1440 px es sólo responsive parcial; faltan Chrome/Safari/teléfono real, UI autenticada, fallos de red/doble submit y restauración. Repetir build/tipos/lint/audit/bundle/secrets en deployment exacto; no declarar GO por 42 PASS aislados.
9. Programar corte en actual con backup y ventana cerrada, humo integral en **deployment exacto**. Sólo sin crítico ni acceso indebido/corrupción/flujo principal roto, cerrar AUD-001/AUD-002 y autorizar GO explícito para piloto.

## Durante y después del Soft Launch

- Abrir con grupo pequeño y responsable de soporte/moderación.
- Vigilar códigos de error de Netlify/Supabase, altas, publicaciones, contactos, consumo de Storage y PDF; logs sin PII/firmas/secretos.
- Conciliar huérfanos privados por inventario y referencias. Cualquier eliminación requiere identificar objetos exactos y posibilidad de recuperación; no limpieza masiva automática.
- Revisar incidentes y corregir sólo seguridad, privacidad, integridad y bloqueadores demostrados. No nueva ronda de features/diseño.
- Revisar textos legales antes de lanzamiento público; no afirmar cumplimiento por esta auditoría.
- Mantener respaldos recuperables, documentación sincronizada y evidencias por ID.
- Deuda baja: tooling ESLint con soporte vigente, avisos de módulo de tests, respaldo/legado y logo local en PDF; resolver sin ampliar alcance ni retrasar por cosmética.

El plan histórico anterior se conserva en `docs/history/NEXT_STEPS_before_soft_launch_fixes.md` como registro; no dirige el trabajo vigente.
