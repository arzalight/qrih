# NEXT STEPS — QRO INDUSTRIAL HUB / QRIH

## Posterior a auditoría — corte 2026-10-04 (validación ampliada)

No agregar funcionalidades. Estado: **NO-GO externo**; las correcciones locales no equivalen a cierre en Supabase/Netlify.

Canal de entrega **verificado**: Git local → GitHub privado `arzalight/qrih` → `main`/`develop` → staging sólo `develop`, sin previews, logs privados. Usuario subió `478fda1`; deployment automático `6ac307ade99ce9000825a574` READY/publicado con commit exacto, 15 HTTP sin sesión PASS. Free/recargas/overages off verificados nuevamente. Corrección y pruebas entregadas; sólo este registro documental posterior queda local. Producción/main sólo después de GO explícito; sin migraciones automáticas ni flags mutantes persistentes.

1. **Entregar y validar AUD-024 antes de publicar:** corrección local autorizada implementada; 26 unit/30 SQL aisladas, lint/tipos/build y humo local PASS. Subir `develop`, comprobar nuevo commit exacto/READY y humo remoto. Después usuario inicia sesión con su cuenta ya confirmada: verificar un perfil propio con defaults seguros, Perfil/Publicar y logout/login sin sobrescribir rol/plan/suspensión. Staging sólo consultado: sigue 2 Auth confirmadas/0 perfiles/0 propiedades y código anterior. No insertar perfiles manualmente. Diagnóstico de callback sólo etapas y alta normal acotada pendientes; informe `supabase/staging/auth-profile-verification-2026-10-04.md`.
2. **Completar AUD-023 / correo externo:** Gmail/587 activo; el usuario recibió y abrió un correo y ahora hay 2 cuentas confirmadas. Esto es entrega parcial real, no aprobación de fiabilidad/cuotas del proveedor personal. Después de corregir AUD-024, ensayo acotado desde registro → correo → callback → perfil propio → login/logout, con tiempos/spam y casos de token/redirect inválidos. No reutilizar enlace consumido ni repetir envíos/reducir límites; preservar cuentas existentes. No pegar enlaces/códigos/contraseñas, comprar dominio/plan, quitar 2FA/confirmación ni añadir miembros al equipo como bypass. Todo $0; NO-GO se mantiene.
3. Continuar restantes de staging Free: ingesta HTTP/siete fotos/contactos/demanda/notificaciones/avatar/edición/borrado/carrera de versión/firma 300 s **validados en el ensayo anterior**. Faltan 600/900 s+renovación, red/cold-start controlado, UI/dispositivos reales y recuperación íntegra. No conectar previews al Supabase actual ni dejar pruebas mutantes activadas. Preservar ambas cuentas; suites mutantes previas admiten como máximo una cuenta: no ejecutarlas ni ampliar ese guard dentro de AUD-024. Cualquier nuevo ensayo requiere diseño de preservación/baseline y limpieza sólo de sus IDs sintéticos.
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
