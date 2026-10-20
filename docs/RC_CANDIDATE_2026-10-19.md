# QRIH — RC de STAGING, 19 de octubre de 2026

## Nuevo alcance comercial — NO-GO / candidato anterior histórico

[Compartir y MXN/USD](COMMERCIAL_SHARING_CURRENCY.md) cambiaron el código y requieren integración052/aceptación STAGING y un nuevo candidato. Los hashes, deploys y pruebas que siguen no certifican esta rama. Sin otro deploy ni aplicación cloud en esta entrega.

## Cierre vigente20oct — GO condicionado del piloto

**GO CONDICIONADO para Soft Launch supervisado en el QRIH STAGING existente, con datos reales ya seleccionados.** [Dictamen y condiciones](SOFT_LAUNCH_GO_2026-10-20.md) / [RC y cierre AUD-040](aud040-deploy-verification-2026-10-20.json). Commit publicado `f803f35faba9cf871a81f93560112e20358230c2`, fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a`, deploy `6ad79257b59620a2a787e9a1` READY/SHA/publicación exactos.138unit remotas/31HTTP remotos PASS/0fallos/0skips y lint/tipos/build/preflight completos. Selector admin corregido, guardado autenticado de fixture con éxito, `m2` conservado y huellas comerciales/galerías de ambos fixtures iguales (sólo updated_at excluido). **AUD-040 MEDIO CORREGIDO, DESPLEGADO Y VERIFICADO.**

Aceptación crítica [gestionada](soft-launch-moderation-2026-10-20.json): owner/admin reales, ciclo publicado→retirado→editado→revisión→rechazo, privacidad/ficha/PDF/7WebP, duplicado y portada independientes. Fixtures finales rejected/draft,14objetos conservados; sin inmuebles reales alterados por el agente, eliminaciones, nueva migración ni producción/main. Free/saldo previo283,7créditos/sin pagos-recargas-overages, un único RC adicional autorizado y builds detenidos; no otro build por documentación.

**Límites operativos aceptados expresamente:** Fabián supervisa, respaldos cifrados manuales por día de uso/antes de cambios y pausa manual de nuevas altas si falla respaldo/correo/cuota. Recuperación completa24h y carga/concurrencia real NO medidas; renovación prolongada/all-actor-all-status y demás límites conservan su alcance, no son PASS inferidos. AUD-018 mantiene riesgo operativo residual aceptado, no «totalmente corregido». Sin SLA, GO de producción, invitaciones, publicación de registros adicionales ni acciones automáticas. Los NO-GO/pedidos de permiso o deploy de cortes inferiores son **antecedentes superados por este dictamen condicionado**, no tareas vigentes.

### Antecedentes de preparación y controles ya cerrados

**Corte20oct — aceptación crítica nueva PASS; AUD040 local bloquea el GO remoto hasta nueva entrega.** **Aceptación funcional crítica PASS, dentro de su alcance; límites operativos del piloto ACEPTADOS por el usuario; GO pendiente de entregar/verificar AUD-040.** [Ciclo gestionado y límites](soft-launch-moderation-2026-10-20.json): sesión publisher localhost y admin legítimo STAGING; original pending→published→draft→pending→rejected, Cancelar conserva publicada, un solo evento de retiro, edición/reenvío normales. Ficha/PDF y7WebP públicos200 sólo publicada; nuevas lecturas404 y autorización vacía al retirar/rechazar en ambos sitios. Admin no-owner recibe404 en editor/duplicación privados. Duplicado draft101m²,14rutas independientes/7fotos cada uno; visor admin1→2→1/EscapePASS. Cero borrados/tercer fixture/cambios de inmuebles reales/DDL/deploy en esta aceptación; ambos fixtures conservados sin publicar.

**AUD-040 MEDIO / CONFIRMADO / CORREGIDO LOCALMENTE / NO DESPLEGADO.** [Informe](AUD040_ADMIN_PRICE_UNIT.md): BD `m2` no correspondía a opción `m²` del editor admin; selector vacío podía enviarse comoNULL. Inconsistencia reproducida en BD+DOM, pérdida real no provocada. Dos líneas de corrección, cinco regresiones antesFAIL/despuésPASS y conteo hijo33→38.138unit/31HTTPlocal/lint/tipos/build/preflightPASS; tres entradas funcionales cambian y READY5c4970e anterior no contiene el fix. Sin migración/datos/configuración/producción cambiados. Falta entregar develop, único RC adicional con autorización explícita y comprobación de selector/guardado sobre fixture; no repetir ciclo completo, copias,051 o recuperación.

**Aceptación operativa explícita:** «Sí, acepto esos límites para el piloto»: piloto supervisado/Fabián, política de respaldos ya aprobada, pausa de nuevas altas si falla respaldo/correo/cuota; recuperación completa24h y carga/concurrencia real no medidas, sin SLA ni GO de producción. Copia cifrada local rehashPASS,12,82h de antigüedad al corte20oct15:45UTC; no nueva captura/restore ni readbackDrive actual. Renovación cronometrada/concurrencia y demás límites quedan declarados, no convertidos en PASS. No pedir nuevamente esa aceptación. **NO-GO vigente del artefacto remoto hasta AUD-040 entregado y verificado; después dictamen condicionado del piloto, nunca apertura/invitaciones automáticas.**

Los estados previos que piden sesión admin/aceptación del ciclo o permiso operativo son antecedentes ya superados. RC publicado5c4970e conserva su recibo y no acredita la corrección local nueva. No repetir trabajo cerrado.

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
