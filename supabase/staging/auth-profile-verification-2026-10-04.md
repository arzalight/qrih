# AUD-024 — recuperación segura del perfil de alta

## Corte de validación 2026-10-04 local (2026-10-05 UTC)

**ALTO / CORREGIDO — FLUJO NORMAL DE ALTA/CALLBACK Y RECUPERACIÓN/LOGIN REPETIDO VALIDADOS EN STAGING.** Usuario confirma que el enlace llevó directamente a Publicar, sin iniciar sesión, y que ve sus datos en la nueva sesión. Nueva Auth confirmada y su perfil propio/defaults seguros comprobados abajo. No GO ni cierre de SMTP/negativos avanzados/corte del entorno actual. Deployment `6ac31d76c0cc5c000829ea5b`, commit exacto `5fad2925a39034a12aa15b779be5f23d408337b0`, develop, publicado 2026-10-05 03:46:29.422 UTC (2026-10-04 local). Free/recargas/overages off/logs privados comprobados anteriormente, no consultados de nuevo aquí.

## Alta nueva y callback normal — resultado vigente

Usuario informa que los datos se conservan en la nueva sesión y aclara explícitamente que **el correo llevó directamente a Publicar, sin iniciar sesión**. Consultas de staging sólo de agregados, completadas antes de 2026-10-05 04:23:59 UTC (2026-10-04 local): **3 Auth, 3 confirmadas, 2 perfiles, 2 cuentas confirmadas con perfil, 0 admin, 0 propiedades**. Frente al corte anterior hay 1 Auth nueva y 1 perfil nuevo; la consulta correlacionada confirma que esa nueva Auth confirmada tiene exactamente su perfil propio y nombre coincidente con el registro. Ambos perfiles conservan defaults seguros: publisher/trial/active/no-verificado/publications_enabled true, sin campos gestionados de suspensión/locks asignados.

Esto acredita el flujo normal **registro → correo de confirmación → callback → sesión → perfil**, sin rescate por login, además de la recuperación y repetición probadas antes. No acredita cuotas/fiabilidad SMTP general, tiempos/spam, todos los proveedores/dispositivos, comparación íntegra de datos de otras cuentas ni causa raíz histórica del primer callback fallido. Las 3 cuentas y 2 perfiles permanecen; el agente no creó/confirmó/editó/borró ninguno administrativamente ni leyó credenciales, enlaces/códigos, JWT o PII. No nuevas altas/envíos por el agente, cambios funcionales, RLS/Storage/migraciones/SMTP o producción. Sólo documentación local; no nuevo deploy por evidencia.

**AUD-024: corregido y validado para el flujo normal/recuperación en staging; validación en entorno actual aún pendiente.** AUD-001 redirección/confirmación normal validada aquí; no cerrar en actual. AUD-023 entrega/confirmación de ensayo comprobadas, aptitud/cuotas aún pendientes. Siguiente: un borrador privado claramente identificado como prueba, upload/portada/galería/Mis propiedades en UI, sin envío a revisión ni publicación. Suites mutantes antiguas siguen bloqueadas: sólo admiten una cuenta, ahora hay tres; no ampliar el guard ni ejecutar limpieza sobre estas cuentas.

## Logout/login adicional — evidencia anterior

Usuario responde «listo» al ensayo de cerrar sesión y volver a entrar con la misma cuenta. Consulta sólo de agregados, completada antes de 2026-10-05 04:07:32 UTC (2026-10-04 local): **2 Auth, 2 confirmadas, 1 perfil, 1 confirmada con perfil, 0 admin, 0 propiedades**. El perfil conserva los defaults seguros descritos abajo y full_name coincide con la metadata del registro. Hay **1 perfil creado entre deployment y primer corte 04:01:18 UTC, 0 creados después**: no duplicación ni recreación observadas en este recorrido.

Esta evidencia acredita idempotencia básica del login repetido (fila única y permisos seguros), no concurrencia HTTP real ni comparación íntegra de todos los campos de perfil/otra cuenta. No se leyeron credenciales, cookies ni tokens; el logout se acredita por el reporte del usuario, no por una prueba de revocación de JWT. No cambios funcionales ni intervención administrativa. Próximo ensayo: una sola alta nueva con correo distinto bajo control del usuario, confirmar en el mismo navegador y comprobar callback → sesión → perfil sin recurrir al login de recuperación. Preservar ambas cuentas y el perfil actuales; sin publicar todavía.

