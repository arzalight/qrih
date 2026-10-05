# AUD-026 — Recuperación de contraseña, 2026-10-05

## Dictamen y alcance

**ALTO / CORREGIDO LOCAL — DEPLOY Y CORREO REAL PENDIENTES. NO-GO general.** Usuario autorizó implementar en develop sólo para staging. No feature de panel de seguridad, magic-link login, autenticación alternativa ni cambio de arquitectura: se completan solicitud/reset de acceso y un Route Handler del propio usuario. Código/diagnóstico anteriores en QRIH_AUDIT.md. No petición de correo ni cambio de contraseña remoto ejecutados por agente; sin lectura de enlaces/credenciales/cookies/usuarios reales.

## Flujo y trazabilidad

1. app/login/page.tsx → enlace Olvidé mi contraseña.
2. app/recuperar-contrasena/page.tsx → email explícito, guard ref de doble submit/60 s UI. lib/password-recovery.ts → resetPasswordForEmail/publishable, redirectTo exacto /auth/callback. Respuesta no enumeradora; fallo de cuota/disponibilidad sin revelar errores privados.
3. app/auth/callback/route.ts → code + sb_flow_id válido (SDK instalado soporta PKCE aislado); intercambio con verifier en cookies del mismo navegador. Evento público PASSWORD_RECOVERY, no query type/next ni campo interno SDK. Registros normales siguen ensureOwnProfile→Publicar; recovery no accede/escribe profiles.
4. Cookie qrih-recovery HttpOnly/Lax/Secure en HTTPS, 600 s, timestamp y hash de token+usuario; no token/UUID en claro. **Marca de flujo/UX, no autorización ni cookie firmada**; toda operación vuelve a validar token candidato getSession mediante getUser(token). Otra sesión/token/usuario falla; expiración o refresh que cambie token requiere otro enlace.
5. app/restablecer-contrasena/page.tsx force-dynamic/metadata referrer no-referrer → correo de cuenta validada y ResetPasswordForm; sin enlace/sesión/marca válida no hay formulario. Cliente no recibe tokens del handler ni genera firmas/cambios de rol.
6. POST app/api/auth/restablecer/route.ts → Origin obligatorio/canónico; JSON 4 KiB; password y confirmación 8–128, sin trim del secreto. updateUser({password}) sólo con cliente del actor, no service_role ni ID/email/metadata elegibles. Retirar marca tras éxito; signOut global. Logout fallido no falsea fallo de password; resultado advierte limpieza incompleta. UI borra campos y tras éxito navega a Login con aviso.

No new env/dependencias/migraciones/RLS/buckets/template/Site URL/allowlist/Supabase config/Netlify config/producción. Canonical origin y callback ya existentes reutilizados. Guía Supabase/changelog consultados: [reset](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail), [SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [sesiones](https://supabase.com/docs/guides/auth/sessions). Sin opciones de sesiones Pro ni plan contratado.

## Verificaciones locales comprobadas

| Caso | Evidencia |
|---|---|
| Unitarias completas | 37 PASS; 8 nuevas en tests/password-recovery.test.mjs. |
| SDK real instalado, sin red Auth | createBrowserClient + createServerClient, jar de cookies/challenge PKCE, PASSWORD_RECOVERY, callback y update/logout; fetch simulado, no correo. |
| Callback registro | auth-profile.test.mjs mantiene normal/error; type=recovery arbitrario no concede marca ni cambia destino de signup. |
| Binding/session/expire | Marker nulo/malformado/futuro/600 s, token o usuario distinto/anon/no confirmado/Auth error rechazados. getSession no decide identidad. |
| POST inválido | Origin ausente/cruzado 403, sin marca 401, JSON/cuerpo/contraseña inválidos 400; cero update en fixture. |
| POST válido | Sólo password al SDK aun con campos role/id/email extra; logout global/retiro cookie; errores privados no expuestos ni éxito falso. |
| Login/recovery públicos | Pantallas locales verificadas en navegador integrado; no se introdujo ni envió email/contraseña. Reset sin autorización muestra aviso, no formulario. |
| SQL aisladas | 30 PASS sobre PGlite, no migraciones/remoto. |
| HTTP local sin sesión | 20 PASS; 15 anteriores + 2 GET nuevas + 3 POST inválidos; no writes válidos ni sesión real. |
| Cache/referrer | Callback/API private,no-store y no-referrer; reset SSR private,no-cache,no-store en HTTP local, metadata no-referrer. Recovery/login estáticos no contienen identidad ni tokens. |
| Lint/tipos/build | PASS con variables públicas staging y wrapper que quita clave privada del compilador. |
| Pre-Git/bundle | Índice 176 archivos/0 hallazgos de secretos; 28 JS cliente/0 indicadores de clave privada. Detector señaló primero una URL con credenciales ficticias del fixture; origen negativo construido como URL sintética, sin excepción ni detector desactivado. |

Prueba inicial del SDK sintético falló por no contemplar code_challenge/code_challenge_method null que agrega el SDK a updateUser; fixture ajustado al transporte real, no relajación de handler. Tipos motivaron usar evento público en lugar de redirectType interno. Smoke inicial 127.0.0.1 recibió 403 porque Next representa Request.url como localhost; fixture usa localhost sin relajar origen. Estos ensayos intermedios no son fallos remotos ni nuevas mutaciones.

## Límites y matriz pendiente después del despliegue

No valida aún plantilla/allowlist recovery efectivas ni SMTP de la cuenta real; SDK simulado no acredita Supabase remoto. Un correo Dashboard previo no tiene necesariamente el verifier de una solicitud iniciada por QRIH: solicitar uno nuevo desde la app después de READY y abrirlo en el mismo navegador/perfil. No pedir enlaces/códigos/contraseña en chat; el usuario realiza entrada/confirmación/envío de su nueva contraseña.

| Caso real pendiente | Resultado esperado |
|---|---|
| develop exacto publicado | Enlace Login/solicitud/new routes visibles, 20 HTTP sin sesión PASS sobre deployment exacto. |
| Solicitud válida/desconocida | Mensaje no enumerador; correo llega si corresponde, sin bucles ni bypass de cuotas. |
| Email→callback→reset | Formulario de cuenta correcta; sin inicio/Publicar omitiendo el cambio. |
| Cambio y logout | Nueva contraseña funciona; anterior rechazada. Verificar cierre de sesiones sin asumir invalidación instantánea de JWT. |
| Perfil/roles/propiedad | Mismos usuarios/roles/perfiles, propietario/draft/portada/siete fotos y datos conservados. |
| Vencido/usado/alterado/otro navegador | Rechazo seguro/mensaje y solicitud nueva; no bypass por verifier ausente. |
| Sesión anterior de otra cuenta | No cambia inadvertidamente esa cuenta, UI muestra cuenta validada. |
| Ventana 600 s/token refrescado | Marca vencida/otro token no permite handler; solicitud nueva disponible. |
| Signup y login normales | Regresión funcional normal/admin/publisher comprobada sin interferencia de recovery. |
| Red/doble submit/fortaleza/same-password | Sin éxito falso, no secreto en logs; error/reconciliación de resultado claros. |
| Producción | Sin cambios hasta GO/corte explícito; local/staging no equivale a cierre en actual. |

No garantía de idempotencia server-side del password update/logout: guard doble submit es UI; no hay transacción entre Auth y logout. Marca no es permiso de administración ni puede cambiar otra identidad sin su sesión validada. Logout global revoca refresh según proveedor, JWT previos pueden persistir hasta expiry; sesión real pendiente de comprobar, sin afirmación de revocación inmediata.
