# Sprint 1 — autorización y validación STAGING / 26oct2026

Autorización adicional explícita:usuario confirma crear commit del Sprint1,integrarlo en develop y subir a GitHub para desplegar sólo STAGING,sin main/producción. El primer intento fue rechazado por el control de seguridad antes de ejecutar Git;no commit/push/build en ese intento.

Usuario respondió «sí» a desplegar sólo STAGING y validar con cuentas/propiedades sintéticas. Producción/main,propiedades existentes,roles,RLS y configuración Supabase fuera de alcance. No migraciones previstas. No aceptación legal automática ni asignación de roladmin. Cuentas nuevas de prueba serán publicadores con defaults existentes,no usuarios reales.

Preflight:257tests,lint/tipos/build/preflight local PASS;110PGlite y32HTTP locales documentadas. Nueva pasada antes de publicar sin cambios de código. Netlify API confirma sitio qrih-staging,repoarzalight/qrih,develop,Free,sin recargas/sobrecostos,builds detenidos y0activos. Saldo observado212.1créditos. Una solicitud Gitbuild,sin reintentos inciertos,restaurando stop_builds inmediatamente.

Base develop8f8871f y STAGING124958b;origin/main55b7737sin cambios. Commit de Sprint1 en rama independiente e integración fast-forward en develop,no forcepush.

## Resultado publicado y comprobado

- Código: `41061a0c8fb81e7f98d63450f0d911fb19233c63`, integrado en `develop` y confirmado como commit publicado por Netlify.
- Sitio: https://qrih-staging.netlify.app. Deploy `6adff9c952c0d443c02f7840`, build `6adff9c952c0d443c02f783e`, estado READY. Publicado el 26oct2026 a las 19:10:17 CDMX (27oct01:10:17UTC).
- Un único build solicitado. Plan Free, recargas automáticas y sobrecostos desactivados; builds automáticos detenidos nuevamente y cero builds activos al comprobar. Saldo previo observado en interfaz:212 créditos; no se afirma consumo cero.
- Validaciones locales previas:257 pruebas de aplicación,110 de PostgreSQL aislado,32 HTTP,lint/tipos/build/preflight PASS. Las **32 HTTP se repitieron contra el dominio STAGING y pasaron**.
- Dos cuentas sintéticas nuevas con rol publisher/active por defecto, sin asignar admin ni aceptar casillas legales. Una propiedad fuente borrador y una copia, ambas rotuladas PRUEBA SPRINT1 / NO COMERCIAL; ninguna publicada.
- Flujo en navegador:Duplicar → editor del ID nuevo → Guardar como borrador → panel → reabrir editor → cambiar título de la copia → Enviar a revisión → panel con copia Pendiente y original Borrador. Portadas cargadas; enlace de la tarjeta pendiente abre su vista privada. La copia usa un objeto de portada distinto del original.
- Integridad:huella SHA256 de las **24 propiedades existentes idéntica antes/después**, y propiedad fuente sintética intacta. No migraciones, SQL remoto, RLS, roles, configuración Supabase, main ni producción modificados.
- Avisos:8 propios sin leer frente a5 recientes; clic individual8→7 y marcar todas7→0. CuentaB conserva su aviso sin leer(1). Intento de marcar el avisoB con sesiónA devuelve0 filas. Ningún aviso de usuarios reales intervenido.
- Acceso:otra cuenta no lee el borrador y recibe404 en vista privada; propietario200; detalle/PDF público del borrador404. Publisher sin enlace Admin en perfil y ruta administrativa con acceso restringido. No se elevó ningún rol para probar el caso positivo.
- Móvil remoto:ancho real375px,documento375px sin desbordamiento,ambas portadas sintéticas cargadas. Captura revisada:`../evidence/sprint1-staging-mobile-20261026.png` (fuera del repo). Sesión de navegador cerrada y emulación restablecida.

## Datos sintéticos retenidos y límites

Fuente `c19e6da8-6a07-4ffd-a4dd-e13f172e6fd7` (draft);copia `453d8dec-299b-4d2e-98d7-461a2eb55e84` (pending). Retenidos únicamente para revisión en STAGING,junto con2 cuentas y9 avisos sintéticos;no aprobar/publicar la copia. Credenciales no incluidas en Git,documentación ni evidencias públicas;manifiesto local ignorado con permisos0600. No se ejecutó limpieza destructiva.

La inserción inicial de avisos sintéticos fue rechazada por usar un tipo no permitido. No se repitió la creación de cuentas/propiedades:se verificó cero avisos para esas cuentas y se completaron sólo los9 faltantes con tipo existente `property_contact_request`,títulos inequívocos y sin propiedad/contacto real asociado. Sin cambiar restricciones de BD.

Pendientes:no hay certificación de gestos nativos en teléfono físico(iOS/Android),ni simulación remota de caída de red durante carga. Caso positivo Admin probado localmente,pero revisión visual autenticada de Admin en STAGING pendiente de cuenta autorizada existente;no crear privilegios para ello. `covered_area` conserva su significado de superficie techada;equivalencia con almacenamiento y guardado de editor sin fotografías requieren decisión aparte. Tablero de requerimientos sigue sólo como propuesta,sin migración ni pestaña activa. No implica GO de producción ni cierre de auditorías previas ajenas al sprint.

El cierre documental se sube con `[skip netlify]`,sin solicitar otro despliegue. La versión funcional publicada continúa siendo41061a0.
