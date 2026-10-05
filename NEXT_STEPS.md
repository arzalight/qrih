# NEXT STEPS — QRO INDUSTRIAL HUB / QRIH

## Posterior a auditoría — corte 2026-10-04 (validación ampliada)

No agregar funcionalidades. Estado: **NO-GO externo**; las correcciones locales no equivalen a cierre en Supabase/Netlify.

Canal de entrega **configurado**: Git local → GitHub privado `arzalight/qrih` → `main`/`develop` → staging sólo `develop`, sin previews, logs privados. Último remoto verificado `4efa7cb`; corrección funcional local `648da29`, validada HTTP en ensayo `6ac302592726cfff62a322e6`; normal ZIP `6ac3045028604f2725058d08` READY. Subir commits locales tras escanear índice y verificar deployment Git exacto. No restaurar Git antiguo sobre la corrección. Producción/main sólo después de GO explícito; sin migraciones automáticas ni flags mutantes persistentes.

1. **Entregar corte validado a Git y completar UI:** AUD-022 corregido/validado HTTP en staging: 4/4 uploads + 24 imágenes + 42 flujos PASS, cuenta previa intacta y fixtures retirados; 17 unit/29 SQL. Subir los commits a develop desde terminal del usuario y verificar build/humo del commit exacto. No repetir diagnóstico RLS/bucket para el 400 Origin ya resuelto. Falta formulario autenticado real de publicación/edición tras registro/correo/callback/perfil. Informe: `supabase/staging/upload-verification-2026-10-04.md`.
2. **AUD-023 / correo externo:** usuario tiene Resend pero no dominio. SMTP staging desactivado; no comprar dominio ni activar plan/overages. Elegir un remitente autorizado con solución gratuita, introducir credenciales directamente en proveedor y probar registro→correo→callback→perfil→sesión. No desactivar confirmación ni añadir colaboradores al equipo para eludir la restricción del correo integrado.
3. Continuar restantes de staging Free: ingesta HTTP/siete fotos/contactos/demanda/notificaciones/avatar/edición/borrado/carrera de versión/firma 300 s **revalidados en este corte**. Faltan 600/900 s+renovación, red/cold-start controlado, UI/dispositivos reales y recuperación íntegra. No conectar previews al Supabase actual ni dejar pruebas mutantes activadas. Preservar la cuenta previa; cualquier nuevo ensayo requiere opt-in/baseline y limpieza sólo de sus IDs sintéticos.
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
