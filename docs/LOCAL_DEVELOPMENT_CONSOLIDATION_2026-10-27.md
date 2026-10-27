# Consolidación local de QRIH — 27 octubre 2026

## Resultado y límites

B es la raíz principal de desarrollo: `/Users/fabianlira/Documents/ChatGPT/QRIH Inmobiliaria industrial/qrih`.
A es el repositorio histórico conservado intacto: `/Users/fabianlira/Documents/Codex/2026-09-18/perfecto-con-esas-decisiones-el-modelo`.
Rama mantenida: `feature/sprint-3-commercial-tools`; sin fusiones, push, fetch, cambios remotos, migraciones hospedadas, despliegues ni restablecimiento de contraseñas.

## Protección de Sprint 3

- Entrada: HEAD `841463390298f6e5d5236ebf05b8f5492a8c1640`, 25 archivos modificados y 21 nuevos, nada previamente preparado en el índice.
- `883818c`: conserva los 43 archivos de producto, pruebas y documentación de Sprint 3 y su complemento; cuatro migraciones sólo como código preparado. No se cambió el código funcional durante esta consolidación.
- `6db1541`: conserva los tres archivos de preparación del respaldo, verificador humano y bloqueo de autenticación. No captura ni restaura.
- Los comentarios de los informes anteriores que dicen «sin commit» describen sus cortes históricos; estos checkpoints los reemplazan como estado Git actual, no como aceptación de STAGING.
- Revisión de 46 candidatos: sin coincidencias con las claves existentes, JWT completos, formatos de clave secreta o llave privada; sin archivos de respaldo/credenciales para versionar. Los correos detectados en pruebas son fixtures sintéticos, no contactos reales. Esta inspección no equivale a garantizar ausencia universal de todo secreto posible.

## Configuración propia de B

Se generó `.env.local` nuevo, sin sobrescribir archivo previo, modo `600`, propietario local y excluido de Git. Sólo contiene:

1. `NEXT_PUBLIC_SUPABASE_URL`: origen fijo `https://mcyxunymhuxyiwklyfpy.supabase.co`.
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: clave pública existente validada contra ese host.
3. `SUPABASE_SERVICE_ROLE_KEY`: credencial existente sólo de servidor, validada contra ese host y por claims de proyecto/rol cuando es JWT.

Origen único de la provisión: el `.env.local` STAGING previamente identificado en A. Se leyó expresamente ese archivo, **no** el `.env` histórico de otro proyecto ni capas heredadas. Se omite el alias público redundante, no utilizado por el código. No se transfirieron contraseñas PostgreSQL, claves de cifrado, SMTP/OAuth, configuración Netlify ni secretos de producción.

`scripts/provision-local-staging.mjs` es una herramienta de provisión explícita, no un fallback: destino fijo B, fuente regular sin symlink/propietario/modo comprobados, lista cerrada de variables, validación STAGING, consultas REST `limit=0` sin filas ni lectura de cuerpos, creación exclusiva y comprobación posterior. Rechaza capas locales existentes y no reescribe el destino. No debe ejecutarse en cada arranque ni reutilizarse para sincronizar A/B.

El primer intento no pudo verificar la red desde el sandbox y no creó archivos. Con el permiso de ejecución de red se verificó únicamente el origen STAGING y la provisión concluyó. Ningún error mostró valores de claves.

## Inicio desde ahora

En la carpeta B:

```sh
npm run build
npm run start -- --port 3112
```

Alternativa de desarrollo: `npm run dev -- --port 3112`. No se requiere ejecutar herramientas desde A ni el lanzador anterior. El puerto es configurable; durante la verificación 3110 ya estaba ocupado y se dejó sin interrumpir, por lo que no certifica por sí solo el proceso nuevo. Servidor verificado: `http://localhost:3112`.

El lanzador de compatibilidad `../sprint1-local-env.mjs` ahora únicamente invoca `npm run build/start/preflight` con cwd B. Se retiraron el import del cargador y la lectura de configuración de A. Ese archivo vive fuera del repositorio B y no forma parte de sus commits; el procedimiento canónico versionado es el de este documento. No usar sus versiones históricas como receta.

