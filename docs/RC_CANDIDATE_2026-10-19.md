# QRIH — RC de STAGING, 19 de octubre de 2026

Estado vigente: **PUBLICADO / READY / HUMO REMOTO PASS / NO-GO SOFT LAUNCH**.

[Resultado del RC](rc-deploy-retry-2026-10-19.json): build `6ad6ea1852ec38abfbd9bb20`, deploy `6ad6ea1852ec38abfbd9bb22`, commit publicado `5c4970eb31e52b5af2cdfe41ecf1636839320da3`; READY y publicado comprobados por API y dashboard, 19oct22:12:54 CDMX / 20oct04:12:54 UTC. **133/133 pruebas unitarias remotas y 31/31 comprobaciones HTTP del sitio desplegado PASS, 0 fallos/0 omisiones**; lint, tipos, preflight y compilación completados por el pipeline. Huella de las180entradas igual al manifiesto corregido; fuente funcional sin cambios por este intento.

AUD-039 **MEDIO / CONFIRMADO / CORREGIDO Y VALIDADO EN CI REMOTA**: aislamiento de fixtures verificado en proveedor, sin debilitar el guard de origen. El primer intento fallido y su recibo se conservan como antecedentes. Segundo intento autorizado por «SI», un único POST nuevo/journal separado, sin tercer intento. Free/saldo previo299/300/sin recargas ni overages; `stop_builds=true` restituido y comprobado. Sin producción/main, pagos, cambios de configuración de Supabase, repetición051, respaldo/restore ni operaciones de negocio autenticadas. Las peticiones de humo fueron lecturas o solicitudes inválidas/no autenticadas; no verifican físicamente Storage/RLS con usuario real ni sustituyen la aceptación UI.

**GO técnico de despliegue del RC en STAGING; NO-GO para apertura del Soft Launch.** Pendientes: aceptación de los nuevos flujos Auth/Storage/UI con sesión legítima y fixtures expresamente autorizados, concurrencia/renovación de firmas según checklist, y cierre operativo/RPO-RTO24h/aceptación final. Los recibos sintéticos y la recuperación anterior conservan su alcance, sin repetir trabajo cerrado.

## Fuente y trazabilidad

Fuente corregida `3e4ec56c3fb65fbdcfd0f7caac2af8e072da5d77`; commit de deploy `5c4970eb31e52b5af2cdfe41ecf1636839320da3` incorpora sólo documentación después de esa fuente. [Manifiesto180](rc-candidate-inputs-2026-10-19-ci-fix.json), huella `c68db490244b8cd955ae935bfacf6f4dcfa0838b7ed1476b5d5341f0742ba537`,180archivos iguales antes de solicitar build. Build local previo `AMTNL30N4szt9Ppm2B27j` no es el identificador del build de Netlify. Nuevas actualizaciones documentales no requieren compilar otra vez.

## Resultado y límites

Netlify Build37.4.3 / Next.js Runtime5.16.3; dashboard acredita publicación del commit correcto y todas las etapas completas. Pipeline: lint → tipos →133unit → preflight → Next build → preflight → adapter/deploy. Humo ejecutado después de READY: `QRIH_SMOKE_ORIGIN=https://qrih-staging.netlify.app npm run test:http`,31PASS/0fail/0skip, duración12958,501805ms. Cubre401/403/404/405, redirecciones seguras, cache privada y no generación de sesión/firma al anónimo, con UUID fijo ficticio; ningún usuario/correo/ID de propiedad real utilizado.

El contexto del dashboard «Production: develop» corresponde al slot publicado de **qrih-staging**, no al negocio en producción ni a main. SiteID `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`, equipo `flira-ciudadmaderas`; origen Supabase `mcyxunymhuxyiwklyfpy` y variables protegidas comprobados sin imprimir valores secretos. Free/saldo previo299créditos, no recargas/overages ni método de pago añadido. No se infiere saldo posterior inmediato; el consumo puede actualizarse con demora.

## Antecedente fallido conservado

[Primer intento](rc-deploy-attempt-2026-10-19.json), build6ad6e67b4a3146b7e208b964/deploy6ad6e67b4a3146b7e208b966, commitbb439a6:117testsPASS/15fallos por origen heredado de fixtures, antes de Next build/publicación. [Manifiesto179](rc-candidate-inputs-2026-10-19.json) histórico, no reinterpretado como PASS remoto. Corrección exclusivamente en tests, guard real intacto;133unit normales/proveedor sintético y regresión hija33casos PASS locales. Segundo intento autorizado separadamente; un POST nuevo y builds detenidos restaurados. No rollback, restoreSiteDeploy, publishDeploy ni tercer intento.

## Pendientes posteriores al RC

Sólo aceptación de nuevos flujos autenticados/Storage físico/UI con alcance de fixtures expreso y cierre operativo/aceptación final. Migración051 y captura cifrada/segunda copia ya verificadas; no repetir. No usar propiedades reales como pruebas de retiro/duplicado ni declarar RTO/operación diaria cumplidos por este deploy.