## Primer login real — evidencia anterior

Usuario informa «sí aparecen mis datos» en Mi perfil después del login indicado. Consulta privilegiada exclusivamente de agregados, completada antes de 2026-10-05 04:01:18 UTC (2026-10-04 local): **2 Auth, 2 confirmadas, 1 perfil, 1 cuenta confirmada con perfil, 0 perfiles admin, 0 propiedades**. El único perfil fue creado después de publicar `5fad292`; full_name coincide con la metadata del registro, sin retornar nombre/email/teléfono/UUID al informe.

**Defaults seguros comprobados en esa fila:** role publisher, plan trial, account_status active, is_verified false, publications_enabled true; trial_ends_at, campos de suspensión y locks de identidad NULL. El paso de 0 a 1 perfiles y la confirmación visual del usuario acreditan recuperación real y lectura de sus datos. No atribuir éxito al callback de correo original, no afirmar preservación completa de la otra cuenta sólo con estos conteos ni idempotencia real antes de repetir login. La segunda cuenta sigue sin perfil; no crearle uno manualmente.

No hubo inserciones/ediciones administrativas, borrados, correos nuevos, captura de credenciales/sesiones ni cambio funcional por el agente en esta revisión. Sólo documentación local. Próximo paso: usuario cierra sesión y entra nuevamente con la misma cuenta; comprobar que sigue un único perfil propio con permisos normales y datos visibles. No publicar ni cambiar datos de perfil durante este ensayo.

## Verificación remota posterior al push

- 15/15 HTTP sin sesión PASS sobre el sitio canónico con ese deployment publicado. Sin altas/envíos válidos; no suites mutantes.
- Callback sin código: 307 exactamente al login canónico con error=confirmation, Cache-Control `private,no-store`, sin emisión de cookie de sesión. No intercambio de código ni creación de perfil.
- Navegador: login?error=profile muestra formulario y aviso de recuperación después de hidratar JavaScript. Comprobar ese texto en HTML crudo no acreditó el aviso (pantalla CSR); se verificó en UI, sin interpretar aquella aserción como fallo funcional ni ocultarla.
- Consulta de staging sólo lectura previa al login: 2 Auth, 2 confirmadas, 0 perfiles/confirmadas con perfil/admins/propiedades. No se insertó perfil manualmente ni se modificaron cuentas. La rutina debe actuar únicamente cuando el usuario vuelva a iniciar sesión.
- Login preparado para intervención del usuario, sin leer/escribir contraseña, cookies, enlaces de correo ni JWT. No se validó todavía recuperación real, perfil SSR, logout/login, preservación de campos en esta cuenta ni callback de alta nueva.
- Documentación posterior al deployment queda local; no disparar otro build sólo para esta evidencia. Producción/main, Supabase/RLS/Storage/migraciones/SMTP intactos.

## Evidencia del fallo

Usuario recibió correo, confirmó y llegó por login a Publicar. Consulta privilegiada sólo lectura: 2 Auth, 2 confirmadas, 0 perfiles, 0 propiedades. Repetida durante esta corrección, mismos conteos. No se insertó perfil manualmente, confirmó administrativamente, borró cuenta ni publicó propiedad. La interrupción original del callback sigue sin rama identificada; no atribuirla al usuario, PKCE, SMTP o Netlify sin nueva evidencia.

## Corrección acotada autorizada

