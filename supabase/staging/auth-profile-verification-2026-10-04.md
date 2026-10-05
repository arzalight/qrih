# AUD-024 — recuperación segura del perfil de alta

## Corte local 2026-10-04 (2026-10-05 UTC)

**ALTO / CORREGIDO Y VALIDADO LOCALMENTE — DEPLOYMENT Y UI AUTENTICADA EN STAGING PENDIENTES.** No es GO ni cierre de AUD-001/023. Último Git staging comprobado sigue siendo `478fda1`, deployment `6ac307ade99ce9000825a574`: no contiene esta corrección todavía.

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

## Pendiente después de push/deployment exacto

1. Publicar corrección por `develop`, comprobar commit exacto y READY en Free; repetir humo y callback denegado en deployment nuevo.
2. Usuario vuelve a login con su cuenta ya confirmada (sin compartir contraseña). Verificar creación de exactamente su perfil y defaults seguros, Publicar/Perfil funcionales, logout/login sin sobrescritura. No usar inserción privilegiada manual.
3. Ensayo acotado adicional de alta normal y confirmación en el mismo navegador; seguir logs sólo de etapa para identificar cualquier fallo de callback. No reutilizar enlace consumido ni crear bucles de envío.
4. Completar UI publicación/edición y matriz de sesión/error/suspensión en staging con datos consentidos. Preservar cuentas actuales; suites mutantes previas sólo admiten una cuenta, ahora hay dos: **no ejecutarlas ni ampliar ese guard como parte de este cambio**.
5. AUD-023 entrega/cuotas/fiabilidad y todos los restantes bloqueos de GO siguen pendientes. Sin producción/main hasta GO explícito.
