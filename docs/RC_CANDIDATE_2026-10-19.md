# QRIH — RC de STAGING, 19 de octubre de 2026

Estado vigente: **PRIMER BUILD FALLÓ ANTES DE PUBLICAR / FIX CI ENTREGADO / NUEVO BUILD REQUIERE APROBACIÓN / NO-GO SOFT LAUNCH**.

## Resultado posterior

[Intento y corrección](rc-deploy-attempt-2026-10-19.json) / [manifiesto180](rc-candidate-inputs-2026-10-19-ci-fix.json). Único build6ad6e67b4a3146b7e208b964/deploy6ad6e67b4a3146b7e208b966 del commitbb439a6: lint/tipos remotosPASS,117testsPASS/15fallos por origen heredado en fixtures. No llegó a compilar Next ni publicar; f67fa46 sigue activo. AUD039MEDIO confirmado/reproducido y corregido sólo en pruebas: tres suites aíslan SITE_ID/URL y restauran entorno; guard real/casos origen ajeno intactos, regresión hija33casos.133unit normales y133con proveedor sintético/0skips, lint/tipos/build/preflight localesPASS. Commit3e4ec56c3fb65fbdcfd0f7caac2af8e072da5d77 ya verificado en GitHub develop; main intacta. Sin app/seguridad/RLS/env real/datos modificados por el fix. Builds detenidos/Free; segundo intento todavía NO solicitado y requiere aprobación. Humo remoto nuevo/Auth-Storage-UI/operación pendientes y **NO-GO Soft Launch**. Los cortes inferiores de preparación del primer deploy son antecedentes.

Build local corregido `AMTNL30N4szt9Ppm2B27j`, huella180 `c68db490244b8cd955ae935bfacf6f4dcfa0838b7ed1476b5d5341f0742ba537`. El manifiesto179 original conserva el intento fallido; no se reescribe como si su build remoto hubiera pasado. Cambio externo stop_builds=false detectado antes de entregar develop se restituyó a true, sin atribuir causa ni observar builds nuevos. Un único POST de build y journal consumido preservados; no activar/reintentar automáticamente.

El usuario solicita «adelante y continuemos con el deploy». Alcance: un RC del proyecto existente `qrih-staging`, nunca producción/main, nueva cuenta, pago o despliegues rutinarios. La aplicación051 ya fue autorizada y verificada por separado; no se repite.

## Fuente y trazabilidad

- GitHub privado `arzalight/qrih` confirmado; develop remoto coincide con a496790 y main55b7737 se conserva. Nueva entrega por conexión GitHub ya autorizada porque la credencial CLI antigua está vencida; no extraer/renovar secretos ni pedir otro permiso de cuenta.
- Commit funcional `4c4ebdea30e2b2d87bf1dddf00c4150cd1b65e78`:18archivos de gestión de propiedades/051 y seis comprobaciones HTTP nuevas.
- Commit de tooling separado `487907bfd9971e744897fb1365e325d0a56cdd83`: dos archivos del ensayo de respaldo exclusivamente sintético; no exportador real ni servicio diario.
- Árboles creados por API GitHub coinciden con índices locales revisados. Objetos commit importados byte a byte con SHA exacto; se avanzó sólo la rama local feature por fast-forward, sin reset/force ni sobrescribir archivos. develop remoto no actualizado todavía en este corte.
- [Manifiesto nuevo](rc-candidate-inputs-2026-10-19.json):179entradas/huella `beb0d19582e8c9d1c3b30c2bf28341f100aae4036760d85fd149b3e08cdb3acb`. El manifiesto167 anterior es histórico y no se relaja su guard.
- Escáner de índice:216archivos del commit funcional y218tras tooling,0hallazgos de patrones examinados. No garantía universal de ausencia de secretos ni escaneo de bóvedas/backups.

## Validaciones anteriores al build remoto

132unit/93SQL sintéticas/19tooling sintéticas PASS,31HTTP sin sesión PASS, lint/tipos PASS. El primer ensayo del tooling sin directorio explícito se marcó19skips, no PASS; se repitió con binarios age revisados/pinneados y obtuvo19PASS/0skips, sólo fixtures en temporales, sin clave real ni red. Las seis pruebas HTTP añadidas verifican401/404/405 en duplicar/retirar/portada, sin mutaciones ni IDs reales.

Nueva compilación del código exacto487907b **PASS**, BUILD_ID `1WYx3kvDJq6JGb63R6b1e`,30páginas/Proxy; preflight posterior PASS y179huellas de entradas iguales tras compilar. Funciones de negocio nuevas aún sin aceptación Auth/Storage/UI autenticada: ni sintéticos ni humo anónimo las sustituyen.

## Netlify: destino y costo

ProyectoID `bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`, equipo `flira-ciudadmaderas`/ID `6a0ce0bb6db9850cb304a1f0`. API GET-only confirma Free, auto_topup=false, sin overages, stop_builds=true, repo esperado/develop como única rama, logs privados. Origen build/runtime de Supabase STAGING correcto, clave privada marcada secret y presente en contexto de publicación; valores no impresos. El contexto Netlify «production» corresponde al slot publicado de este proyecto STAGING, no al Supabase de producción ni a main.

Usuario inicia sesión web; saldo observado **299/300 créditos disponibles**, período19oct–18nov, sin método de pago. Consumo puede reflejarse con demora; no se garantiza consumo futuro cero. Publicado anterior `f67fa46fd62f0fbbbaba2b243f0e5455dc5083e8`/deploy `6ac558d161a9ab0008f7ee66` sigue READY, no sustituido todavía.

## Ejecución limitada

1. Terminar documento/manifiesto y escáner, entregar develop exacto por fast-forward bajo guard builds detenidos/Free. main intacta.
2. Revalidar SHA remoto, configuración y saldo; habilitar builds sólo durante el único RC autorizado, solicitar build del SHA/branch comprobado y restaurar builds detenidos. No cambiar repositorio, crear cuentas/hook público ni repetir/reintentar builds automáticamente ante fallo.
3. Esperar resultado READY/commit exacto y ejecutar31HTTP remotos contra `https://qrih-staging.netlify.app`, sin datos/correos válidos. Revisar compatibilidad Next/OpenNext y bundle/variables con diagnóstico sanitizado.
4. Registrar evidencia real y límites. READY de STAGING no autoriza apertura del piloto ni cierra Auth/Storage/UI nuevos, operación/RPO/RTO o NO-GO global.

Los accesos legítimos nuevos y escrituras de fixtures requieren su alcance; no retirar/duplicar propiedades reales como pruebas por inferencia. Sin limpieza, restore ni reejecución051.