- `lib/auth-profile.ts`: `getUser()` valida la sesión y correo confirmado; obtiene perfil propio y sólo si falta hace INSERT de id/full_name/phone/company_name/user_type. Identidad de Auth, metadata sólo editable, whitelist y límites. Permisos/defaults gestionados exclusivamente por BD. Nunca cliente privilegiado, upsert, UPDATE o borrado. Rechaza metadata sin nombre válido y sesiones anónimas/no confirmadas.
- Callback, login y rama de registro con sesión usan esa misma rutina. Perfil previo, incluso admin/suspendido, se conserva. Un 23505 sólo continúa si se puede leer/verificar el perfil propio; otros errores fallan cerrados.
- Login no redirige hasta completar perfil; evita envíos repetidos mientras espera. Admin suspendido no se envía al panel admin; las restricciones existentes siguen vigentes.
- Publicar no muestra formulario si falla el lookup o falta perfil; Perfil no presenta formularios con datos indefinidos. Ambos enlazan a login para recuperación, sin mutación desde el render SSR de Perfil.
- Callback utiliza el origen canónico validado existente de AUD-022 (SITE_ID/URL en Netlify, Request.url fuera). No confía en Host/forwarded/next arbitrario. Cache-Control privado/no-store y diagnóstico sólo de etapas constantes. Esto endurece compatibilidad de redirecciones; no demuestra la causa del fallo original.
- Sin dependencias, arquitectura nueva, migraciones, RLS, Storage, SMTP o cambios en producción. Changelog y docs Supabase revisados; cambios recientes de templates Free/default SMTP no aplican a la integración custom SMTP actual. [Guía SSR](https://supabase.com/docs/guides/auth/server-side/advanced-guide), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow).

## Verificación ejecutada

| Prueba | Resultado y límite |
|---|---|
| `npm test` | 26/26 PASS; 9 pruebas nuevas helper/ruta callback, mocks sintéticos. |
| Identidad/metadata manipulada | Sólo identidad de getUser, no permisos de metadata; probado con mock. |
| Perfil publisher/admin activo/suspendido existente | Cero INSERT/UPDATE, mismo perfil; mock. |
| Sesión ausente/errónea/anónima/no confirmada | Sin lectura/escritura; mock. |
| Lookup/INSERT/verificación fallidos, conflicto ajeno | No éxito; mock. |
| Dos inicializaciones/idempotencia | Fila única y relectura tras conflicto; mock, no HTTP Auth concurrente. |
| Ruta callback real importada | Código ausente/error de intercambio/fallo de perfil/config inválida: denegación; éxito sintético: Publicar; origen canónico/cache/logs seguros. No entrega de correo real. |
| `test:rls` en PostgreSQL aislado | 30/30 PASS; baseline+044–049, nueva regresión INSERT propio con defaults publisher/trial/active/no-verificado; duplicado/ajeno/escalamiento rechazados. Rollback y baseline vacío. No migraciones remotas. |
| Lint/tipos | PASS. |
| Build producción local | PASS, variables públicas del staging, sin clave privilegiada en subproceso build. |
| Audit sin dev | 0 vulnerabilidades reportadas. |
| Bundle cliente | 27 archivos estáticos examinados, sin marcador de clave privada, sb_secret ni JWT service_role detectados. No sustituye el escaneo de Netlify. |
| Humo HTTP local | 15/15 PASS sin sesión; no altas válidas. |
| Callback HTTP local sin código | 307 a login?error=confirmation, Cache-Control private/no-store; no intercambio/alta. |
| UI local login?error=profile | Aviso de recuperación visible; no credenciales introducidas, no cuenta autenticada. |

## Pendiente después del deployment exacto ya publicado

1. Entrega por develop, READY exacto, Free, humo y callback denegado completados arriba. No repetir push/deploy sólo por este registro documental.
2. Recuperación/visualización y logout/login adicional completados; perfil único anterior al primer corte y defaults seguros comprobados arriba. Resto de UI Publicar/edición pendiente; no nuevas repeticiones de login por este resultado, sin inserción privilegiada ni publicación todavía.
3. Alta nueva y callback sin rescate por login completados arriba. No repetir registro por este resultado ni reutilizar enlace consumido. Negativos/casos límite y causa histórica no acreditados; si reaparece fallo, usar sólo logs de etapa sin secretos.
4. Completar UI de borrador/upload/portada/galería/edición y matriz de sesión/error/suspensión en staging con datos consentidos. Preservar las 3 cuentas y 2 perfiles actuales; suites mutantes previas sólo admiten una cuenta: **no ejecutarlas ni ampliar ese guard como parte de este cambio**. Sin revisión/publicación hasta completar este ensayo.
5. AUD-023 entrega/cuotas/fiabilidad y todos los restantes bloqueos de GO siguen pendientes. Sin producción/main hasta GO explícito.
