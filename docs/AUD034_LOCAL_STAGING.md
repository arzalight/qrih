# AUD-034 — Aislamiento del desarrollo local

2026-10-06. **ALTO operativo / CORREGIDO — AISLAMIENTO Y RUNTIME LOCAL VERIFICADOS.** Cierre limitado al desarrollo localhost contra STAGING; no acredita sesiones autenticadas E2E, callbacks locales, recuperación integral ni GO externo.

## Cambios mínimos, sin arquitectura funcional nueva

- Rama fix/aud-034-local-staging; corrección identificada antes de implementar. Sin frontend/API/RLS/migraciones/dependencias nuevos.
- `.env` original conservado. `.env.local` ignorado, modo 600, tiene URL y clave pública de STAGING mcyxunymhuxyiwklyfpy. Usuario introdujo clave privada directamente en el archivo; presencia/rol/ref y aceptación en el host fijo verificadas sin mostrar valores ni copiarla a documentación/Git/chat.
- Archivo de estado CLI original movido recuperablemente, completo, de `supabase/.temp` a `supabase/.temp-original-aud034`, sin borrar archivos ni editar sus secretos. Archivo original archivado e ignorado por .gitignore; raíz activa queda **sin enlace CLI**, no se afirma linked a staging. Hasta configurar un vínculo explícito autorizado, usar MCP con project_id staging. No restaurar el archivo anterior en la raíz ni ejecutar --linked sobre él.
- scripts/local-environment.mjs carga el env efectivo con @next/env instalado, misma precedencia de Next. Rechaza URL distinta a staging, credentials/path/query/hash, rol público privilegiado, JWT legacy con ref equivocado, clave privada ausente en runtime, contexto Netlify y link CLI ajeno. Credenciales se verifican mediante GET de properties_public con select=id&limit=0 en host fijo staging antes de dev/start, sin filas ni leer/imprimir cuerpo, headers o valores.
- scripts/local-next.mjs controla npm run dev/build/start. Dev/start se enlazan sólo a localhost; opciones limitadas a puerto y compilador de desarrollo, sin trace remoto/inspect/otro directorio. Build verifica destino sin exigir secreto runtime; start requiere marca de build del env público actual. Marca sólo origen/hash de clave pública, sin secretos.
- .next restringido a modo 700: Next puede recargar secretos desde .env.local aunque se retire la variable del entorno heredado al compilar. No versionar ni distribuir cachés .next ni .env.local. No afirmar que retirar una variable del child garantiza que nunca aparezca en una caché privada.
- deployment-preflight ahora respeta .env.local y valida staging en modo local; controles Netlify existentes siguen separados. netlify.toml y scripts/netlify-next-build.mjs no cambiados. .env.example explica desarrollo local seguro.
- Sin dependencia instalada ni lockfile modificado. @next/env ya era dependencia instalada de Next; cargador recomendado oficialmente. [Variables Next](https://nextjs.org/docs/app/guides/environment-variables).

## Uso preparado

1. Configuración privada local ya completada por usuario y verificada. Mantener **únicamente la clave privada de QRIH STAGING** en SUPABASE_SERVICE_ROLE_KEY. No usar key original, no copiar SITE_ID/URL ni enviar valores al chat. Reiniciar el servidor cuando cambie el entorno.
2. npm run preflight; npm run dev para http://localhost:3000, o npm run dev -- -p 3107 si se necesita el puerto de humo. El guard verifica credenciales contra staging antes de iniciar; no permite arranque parcial sin secreto.
3. Para probar build local: npm run build; luego npm run start -- -p 3107. Build no equivale a deploy y no necesita publicar en Netlify. Comprobar runtime/HTTP y callbacks locales autorizados en Supabase staging antes de registro o correo nuevo.
4. No ejecutar antiguas suites mutantes con limpieza de cuentas; staging actual no cumple su baseline. La tercera cuenta real sigue omitida/no validada. No iniciar comandos Next directos que evadan el wrapper ni recuperar el link original para probar.

## Verificación y límites

El primer corte sin secreto rechazó arranque correctamente (histórico). Tras «listo», guard local PASS: destino fijo staging, secreto servidor presente/rol-ref válidos, aliases públicos coinciden con clave oficial activa, env600/CLI unlinked.

Se detectó un falso rechazo de nuestro guard: /rest/v1/ devolvía 401 para claves públicas válidas (moderna y legacy), mientras /auth/v1/settings y /rest/v1/properties_public?select=id&limit=0 devolvían 200. La privada legacy sí recibía 200 en raíz. No era una clave pública equivocada ni motivo para abrir permisos. Corrección mínima en la misma auditoría: ambos apikey se comprueban en la proyección pública con cero filas; pruebas exigen host/ruta/headers/cache/redirect exactos y fallos cerrados. Verificación real de ambas claves PASS tras el ajuste. Sin modificar claves/roles/RLS/configuración Supabase.

Regresiones tests/local-environment.test.mjs cubren destino, roles/ref, falta de secreto, link/contexto, precedencia real Next, fallos de verificación sin filtración, opciones de arranque y build certificado. Casos usan datos sintéticos y mocks; no sustituyen login/autenticación HTTP real ni callbacks.

Resultado final: **77 unit, lint/tipos/build/preflight PASS; 21 HTTP PASS en next start y los mismos 21 PASS en next dev**, localhost:3107. No sumar ambas ejecuciones como 42 casos distintos. Guard de credenciales reales pasó antes de ambos arranques. Pruebas sin sesión/cuerpos inválidos y GET de páginas de acceso; no registro, correo, contraseña, autorización, propiedad, objeto, migración ni rol modificados. Servidores detenidos al acabar.

El primer dev dentro del sandbox mostró EMFILE/reinicios del watcher, seguido de tipos generados inconsistentes. Se detuvo, build regeneró tipos y typecheck pasó; dev con permiso revisado fuera del sandbox pasó HTTP sin EMFILE/reinicios. No se atribuye a código funcional ni se cambia Next/configuración/límites del sistema para ocultarlo. Para sesiones del agente, permitir la vigilancia local si reaparece; fuera de ese contexto no está demostrado el mismo error.

28 JS del build: 0 coincidencias de la clave privada real/0 nombre SUPABASE_SERVICE_ROLE_KEY/0 referencia al original. Un literal sb_secret_ proviene de la validación del SDK, no es una credencial. Dev: 20 JS efectivamente servidos por login/registro/recuperación, 0 clave privada/0 nombre variable/0 referencia original, 3 con ref staging; dos literales SDK no son secretos. El escaneo de toda la caché dev halló además 33 chunks históricos con ref original, todos anteriores al 6 octubre; no aparecieron en esos 20 archivos activos, no borrar sin autorización ni afirmar caché íntegra libre de referencias históricas. Env600/cache700 e ignore verificados; no versionar/distribuir .next. 43 SQL PGlite/audit producción 0 anteriores conservados, no reejecutados aquí.

Next dev generó AGENTS.md y CLAUDE.md automáticamente según Next16.3 instalado; se conservan como instrucciones documentales del framework, sin nueva configuración ni lógica de negocio. Guías instaladas revisadas antes de continuar. Sin dependencias nuevas.

Próximo: estabilización local por lotes, reproducción de renovación SSR y validación de redirects antes de altas/correos/login local; no repetir pruebas históricas ni tercera cuenta omitida. AUD-034 cierra aislamiento/runtime básico, no Auth E2E/RC ni AUD-018. Supabase skill orientó claves server-only, identidad y prueba real sin filas; [API keys](https://supabase.com/docs/guides/getting-started/api-keys). Rama fix/aud-034-local-staging, sin integración develop/main. AUD-035 stop_builds=true/Free/publicado anterior intactos revalidados; sin deploy. NO-GO externo/RC definitivo conservado.
