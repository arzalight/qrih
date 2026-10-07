# AUD-034 — Aislamiento del desarrollo local

2026-10-06. **ALTO operativo / CORRECCIÓN LOCAL IMPLEMENTADA — CONFIGURACIÓN PRIVADA Y VALIDACIÓN RUNTIME PENDIENTES.** No marcar totalmente corregido mientras falte clave privada/verificación local real.

## Cambios mínimos, sin arquitectura funcional nueva

- Rama fix/aud-034-local-staging; corrección identificada antes de implementar. Sin frontend/API/RLS/migraciones/dependencias nuevos.
- `.env` original conservado. `.env.local` ignorado, modo 600, tiene URL y clave pública de STAGING mcyxunymhuxyiwklyfpy; clave privada vacía para introducirla directamente en el archivo, nunca por chat.
- Archivo de estado CLI original movido recuperablemente, completo, de `supabase/.temp` a `supabase/.temp-original-aud034`, sin borrar archivos ni editar sus secretos. Archivo original archivado e ignorado por .gitignore; raíz activa queda **sin enlace CLI**, no se afirma linked a staging. Hasta configurar un vínculo explícito autorizado, usar MCP con project_id staging. No restaurar el archivo anterior en la raíz ni ejecutar --linked sobre él.
- scripts/local-environment.mjs carga el env efectivo con @next/env instalado, misma precedencia de Next. Rechaza URL distinta a staging, credentials/path/query/hash, rol público privilegiado, JWT legacy con ref equivocado, clave privada ausente en runtime, contexto Netlify y link CLI ajeno. Claves modernas opacas se verifican mediante lectura de catálogo REST en host fijo staging antes de dev/start, sin leer/imprimir cuerpo, headers o valores.
- scripts/local-next.mjs controla npm run dev/build/start. Dev/start se enlazan sólo a localhost; opciones limitadas a puerto y compilador de desarrollo, sin trace remoto/inspect/otro directorio. Build verifica destino sin exigir secreto runtime; start requiere marca de build del env público actual. Marca sólo origen/hash de clave pública, sin secretos.
- .next restringido a modo 700: Next puede recargar secretos desde .env.local aunque se retire la variable del entorno heredado al compilar. No versionar ni distribuir cachés .next ni .env.local. No afirmar que retirar una variable del child garantiza que nunca aparezca en una caché privada.
- deployment-preflight ahora respeta .env.local y valida staging en modo local; controles Netlify existentes siguen separados. netlify.toml y scripts/netlify-next-build.mjs no cambiados. .env.example explica desarrollo local seguro.
- Sin dependencia instalada ni lockfile modificado. @next/env ya era dependencia instalada de Next; cargador recomendado oficialmente. [Variables Next](https://nextjs.org/docs/app/guides/environment-variables).

## Uso preparado

1. En `.env.local`, introducir **únicamente la clave privada de QRIH STAGING** en SUPABASE_SERVICE_ROLE_KEY. No usar key original, no copiar SITE_ID/URL y no enviar valores al chat. El editor del archivo se solicitó al app; abrió en estado queued, apertura visible aún no acreditada. Se puede abrir manualmente en editor local.
2. npm run preflight; npm run dev para http://localhost:3000, o npm run dev -- -p 3107 si se necesita el puerto de humo. El guard verifica credenciales contra staging antes de iniciar; no permite arranque parcial sin secreto.
3. Para probar build local: npm run build; luego npm run start -- -p 3107. Build no equivale a deploy y no necesita publicar en Netlify. Comprobar runtime/HTTP y callbacks locales autorizados en Supabase staging antes de registro o correo nuevo.
4. No ejecutar antiguas suites mutantes con limpieza de cuentas; staging actual no cumple su baseline. La tercera cuenta real sigue omitida/no validada. No iniciar comandos Next directos que evadan el wrapper ni recuperar el link original para probar.

## Verificación y límites

Guard efectivo sobre configuración local: npm run dev y preflight rechazan arranque por clave privada vacía; comportamiento esperado, no ausencia de protección. Build local con sólo clave pública staging pasó; ningún servidor iniciado, correo/cuenta/property/objeto/migración/rol remotos cambiados por el agente. La verificación remota de claves modernas aún no se ejecutó con clave privada real.

Regresiones tests/local-environment.test.mjs cubren destino, roles/ref, falta de secreto, link/contexto, precedencia real Next, fallos de verificación sin filtración, opciones de arranque y build certificado. Casos usan datos sintéticos y mocks; no sustituyen login/autenticación HTTP real ni callbacks.

Resultado final local: **77 unit (7 nuevas), lint/tipos/build PASS**, marca generada y cache700; 28 JS cliente/0 patrones privados examinados/0 referencias al original. 43 SQL PGlite/audit producción 0 del diagnóstico previo se conservan, no reejecutados. Ninguna suite HTTP/sesión nueva; preflight/dev bloquean por secreto ausente.

Próximo: completar secreto local de staging por el usuario, verificar guard/runtime y un lote HTTP en localhost. Cierre completo de AUD-034 sólo con evidencia de esa configuración y prueba; AUD-035 detenido no cierra este paso. Supabase skill orientó claves server-only, identidad y pruebas del destino; sin nuevas reglas de negocio. NO-GO externo/RC definitivo conservado.
