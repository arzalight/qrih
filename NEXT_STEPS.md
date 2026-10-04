# NEXT STEPS — QRO INDUSTRIAL HUB / QRIH

## Posterior a auditoría — corte 2026-10-03

No agregar funcionalidades. Estado: **NO-GO externo**; las correcciones locales no equivalen a cierre en Supabase/Netlify.

Control de entrega: finalizar Git local → `arzalight/qrih` privado → `main`/`develop` → staging ligado sólo a `develop`. Revisión: `docs/PRE_GITHUB_REVIEW.md`; escanear índice antes de publicar. Producción no se conecta a `main` hasta GO explícito. Sin migraciones automáticas desde deploy ni flags de pruebas mutantes persistentes.

1. Completar los casos restantes de staging Free: **24 comprobaciones autenticadas y 15 sin sesión ya pasan**, incluidos siete WebP, aislamiento, estados/suspensión y PDF real. Pendientes correo/callback, contactos/demanda/notificaciones, avatar, TTL y cold-start/concurrencia/UI. No conectar previews al Supabase actual ni dejar pruebas mutantes activadas en futuros despliegues.
2. Conservar la reconciliación/evidencia en `supabase/staging/`: baseline de 13 tablas, 044–049 y cierre SQL de AUD-019 ya comprobados en staging. Comprobar respaldos y restauración de BD **y archivos Storage** por separado; el baseline de estructura no es un backup de datos.
3. Ejecutar `supabase/checks/soft_launch_preflight.sql` y `aud002_preflight.sql` en staging. Revisar convertibles/NULL/excepciones, ownership, duplicados, FKs/policies/grants/functions/triggers y helper de operaciones. No forzar ni borrar registros de prueba para pasar la validación.
4. Mantener credencial protegida exclusivamente en Netlify y variables públicas del mismo staging, ya configuradas. 044–049 aplicadas allí; no repetirlas ni aplicar al proyecto actual todavía. No pegar secretos en chat ni escribir valores en documentos/commit. Conservar el compilador sin clave privada y el escaneo de secretos activo.
5. Probar Storage HTTP del corte compatible ya publicado. property-images privado (WebP, 20 MiB) y profile-images público según diseño existente (WebP, 5 MiB) creados **por panel/API**; conservar carpeta por usuario y máximo siete. Verificar acceso directo y URL pública/CDN en el corte del proyecto actual. No reabrir bucket público como rollback.
6. Validar email/confirmación/login: Site URL y único callback exacto ya configurados en staging HTTPS. Completar matriz de `QRIH_AUDIT.md` con público, A, B, admin y suspensión; ataques directos, firma/TTL, upload, edición, moderación, contactos, notificaciones, borrado y PDF con siete fotos. No usar auto-confirmación de cuentas sintéticas como evidencia de entrega/confirmación de correo real.
7. Probar móvil real/escritorio Chrome/Safari, fallos de red/doble submit y restauración. Repetir build/tipos/lint/audit; verificar bundle/secrets e historial Git antes de publicar. Registrar evidencia, no marcar VALIDADO por el build.
8. Programar corte equivalente en real con backup y ventana cerrada; humo integral en **deployment exacto**. Sólo si no queda crítico ni riesgo de acceso indebido, corrupción o flujo principal roto, cerrar AUD-001/AUD-002 y autorizar GO para piloto.

## Durante y después del Soft Launch

- Abrir con grupo pequeño y responsable de soporte/moderación.
- Vigilar códigos de error de Netlify/Supabase, altas, publicaciones, contactos, consumo de Storage y PDF; logs sin PII/firmas/secretos.
- Conciliar huérfanos privados por inventario y referencias. Cualquier eliminación requiere identificar objetos exactos y posibilidad de recuperación; no limpieza masiva automática.
- Revisar incidentes y corregir sólo seguridad, privacidad, integridad y bloqueadores demostrados. No nueva ronda de features/diseño.
- Revisar textos legales antes de lanzamiento público; no afirmar cumplimiento por esta auditoría.
- Mantener respaldos recuperables, documentación sincronizada y evidencias por ID.
- Deuda baja: tooling ESLint con soporte vigente, avisos de módulo de tests, respaldo/legado y logo local en PDF; resolver sin ampliar alcance ni retrasar por cosmética.

El plan histórico anterior se conserva en `docs/history/NEXT_STEPS_before_soft_launch_fixes.md` como registro; no dirige el trabajo vigente.
