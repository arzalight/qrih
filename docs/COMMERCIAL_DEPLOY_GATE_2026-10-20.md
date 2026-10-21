# QRIH — Gate de entrega comercial a STAGING

## Corte vigente21oct — nuevo alcance visual local, sin nuevoRC

[Cierre por bloques/evidencia y límites](PRELAUNCH_UI_IMPLEMENTATION.md). Siete bloques implementados en feature/prelaunch-ui-review;196tests (39UI incluidas)/31HTTP,lint/tipos/build/preflight PASS;112mediciones/28vistas en cuatro anchos sin overflow. Admin real/visor/etiquetas/PDF local revisados. AUD044 fila faltante reparada sólo bajo autorización,correo vacío. Main/develop sin cambios,push/deploy0.

- [x] Referencia recibida;diagnóstico anterior conservado.
- [x] Siete bloques en commits separados; contratos Auth/formularios y código privilegiado preservados.
- [x] Catálogo/precios/labels/galería/foco y geometría local con límites explícitos.
- [x] Pruebas automatizadas/lint/tipos/build/preflight del código local final.
- [ ] Aprobación humana visual y completar aceptación crítica de estados/acciones no ensayados mediante lectura.
- [ ] Autorizar nuevoRC y verificar cuotaFree actual; no usar autorizaciones históricas.
- [ ] Publicar/verificar SHA exacto del nuevoRC y su comportamiento Netlify/Storage/Auth/PDF.
- [ ] Reemitir GO condicionado sólo con evidencia remota suficiente;WCAGglobal/Safari/performance no certificados.

**NO-GO visual para Soft Launch conservado.** Los checklists y cuotas inferiores pertenecen a cortes anteriores, no autorización para desplegar hoy.

**Actualización visual:** referencia gráfica recibida e inspeccionada; bloque1 implementado/validado localmente según [seguimiento](PRELAUNCH_UI_IMPLEMENTATION.md), resto pendiente. La casilla de referencia del corte inferior queda completada; NO-GO visual/nuevoRC sin autorización conservados. No desplegar por esta documentación.

## Gate adicional vigente — rediseño UX/UI solicitado después del RC comercial

**NO-GO del nuevo alcance visual.** El gate comercial inferior permanece cerrado para5f7b8e2, pero no aprueba cambios visuales posteriores. [Auditoría inicial y matriz](PRELAUNCH_UI_AUDIT.md). Rama local `feature/prelaunch-ui-review`,base1992ca8, sin código visual nuevo ni deploy. Referencia gráfica pendiente;25páginas inventariadas/19vistas/76mediciones de base.157unit/31HTTP locales PASS,lint/tiposPASS; no build/aceptación del rediseño.

- [x] Estado Git inicial limpio y rama específica; inventario/código y diagnóstico responsive inicial.
- [x] Funciones Editar/Duplicar/portada/Compartir/MXN-USD verificadas en fuentes; no reemplazarlas por marcadores.
- [x] Hallazgos clasificados UX-001–014, límites de evidencia y riesgos documentados.
- [ ] Imagen de referencia visible o decisión explícita de prescindir de ella.
- [ ] Sistema de diseño/controles y siete bloques implementados/revisados con commits separados.
- [ ] Catálogo sin precio recortado a375/768/1024/1440, labels y foco modal corregidos; contrastes medidos.
- [ ] Pruebas nuevas/regresión/lint/tipos/build/preflight locales del nuevo código y comparación visual.
- [ ] Administración con sesión legítima, permisos/estados y flujos críticos de matriz visual aceptados.
- [ ] Autorización explícita de nuevoRC, cuotaFree vigente, sin pagos/producción/main.
- [ ] SHA exacto del nuevoRC/STAGING, adaptador/headers/Storage/PDF/acciones críticas validados; dictamen actualizado.

No ejecutar automáticamente los pasos de deploy de cortes históricos ni reutilizar su autorización para este alcance visual.

### Corte previo — cierre del gate comercial del artefacto anterior

## Gate técnico y aceptación comercial cerrados

**GO CONDICIONADO del piloto STAGING supervisado.** [Dictamen](SOFT_LAUNCH_GO_2026-10-20.md) / [aceptación](COMMERCIAL_ACCEPTANCE_2026-10-20.md). AltaUSD/duplicado guardado/revisión y privacidad gestionadas PASS. RC5f7b8e2/deploy6ad82c6afc32e2d1cb980405 ya publicado/verificado y sin cambios funcionales187fuentes. No otro deploy por cierre documental. Mantener builds detenidos/Free y permisos separados para producción/main/nuevoRC. No repetir052/backups/restore/fixtures/aceptación legal. AUD043MEDIO/riesgos operativos aceptados permanecen, no SLA.

### Gate previo a la aceptación final

## Gate RC cerrado — aceptación comercial entonces pendiente

[Recibo](commercial-deploy-verification-2026-10-20.json):5f7b8e2/deploy6ad82c6afc32e2d1cb980405 READY/publicado,20oct21:08CDMX;157unit/31HTTP remotos, ficha/6WebP/PDF/filtros PASS. Un build bajo autorización, saldo previo268,1Free/sin recargas-overages; stop_builds restituido. Manifiesto187entradas conserva fuente77cd680, docs integradas develop/main intacta. No nuevo deploy por documentación ni repetición052/copia. **GO técnico del RC/NO-GO comercial** hasta altaUSD/duplicación guardada/revisión monetaria gestionadas bajo alcance adicional; las lecturas/edición actual no equivalen a ese caso. [Detalle y AUD043](COMMERCIAL_INTEGRATION_2026-10-20.md).