`scripts/local-next.mjs` y `scripts/local-environment.mjs` conservan los guards existentes de URL exacta, roles/ref JWT, verificación de claves contra STAGING al iniciar, marca de build, host localhost, argumentos acotados y bloqueo de vínculo CLI ajeno. No se cambiaron para aceptar producción. La plantilla `.env.example` señala STAGING y no contiene claves utilizables. `node_modules`, Next y supabase-js son directorios reales dentro de B, no enlaces hacia A. No quedaron referencias a A en los scripts de ejecución, código de aplicación o librerías. Las menciones históricas en documentos no son dependencias de ejecución.

## Pruebas repetidas

| Comprobación | Resultado |
|---|---|
| Aplicación/regresión `npm test` | 288 PASS, 0 fallos/omitidas |
| PostgreSQL aislado `npm run test:rls` | 130 PASS, 0 fallos/omitidas |
| Consolidación `npm run test:consolidation` | 3 PASS |
| HTTP anónimo/sintético contra nuevo B en 3112 | 39 PASS |
| TypeScript y lint | PASS |
| Build directamente desde B | PASS |
| Preflight de entorno y bundle cliente | PASS; sin referencia/valor de la credencial privada examinada |
| Autotest del verificador PostgreSQL | 44 comprobaciones PASS; 0 conexiones |

Total de las cuatro suites: **460 pruebas**. Los 44 controles internos del verificador se reportan aparte, no se suman como pruebas funcionales. Las suites de usuarios sintéticos prueban identidad, acceso y aislamiento A/B/admin/suspendido con mocks y PGlite descartable. **No se inició sesión en Auth remoto con usuarios reales o sintéticos ni se acredita un login end-to-end hospedado.** Las comprobaciones HTTP no abren fichas reales que registren visitas y sólo realizan solicitudes anónimas/ inválidas o con ID ficticio. Las consultas remotas de configuración retornan cero filas; no se modificaron datos reales. PGlite es una herramienta externa de auditoría en la carpeta del 3oct, no una dependencia de A; sus migraciones se ejecutan sólo en memoria sintética, nunca en STAGING.

## Preservación de A

Huella antes/después idéntica de 1,697 archivos, incluyendo historial Git y configuración; excluye `node_modules`, `.next` y `work`: `ad1b0df90fc0f0d68beaaad3322d3c32e6f5d869cf7044b7d3132c58ff173353`.
No se ejecutaron comandos de escritura ni servidores desde A; no se cambió ningún archivo de A.

## PostgreSQL y respaldo: bloqueados, no confundidos con el arranque web

Destino previsto del verificador: STAGING `mcyxunymhuxyiwklyfpy`; `aws-0-us-west-1.pooler.supabase.com:5432`, base `postgres`, usuario `postgres.mcyxunymhuxyiwklyfpy`, Supavisor modo sesión. TLS `verify-full` con CA revisada, `passfile=/dev/null`, contraseña humana oculta, SQL read-only y ROLLBACK. No carga `.env` de A ni B. El nombre histórico del CA no identifica producción.

Resultado humano anterior: `AUTH_NO_VERIFICADA`; en el pooler hubo rechazos de autenticación para postgres, sin diagnóstico definitivo. Una caché del pooler es sólo hipótesis, no causa acreditada. En esta consolidación se ejecutó únicamente el autotest sin conexión; no se solicitó contraseña ni se reintentó autenticación.

El lanzador del verificador sigue fijando el hash de una herramienta auditada externa a B, bajo el directorio del 3oct (no A). Esto no condiciona el inicio de la aplicación. No se modificó la herramienta ni se cambió a conexión directa de forma implícita.

El respaldo actualizado, copia nueva de Drive y recuperación permanecen **sin ejecutar**. Continúan pendientes autenticación PostgreSQL, nuevo destino aislado/seguro, capacidad efectiva de Drive, ventana consistente y revisión del capturador. Las cuatro migraciones Sprint 3 y la propuesta de métricas Sprint 2 siguen sin aplicar. La independencia local no levanta el NO-GO de migraciones o despliegue.

## Siguiente paso recomendado

Usar exclusivamente B y su configuración local para desarrollar. Conservar A como referencia, sin borrarla ni fusionarla. Para retomar el respaldo, acordar por separado un único diagnóstico directo read-only con intervención humana y comprobación previa de IPv6; no rotar contraseña ni reintentar en bucle. Mantener las claves fuera de commits y las carpetas `.next`/entorno fuera de paquetes que se compartan.