### Controles anteriores al RC — históricos

## Gate vigente posterior a integración

[Control actualizado](COMMERCIAL_INTEGRATION_2026-10-20.md) y recibos de respaldo/migración/aceptación parcial enlazados allí: copia local+Drive verificada,052 aplicada una vez y cinco precios USD corregidos bajo confirmación humana; AUD042 corregido local+GitHub77cd680. No repetir gates cerrados. Localhost activo contra STAGING. Preparar nuevo manifiesto, integración develop y cuota fresca para el único RC autorizado; nuevo deploy aún NO iniciado. NO-GO comercial hasta aceptación remota, main/producción intactos.

### Control inicial histórico

Control20oct2026,22:07UTC. **NO-GO comercial / detenido antes de052 y RC por nueva copia previa al cambio.**

## Alcance autorizado y entrega

Usuario: «continúa hasta deploy si no requieres intervención». Entrega de código, integración de052 al QRIH STAGING y un RC en Netlify Free, condicionados a controles y aceptación; sin main, producción, pagos, nuevos proveedores, borrados o migraciones históricas. No autorización para omitir copia previa ni repetir capturadores consumidos.

Código/pruebas/migración propuesta: commit GitHub `715e42acf27a515721229a7aab75c8c241640194`, rama `feature/commercial-sharing-currency`, padre `7b392d8e80c5eab3f302487c2356228e0d8c0aee`, tree `75f247b1550c4a073b19c9bed5cea7c2d5a809b8`. Se verificaron los41archivos por bytes/SHA256 del [recibo local](commercial-local-2026-10-20.json), escaneo de índice267archivos/0hallazgos y árbol Git local/remoto idéntico; sin force/reset. El recibo local conserva su fecha y estado histórico anterior al commit, no se reescribe como prueba alojada.

`develop` sigue `7b392d8e80c5eab3f302487c2356228e0d8c0aee`; `main` sigue `55b773756066cd3975b3964dc67f106cf15ead4c`. No se integró código dependiente de052 como RC listo.

## Controles completados

- Netlify autenticado, sitio exacto qrih-staging / repo arzalight/qrih / rama develop. Free, sin auto_topup ni overages; secretos de servidor protegidos y origen Supabase esperado. No se imprimieron valores de credenciales.
- Saldo visible **268,5/300 créditos** (el encabezado redondea269),31,5consumidos y0builds concurrentes. Observación actual, no garantía futura; revalidar al iniciar el único RC. No cambios de plan ni despliegue.
- `stop_builds=true`, allowed_branches sólo develop, logs privados. Se conservó detenido antes de la entrega GitHub; no autoCI.
- Publicado aún deploy `6ad79257b59620a2a787e9a1`, commit `f803f35faba9cf871a81f93560112e20358230c2`, ready. Es el artefacto anterior, no sirve como aceptación de compartir/moneda nuevos.
- Bundle cifrado local anterior conserva SHA256 `8b96566ab97e9e7d48404ed3bf0f211cc00a43a56bded9ce9a423cd541c85455`; no se descifró ni restauró. Sólo existen las dos generaciones conocidas, sin eliminación.

## Intervención requerida

La última captura terminó20oct02:56:17UTC, antes de051 y de fixtures/pruebas posteriores. Aunque aún tiene menos de24h y su hash coincide, **no refleja el estado actual previo a052**. La política acordada exige copia por día de uso y antes de cambios importantes. No se declara un respaldo actual por antigüedad solamente.

**Autorización posterior recibida20oct:** «Sí, nuevo respaldo cifrado local + Drive». No volver a solicitarla. [Preparación](COMMERCIAL_BACKUP_PREPARATION_2026-10-20.md) de captura cifrada BD/Auth/fotos del proyecto mcyxunymhuxyiwklyfpy, local y segunda copia en la misma carpeta privada Drive, sin borrar generaciones ni restaurar. Contraseña sólo en prompt oculto del usuario; nunca chat. El capturador anterior/recibos de uso único permanecen intactos. Captura y transferencia aún pendientes.

## Continuación después del gate

1. Preparar/verificar nueva captura y readback privado bajo alcance confirmado, sin exportaciones sin cifrar en Git/Drive/logs. Ventana sin escrituras y origen exacto.
2. Preflight vivo de baseline+044–051, ausencia052, esquema/ACL/tipos y huellas; sólo052 una vez, historial coherente atómico y comparación histórica excluyendo únicamente price_currency. Sin db push global ni repair.
3. Iniciar localhost contra QRIH STAGING y ejecutar [matriz comercial](COMMERCIAL_SHARING_CURRENCY.md#matriz-de-aceptación-pendiente-en-staging) con sesiones legítimas/fixtures autorizados. No publicar USD con el artefacto anterior ni aceptar términos por el usuario.
4. Integración controlada develop, nuevo manifiesto, cuota vigente y un RC. Verificar SHA/READY/publicación/humo/matriz antes de reemitir GO. No deploy adicional por documentación ni producción/main.

En este control:0migraciones,0mutaciones de datos reales,0capturas,0uploads de respaldo,0restores,0deploys. Las guías Supabase/PostgreSQL y Netlify motivan los gates; no equivalen a pruebas gestionadas completadas.
