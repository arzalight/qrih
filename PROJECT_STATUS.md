## PROJECT STATUS — QRO INDUSTRIAL HUB / QRIH

## Estado maestro vigente — correcciones pre-Soft-Launch, actualizado 2026-10-04

**Git / entrega verificada:** repositorio `https://github.com/arzalight/qrih` privado, con `main` (`55b7737`) y `develop` (`ee4d465` al conectar). Netlify `qrih-staging` sigue **únicamente `develop`**, sin branch deploys adicionales ni Deploy Previews, con logs privados. Primer deployment Git `6ac2be07ce110e3b94a50a2c` READY y publicado, commit `ee4d465991a0a321ada13ff28e41993364d3253d`. 15 HTTP sin sesión pasan de nuevo; nueve chunks sin patrones de secreto/referencia al Supabase actual. Free, recargas y overages desactivados. Producción no conectada; `main` reservado hasta GO. Revisión: `docs/PRE_GITHUB_REVIEW.md`; evidencia: `supabase/staging/git-deployment-verification-2026-10-04.md`.

**Acceso Git:** subida inicial completada desde la terminal del usuario con helper oficial, sin extraer/copiar credenciales ni alterar preferencias globales. Un primer envío HTTP 400 falló; el siguiente pasó con HTTP/1.1 y búfer temporal de 8 MiB, sin causa raíz confirmada. El usuario también subió `4efa7cb`, publicado automáticamente. El agente sigue sin acceso al token del llavero. El informe ampliado de validaciones de este corte permanece local hasta su siguiente subida.

**NO-GO para abrir a usuarios reales.** Congelamiento de funcionalidades. **Supabase staging creado y activo en plan Free ($0/mes)**: QRIH Staging (`mcyxunymhuxyiwklyfpy`). Se instaló un baseline de estructura verificada y se aplicaron 044–049 sólo allí. `property-images` es privado, WebP, máximo 20 MiB; `profile-images` es público conforme al diseño existente, WebP, máximo 5 MiB. El proyecto actual (`dmtvnwsuhehxfftddsap`) conserva su esquema y bucket público; no recibió cambios.

Netlify: **qrih-staging publicado en Free**, https://qrih-staging.netlify.app (`bc0d8fd9-e9a0-4cb1-bd28-5ad053e93859`), sin tarjeta ni recargas automáticas; no afirmar saldo actual. Último deployment normal Git `6ac2c7192fc6c22b218dadef` READY, `develop@4efa7cb`. Credencial autorizada de staging protegida sólo en Netlify, sin copia local. Auth Site URL/callback exacto configurados; SMTP personalizado desactivado. Usuario tiene cuenta Resend, **sin dominio verificado/remitente configurado**; correo/confirmación externos siguen bloqueados. AUD-019 validado SQL con 049; AUD-020 corregido sin desactivar escaneo de secretos. No se contrató plan/dominio/complemento.

Esta sección es la fuente de estado vigente y reemplaza afirmaciones incompatibles del historial inferior. La autorización actual permite resolver hallazgos directamente en el workspace; las instrucciones de confirmación por cada paso inferiores corresponden al antiguo flujo de chat/copiar-pegar.

**Validación ampliada vigente:** **42 checks autenticados PASS** (contactos/autorización/notificaciones, demanda/interés/oportunidad, avatar HTTP, edición/borrado, concurrencia acotada, PDF y expiración real de firma 300 s). **Excepción bloqueante AUD-022:** primer upload de propiedad antes de crear borrador devolvió HTTP 400 en dos ensayos. Para probar los demás flujos se preparó una imagen directamente en Storage; eso no valida el upload. Los 24 PASS anteriores con siete fotos se conservan como evidencia histórica, no como cierre de esta regresión. Limpieza independiente: cero cuentas, propiedades, demandas, contactos, notificaciones, procedencias y objetos de ambos buckets. Bitácora sintética y marcas privadas preservadas. Informe: `supabase/staging/flows-verification-2026-10-04.md`. Sin cambios funcionales/RLS/migraciones; sólo pruebas, corrección de preflight y documentos. Migraciones 044–049 sólo en staging.

| Área / IDs | Estado comprobado | Evidencia / limitación |
|---|---|---|
| Auth AUTH-001/003/004 | CÓDIGO ADAPTADO; SMTP/CALLBACK REAL PENDIENTES | Site URL/callback exactos; sesión SSR probada con cuentas sintéticas auto-confirmadas. Sin dominio Resend ni SMTP habilitado; AUD-023. No acredita correo/PKCE real. |
| Roles/perfiles PROF-001/002 | VALIDADO SQL Y PARCIALMENTE CON JWT REAL EN STAGING | Protección INSERT/UPDATE de rol/plan/suspensión/identidad; admin activo; 046/048/049. Aislamiento de imágenes y suspensión probados con JWT; resto de UI/corte actual pendiente. |
| Inventario/ficha/catálogo PROP-001 | VALIDADO PARCIAL EN STAGING | Ficha e imagen firmada cargan a 375/1440 px sin overflow; dirección oculta. RPC catálogo sin teléfono/WhatsApp. Fixture preparado en Storage; corte real pendiente. |
| Crear PROP-002 | BLOQUEADO EN STAGING — ALTO | Primer upload HTTP de propiedad 400 antes de borrador; AUD-022 confirmado, causa no identificada. No corregido. |
| Editar/borrar/moderar PROP-003/004/005 | VALIDADO PARCIAL SQL/HTTP EN STAGING | HTTP edición/borrado propios, ajenos denegados, pending no editable; RPC admin y doble acción; carrera de versión: una confirma, otra falla. UI/red/corte real pendientes. |
| Contactos CONT-001 | VALIDADO HTTP/RPC EN STAGING; UI/CORTE REAL PENDIENTES | Contacto concurrente deduplicado; autorización sólo dueño; contacto privado hasta aprobar; aviso único y suspensión con JWT previo. |
| Requerimientos/interés/oportunidad DEM-001 | VALIDADO HTTP EN STAGING; UI/CORTE REAL PENDIENTES | Identidad de sesión, aislamiento de demandas, interés único, oportunidad sólo propia y 200/409 concurrentes con un aviso. |
| Imágenes IMG-001/002 — AUD-002 | ALTO / PARCIAL EN STAGING; NO CERRADO EN ACTUAL | Firma 300 s expira con objeto existente y nueva firma sirve; visor móvil abre/cierra. Upload nuevo de propiedad bloqueado AUD-022; TTL 600/900 s, siete fotos en corte vigente y UI autenticada pendientes. |
| Avatar PROF-003 — AUD-005 | VALIDADO HTTP EN STAGING; CORTE REAL PENDIENTE | PNG → WebP, nueva ruta propia, limpieza anterior, avatar ajeno y corrupto rechazados. Público por diseño. |
| PDF PDF-001 | VALIDADO EN STAGING; CORTE REAL PENDIENTE | Netlify HTTP 200 con siete WebP distintos convertidos e incrustados. Casos límite/volumen/tamaños máximos pendientes. |
| Build / tooling OPS-001/003 | VALIDADO CON COBERTURA PARCIAL | Lint/tipos, 14 unit, 29 Node SQL (27 subcasos + padre + baseline), 15 HTTP sin sesión y audit completo 0 vulnerabilidades. AUD-021 corregido en preflight, probado local/remoto. |
| Producción OPS-002 | STAGING FREE PUBLICADO; PILOTO NO AUTORIZADO | Git normal restaurado a develop@4efa7cb; sin flags mutantes persistentes. AUD-022/023 y cierre integral/corte actual pendientes. |
| Integridad / recuperación | PREFLIGHT Y FIXTURE PARCIALES; BACKUP ÍNTEGRO PENDIENTE | 15 tablas con RLS, sin duplicados; recuperación de título/galería/bytes sintéticos con hash. No acredita backup íntegro de BD/Auth/Storage ni grafo completo. |
| Responsive / legal / monitorización | RESPONSIVE PARCIAL; EXTERNO PENDIENTE | Navegador integrado 375/1440 px, menú/galería/form vacío; no sustituye móvil real Chrome/Safari ni UI autenticada. Textos legales y recuperación completos pendientes. |

Mantener originales de hasta 20 MB para fotos, máximo siete y WebP. Cada foto optimizada viaja por separado y no supera 3 MB para respetar payload de Netlify. Firmas 600 s tarjetas, 900 s galerías/admin, 300 s PDF; **no se guardan firmas en BD**. Una firma previa puede seguir usable hasta vencer; privacidad no equivale a revocación de copias descargadas.

Cambios de arquitectura acotados: se mantiene Next/Supabase; se traslada la validación real de archivos al servidor y se añade un cliente privilegiado server-only tras autorización con la identidad original. Credencial nunca pública/commit/log. Sin valor real en .env ni documentos.

Los IDs y severidades se mantienen en QRIH_FUNCTIONAL_INDEX.md / QRIH_AUDIT.md. NEXT_STEPS.md contiene sólo acciones posteriores a esta auditoría y al Soft Launch.

## 1. Objetivo del proyecto

QRO INDUSTRIAL HUB (QRIH) es un portal inmobiliario especializado en propiedades industriales del estado de Querétaro.

El portal permite:

- Mostrar inventario industrial.
- Filtrar propiedades.
- Publicar propiedades mediante usuarios autenticados.
- Enviar propiedades a revisión.
- Moderar propiedades como administrador.
- Rechazar, publicar y retirar propiedades.
- Permitir que el propietario edite una propiedad rechazada y la vuelva a enviar a revisión.
- Registrar solicitudes de contacto.
- Registrar visualizaciones.
- Mostrar estadísticas al propietario.
- Manejar zonas industriales mediante una estructura jerárquica centralizada.

La prioridad actual es continuar construyendo el portal de manera ordenada, evitando inconsistencias en los datos y manteniendo una arquitectura sencilla.

---

## 2. Perfil del usuario

El usuario es principiante en programación.

Reglas importantes para continuar:

- Dar instrucciones claras y copy-paste-ready.
- Trabajar UN PASO A LA VEZ.
- No avanzar varios pasos de golpe.
- Después de cada modificación, pedir al usuario que confirme el resultado.
- No asumir que una instalación, archivo o cambio existe.
- Cuando sea necesario modificar un archivo, indicar exactamente dónde hacerlo.
- Preferir cambios pequeños y comprobables.
- Evitar cambiar arquitectura o tecnologías sin explicarlo previamente.
- No volver a cuestionar decisiones que ya fueron aprobadas.
- Si existe una duda técnica, comprobar primero antes de modificar otras partes.

El usuario trabaja principalmente desde Terminal y no usa VS Code para este proyecto.

---

## 3. Stack actual

- Next.js 16.3.6 (parche de seguridad; validado localmente)
- Turbopack
- Supabase
- PostgreSQL mediante Supabase
- TypeScript / TSX
- CSS
- Node / npm
- Playwright no forma parte de este proyecto; pertenece a otro proyecto del usuario.

Servidor local:

http://localhost:3000

Comando habitual:

npm run dev

El proyecto ha conseguido ejecutar:

npm run build

sin errores después de los cambios recientes.

---

## 4. Ubicación del proyecto

/Users/fabianlira/Documents/Codex/2026-09-18/perfecto-con-esas-decisiones-el-modelo

---

## 5. Estructura relevante

Archivos y carpetas importantes:

- app/
- app/api/
- app/admin/
- app/inventario/
- app/mis-propiedades/
- app/publicar/
- app/privacidad/
- app/terminos/
- components/
- lib/
- supabase/
- .env
- .env.example
- package.json
- package-lock.json
- PROJECT_STATUS.md
- NEXT_STEPS.md

---

# 6. Supabase

## profiles

Campos relevantes:

- id
- full_name
- phone
- company_name
- website
- role
- plan
- trial_ends_at
- created_at

Roles:

- publisher
- editor
- admin

Planes:

- trial
- basic
- intermediate
- advanced

---

## properties

Campos relevantes:

- id
- owner_id
- slug
- title
- operation
- status
- zone_general
- zone
- address
- location_visibility
- price_display
- price_plus_vat
- price_plus_maintenance
- negotiable
- total_area
- covered_area
- exterior_area
- max_height
- offices_area
- parking
- docks
- description
- share_commission
- main_image
- featured
- featured_priority
- publication_authorized_at
- terms_accepted_at
- last_verified_at
- verification_due_at
- rejection_reason
- created_at
- updated_at

Operation:

- Renta
- Venta

Status:

- draft
- pending
- published
- paused
- rejected
- expired
- pending_update

IMPORTANTE:

Se agregó:

zone_general text

Los registros antiguos de prueba pueden tener zone_general NULL. El usuario indicó que esos registros de prueba no son relevantes y no es necesario migrarlos.

Las propiedades nuevas sí deben guardar:

- zone_general
- zone

---

## property_images

Campos:

- id
- property_id
- storage_path
- category
- position
- created_at

---

## property_contacts

Campos:

- id
- property_id
- name
- phone
- email
- company
- message
- source
- utm
- created_at

---

## demand_requests

Campos:

- id
- name
- phone
- email
- company
- operation
- zone
- area_requirement
- budget
- notes
- status
- created_at

---

## demand_requests

Se utiliza para solicitudes de personas que buscan una bodega.

---

## property_views

Existe una tabla para registrar visualizaciones.

Políticas relevantes:

- El público puede insertar una visualización.
- El propietario autenticado puede leer las visualizaciones de sus propias propiedades.

---

## audit_logs

Registra acciones administrativas.

Campos:

- id
- actor_id
- entity_type
- entity_id
- action
- metadata
- created_at

---

# 7. RLS importante

property_views:

El público puede registrar visualizaciones.

Los propietarios pueden consultar visualizaciones únicamente de sus propias propiedades.

property_contacts:

Los propietarios pueden consultar solicitudes únicamente de sus propias propiedades.

---

# 8. Cliente Supabase

lib/supabase.ts actualmente utiliza:

createBrowserClient

Variables:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

Si alguna variable no existe, createClient() devuelve null.

---

# 9. Sistema de zonas

Esta decisión YA ESTÁ APROBADA.

No cambiar la estructura sin consultar al usuario.

El sistema tiene dos niveles.

## Nivel 1 — Zona general

- Querétaro Norte
- Querétaro Centro/Poniente
- Querétaro Sur
- El Marqués
- Corregidora
- Colón
- Pedro Escobedo
- San Juan del Río
- Huimilpan
- Tequisquiapan

## Nivel 2 — Zona industrial

### Querétaro Norte

- Jurica
- Santa Rosa Jáuregui
- Parque Industrial Querétaro (PIQ)
- Benito Juárez
- La Montaña
- San Pedrito Peñuelas

### Querétaro Centro/Poniente

- 5 de Febrero
- Santa María Magdalena

### Querétaro Sur

- Bernardo Quintana

### El Marqués

- Conín
- El Marqués
- El Colorado
- Aeropuerto
- Finsa
- Parque Tecnológico Innovación Querétaro
- Parque Aeroespacial Querétaro

### Corregidora

- Balvanera
- Centro Corregidora
- Los Cues

### Colón

- Colón

### Pedro Escobedo

- Pedro Escobedo

### San Juan del Río

- San Juan del Río

### Huimilpan

- Huimilpan

### Tequisquiapan

- Tequisquiapan

---

# 10. lib/zonas.ts

Actualmente contiene:

ZONAS_GENERALES

y

ZONAS_INDUSTRIALES_POR_ZONA

La estructura actual es:

export const ZONAS_GENERALES = [
  'Querétaro Norte',
  'Querétaro Centro/Poniente',
  'Querétaro Sur',
  'El Marqués',
  'Corregidora',
  'Colón',
  'Pedro Escobedo',
  'San Juan del Río',
  'Huimilpan',
  'Tequisquiapan',
]

export const ZONAS_INDUSTRIALES_POR_ZONA: Record<string, string[]> = {
  'Querétaro Norte': [
    'Jurica',
    'Santa Rosa Jáuregui',
    'Parque Industrial Querétaro (PIQ)',
    'Benito Juárez',
    'La Montaña',
    'San Pedrito Peñuelas',
  ],

  'Querétaro Centro/Poniente': [
    '5 de Febrero',
    'Santa María Magdalena',
    'Bernardo Quintana',
  ],

  'El Marqués': [
    'Conín',
    'El Marqués',
    'El Colorado',
    'Aeropuerto',
    'Finsa',
    'Parque Tecnológico Innovación Querétaro',
    'Parque Aeroespacial Querétaro',
  ],

  Corregidora: [
    'Balvanera',
    'Corregidora',
    'Los Cues',
  ],

  Colón: [
    'Colón',
  ],

  'Pedro Escobedo': [
    'Pedro Escobedo',
  ],

  'San Juan del Río': [
    'San Juan del Río',
  ],

  Huimilpan: [
    'Huimilpan',
  ],

  Tequisquiapan: [
    'Tequisquiapan',
  ],
}

---

# 11. Publicación de propiedades

Archivo:

app/publicar/page.tsx

Actualmente:

- Requiere autenticación.
- Redirige a /login si no existe usuario.
- Solicita datos de propiedad.
- Tiene selector de zona general.
- Tiene selector de zona industrial dependiente de la zona general.
- Guarda zone_general.
- Guarda zone.
- Guarda dirección cuando corresponde.
- Permite indicar si se muestra zona o dirección.
- Permite cargar fotografía principal.
- Genera slug único.
- Guarda la propiedad con status pending.
- Guarda autorización de publicación.
- Guarda aceptación de términos.
- Muestra modal de éxito.
- Redirige a /mis-propiedades.

La validación actual requiere:

- title
- price
- zone_general
- zone
- total_area
- autorización de publicación
- términos aceptados

---

# 12. Edición de propiedades rechazadas

Archivo principal:

app/mis-propiedades/[id]/editar/EditarPropiedadForm.tsx

Actualmente tiene:

- selector de zona general
- selector de zona industrial
- selector de visibilidad
- importación de ZONAS_GENERALES
- importación de ZONAS_INDUSTRIALES_POR_ZONA
- estado zonaGeneral
- lectura de property.zone_general

La página:

app/mis-propiedades/[id]/editar/page.tsx

ya solicita zone_general en la consulta de Supabase.

La propiedad editada vuelve a:

status = pending

---

# 13. Endpoint de edición

Archivo:

app/api/editar-propiedad/route.ts

Actualmente debe contener:

const zoneGeneral = String(
  form.get('zone_general') || ''
).trim()

y validar:

!zoneGeneral

y actualizar:

zone_general: zoneGeneral,
zone,
location_visibility: visibility,

El endpoint:

- autentica al usuario
- verifica propietario
- solamente permite editar propiedades rejected
- conserva fotografía existente si no se sube otra
- permite subir nueva fotografía
- actualiza información
- elimina rejection_reason
- cambia status a pending
- actualiza updated_at

---

# 14. Moderación administrativa

Archivos relevantes:

app/admin/page.tsx
app/admin/[id]/page.tsx

Actualmente existe:

- publicar propiedad
- rechazar propiedad
- retirar/unpublish propiedad
- razón obligatoria para rechazo
- razón obligatoria para retirar
- registro de acciones en audit_logs
- banners de éxito después de las acciones

El flujo de moderación fue probado y funciona.

Acciones registradas:

- property_published
- property_rejected
- property_unpublished

---

# 15. Mis propiedades

Archivo:

app/mis-propiedades/page.tsx

Actualmente muestra:

- propiedades del usuario
- estado
- visualizaciones
- solicitudes
- conversión
- acciones según estado

Se probaron estadísticas.

Ejemplo observado durante pruebas:

- Visualizaciones: 7
- Solicitudes: 4
- Conversión: 57.1%

Estos números pertenecen a datos de prueba y no deben tratarse como datos reales del negocio.

---

# 16. Inventario

Archivo:

app/inventario/page.tsx

Actualmente:

- muestra únicamente properties con status published
- ordena destacadas primero
- ordena después por created_at
- filtra por operación
- filtra por zona
- filtra por rango de superficie
- muestra PropertyCard

Filtros de superficie:

- menos de 200 m²
- 200 a 500 m²
- 500 a 1,000 m²
- 1,000 a 2,000 m²
- más de 2,000 m²

Los filtros de operación y superficie fueron probados.

El filtro de zona funcionaba, pero había un problema de calidad de datos porque la zona era texto libre y podía escribirse con variantes.

Por eso se creó el sistema centralizado de zonas.

IMPORTANTE:

El inventario todavía necesita actualizarse para utilizar:

zone_general

y

zone

de acuerdo con lib/zonas.ts.

Este es el siguiente trabajo principal.

---

# 17. Header

components/Header.tsx

Actualmente incluye:

- QRO INDUSTRIAL HUB
- Inventario
- BUSCO UNA BODEGA
- Subir propiedad
- Panel

---

# 18. Footer

El footer está integrado globalmente.

Incluye enlaces a:

- Inventario
- Busco una bodega
- Publicar propiedad
- Panel
- Aviso de privacidad
- Términos y condiciones

---

# 19. Legal

Páginas:

app/privacidad/page.tsx
app/terminos/page.tsx

Actualmente son textos provisionales.

Se evitó inventar:

- razón social
- domicilio legal
- correo legal
- información jurídica no proporcionada por el usuario

Las páginas ya fueron probadas visualmente y funcionan.

---

# 20. Diseño

El proyecto utiliza una estética:

- profesional
- minimalista
- inmobiliaria
- premium
- industrial
- limpia

La intención es que el portal se perciba como una plataforma profesional especializada en bienes raíces industriales.

---

# 21. Problemas ya resueltos

Se han resuelto, entre otros:

- publicación de propiedades
- autenticación
- redirección a login
- carga de imagen
- generación de slug
- moderación
- rechazo
- republicación después de rechazo
- edición
- filtros de operación
- filtros de superficie
- visualizaciones
- solicitudes
- estadísticas
- footer
- páginas legales
- selección jerárquica de zonas
- almacenamiento de zone_general

---

# 22. Consideraciones pendientes

1. Actualizar inventario para utilizar zone_general y zone.
2. Hacer que el filtro de inventario mantenga la lógica jerárquica.
3. Evitar que vuelvan a existir zonas escritas manualmente.
4. Revisar posteriormente UX cuando se cambia una zona general después de seleccionar una zona industrial.
5. Continuar con las funcionalidades pendientes del portal sin romper las existentes.
6. Mantener build limpio después de cambios importantes.

---

# 23. Regla fundamental para futuras modificaciones

Antes de cambiar una funcionalidad:

1. Identificar el archivo exacto.
2. Revisar el código existente.
3. Hacer el cambio mínimo necesario.
4. Probar.
5. Confirmar con el usuario.
6. Solamente después continuar.

No reconstruir componentes completos si solamente se necesita cambiar unas líneas.

---

# 24. Actualización vigente — notificaciones, contacto y privacidad

## Cambios completados

- Se creó la página `/notificaciones` para consultar el historial completo.
- El Header ahora navega a requerimientos, solicitudes de la propiedad o
  notificaciones según el tipo de aviso.
- `property_contact_authorized` muestra datos del propietario únicamente
  después de comprobar una autorización aprobada del asesor.
- Se protegió en Supabase la función
  `get_property_publisher_contact`: ahora requiere una autorización con estado
  `authorized` para esa propiedad y ese asesor.
- La protección se guardó también en
  `supabase/migrations/003_protect_publisher_contact.sql`.
- `npm run build` terminó correctamente después de estos cambios.

## Auditoría de privacidad en curso

La revisión de políticas RLS detectó un riesgo crítico pendiente:

- La política `Users can update their own profile` permite actualizar el perfil
  completo. Sin una restricción adicional, un usuario podría intentar cambiar
  su propio campo `role` a `admin`.

No abrir el portal a usuarios reales hasta completar la auditoría de permisos.

La migración `004_protect_profile_roles.sql` ya fue ejecutada en Supabase. Un
perfil nuevo solo puede crearse con rol `publisher`, y una sesión autenticada
no puede cambiar el campo `role` de su propio perfil.

Comprobación realizada: una cuenta propietaria pudo cambiar y guardar la
preferencia de autoaprobación de contactos mostrando el mensaje de éxito.

La migración `005_restrict_contact_requests.sql` fue ejecutada en Supabase.
Las solicitudes de contacto ahora deben provenir de usuarios autenticados y
dirigirse a una propiedad publicada. Falta probar una solicitud válida desde
la aplicación.

Comprobación realizada: con autoaprobación activa, el asesor recibió el
contacto inmediatamente. Con autoaprobación desactivada, la solicitud quedó
pendiente y el propietario recibió el aviso para autorizarla.

Pendiente detectado: al autorizar, el asesor no recibe
`property_contact_authorized`. La ruta intenta insertar directamente en
`notifications`, pero las políticas de esa tabla solo permiten SELECT y UPDATE
al propietario de la notificación. Debe crearse una función controlada de
Supabase, igual que las otras notificaciones existentes.

La migración `006_respond_contact_authorization.sql` ya fue ejecutada en
Supabase. Reúne la respuesta del propietario y la creación de la notificación
en una sola operación segura. La aplicación compiló correctamente; falta
probar una autorización manual completa.

Comprobación realizada: la autorización manual creó correctamente la
notificación del asesor. El asesor pudo abrir `/notificaciones`, ver el
contacto autorizado y acceder a la propiedad.

La migración `007_protect_profile_managed_fields.sql` fue ejecutada en
Supabase. Protege también `plan` y `trial_ends_at` en perfiles normales y
mantiene editables los datos personales y la autoaprobación.

Comprobación realizada: una cuenta propietaria volvió a guardar correctamente
la preferencia de autoaprobación después de esta protección.

El 2026-09-29 se detectó que la migración
`008_require_authorization_response_function.sql` no coincidía con el nombre
real de la política activa, por lo que no la eliminó. Se creó la migración
`009_remove_live_contact_authorization_update_policy.sql` con el nombre exacto
`owners can update contact authorizations for own properties`. El usuario
confirmó su ejecución en Supabase el 2026-09-29 20:38 CST. Con ello, la
respuesta del propietario queda restringida a la función segura ya validada,
que actualiza el estado y crea el aviso del asesor en una sola operación.
`npm run build` terminó sin errores. Falta confirmar la ausencia de la política
mediante la consulta de auditoría de solo lectura.

Confirmación realizada el 2026-09-29 20:39 CST: la consulta de políticas
`UPDATE` para `property_contact_authorizations` devolvió cero filas. La vía
directa quedó cerrada correctamente.

El usuario confirmó la ejecución en Supabase de
`010_remove_unused_interest_update_policies.sql` el 2026-09-29 20:41 CST. La
migración elimina las políticas `UPDATE` directas de intereses de propiedades y
registros de oportunidades, que la aplicación no utiliza. `npm run build`
terminó sin errores. Falta confirmar con una consulta de solo lectura que ambas
políticas ya no aparecen activas.

Confirmación realizada el 2026-09-29 20:42 CST: la consulta de verificación
devolvió cero filas para ambas políticas `UPDATE` eliminadas por la migración
010. Las vías directas de actualización de intereses y oportunidades quedaron
cerradas correctamente.

Durante la auditoría de funciones se detectó que la función activa
`prevent_self_profile_role_change` solo protegía `role`, aunque la migración
007 también contemplaba `plan` y `trial_ends_at`. Se creó
`011_restore_profile_managed_fields_protection.sql` para restaurar los tres
campos protegidos. El usuario confirmó su ejecución en Supabase el
2026-09-29 20:47 CST y `npm run build` terminó sin errores. Falta confirmar
mediante una consulta de solo lectura que la definición activa contiene los
tres campos.

Confirmación realizada el 2026-09-29 20:49 CST: la definición activa contiene
las comprobaciones de `role`, `plan` y `trial_ends_at`. La protección de los
campos administrados del perfil quedó restaurada correctamente.

El usuario confirmó la ejecución en Supabase de las migraciones 012 y 013 el
2026-09-29 20:59 CST. `npm run build` volvió a terminar sin errores.

Actualización documental: 2026-09-29 21:10 CST. Se eliminó la sección histórica
que señalaba al inventario como siguiente paso, ya que la auditoría de permisos
es la prioridad vigente. También se eliminó la nota anterior que decía que las
migraciones 012 y 013 estaban pendientes de ejecución: ambas ya fueron
confirmadas como ejecutadas.

Confirmación realizada el 2026-09-29 21:13 CST: la consulta de solo lectura
devolvió 3 de 3 funciones esperadas y 19 de 19 políticas RLS esperadas. El
inventario versionado quedó confirmado como activo. El siguiente paso es
identificar, sin modificar datos ni permisos, si existen funciones o políticas
activas adicionales que todavía no estén representadas en las migraciones
locales.

Confirmación realizada el 2026-09-29 21:15 CST: el inventario completo mostró
6 funciones y 28 políticas RLS activas. Todas están representadas por las
migraciones locales 001 a 013: no se detectaron funciones ni políticas activas
sin versionar y no fue necesario crear una migración. El siguiente paso es
validar los accesos con cuentas de prueba por rol, empezando por Público.

Confirmación realizada el 2026-09-29 21:19 CST: como Público, sin iniciar
sesión, el inventario `/inventario` cargó correctamente y mostró 3 propiedades.
La consulta del inventario limita los resultados a `status = 'published'`.
La siguiente comprobación es abrir una ficha de esas propiedades sin sesión,
sin enviar formularios ni modificar datos.

Confirmación realizada el 2026-09-29 21:20 CST: una ficha pública de propiedad
cargó correctamente sin iniciar sesión. La siguiente y última prueba para el
rol Público es comprobar que el formulario de contacto redirija a `/login`
antes de crear una solicitud.

Confirmación realizada el 2026-09-29 21:20 CST: el envío del formulario de
contacto como Público redirigió a `/login`, por lo que no se creó una solicitud
sin autenticación. La validación del rol Público quedó completada.

Actualización documental: 2026-09-29 21:22 CST. Por decisión del usuario, las
comprobaciones visuales pendientes de Asesor, Propietario y Admin se posponen.
No se consideran aprobadas y deben realizarse antes de abrir el portal a
usuarios reales. Se retoma como siguiente trabajo funcional la revisión del
inventario para consolidar sus filtros jerárquicos de zonas.

Actualización documental: 2026-09-29 21:24 CST. El usuario cambió la prioridad
al cierre técnico del MVP: auditoría final de RLS y seguridad. Se revisarán
propiedades ajenas, requerimientos ajenos, autorizaciones de contacto ajenas,
acceso a `/admin` y manipulación directa de IDs en URLs. La revisión comienza
por el acceso a propiedades de otro usuario, sin modificar código ni permisos.

Revisión local realizada el 2026-09-29 21:24 CST: las rutas y migraciones de
`properties` restringen la lectura privada al propietario y la actualización al
administrador o al propietario de una propiedad rechazada. El inventario y las
fichas permiten leer propiedades ajenas únicamente cuando están publicadas,
que es el comportamiento previsto.

Confirmación realizada el 2026-09-29 21:26 CST: las expresiones RLS activas de
`properties` coinciden con la revisión local. Un tercero solo puede leer una
propiedad con estado `published`; no puede modificar ni eliminar una propiedad
ajena. El primer punto de la auditoría quedó cerrado. Continúa la revisión de
acceso a requerimientos ajenos.

Hallazgo de auditoría el 2026-09-29 21:26 CST: las políticas locales de
`demand_requests` limitan la lectura al dueño del requerimiento o al
administrador. Sin embargo, `app/api/registrar-oportunidad/route.ts` acepta un
`demand_request_id` sin comprobar que el usuario pueda acceder a ese
requerimiento antes de crear un registro y notificación. No se hicieron cambios;
se debe confirmar la política activa en Supabase y definir el ajuste mínimo.

Revisión local realizada el 2026-09-29 21:27 CST: las políticas y la función
`respond_property_contact_authorization` limitan la lectura de autorizaciones
al asesor correspondiente o al dueño de la propiedad. La función verifica que
el solicitante autenticado sea propietario de la propiedad vinculada antes de
actualizar una solicitud pendiente. Falta confirmar estas definiciones activas
en Supabase antes de cerrar el punto.

Confirmación parcial realizada el 2026-09-29 21:28 CST: la definición activa
de `respond_property_contact_authorization` coincide con la función segura.
Exige sesión, comprueba la propiedad del recurso antes de responder y rechaza
solicitudes ya respondidas. Falta confirmar las políticas RLS activas de
`property_contact_authorizations`.

Confirmación realizada el 2026-09-29 21:29 CST: las políticas RLS activas de
`property_contact_authorizations` limitan la lectura al asesor vinculado o al
dueño de la propiedad. No existe una política `UPDATE` directa. Junto con la
función segura confirmada, una autorización ajena no puede ser vista ni
respondida por un usuario normal. Este punto quedó cerrado. Continúa la
revisión de `/admin`.

Revisión local realizada el 2026-09-29 21:36 CST: `/admin` y `/admin/[id]`
exigen sesión y comprueban que el perfil tenga `role = 'admin'`. Las acciones
de moderación repiten la validación del rol mediante `getAuthenticatedAdmin()`
antes de actualizar. Las políticas RLS de `properties` también restringen las
actualizaciones administrativas al rol admin. Falta confirmar el resultado con
una cuenta normal autenticada.

Confirmación realizada el 2026-09-29 21:36 CST: una cuenta normal abrió
`/admin` y recibió “Acceso restringido”, sin exponer propiedades ni
requerimientos. El punto quedó cerrado. Continúa la revisión final de rutas que
reciben IDs directamente en URL o formularios.

Actualización realizada el 2026-09-29 21:41 CST: se añadió en
`app/api/registrar-oportunidad/route.ts` la validación del requerimiento antes
de registrar una oportunidad. La consulta exige simultáneamente el ID recibido
y `user_id = auth.uid()`; si no coincide, responde con 403 y no crea el
registro ni la notificación. `npm run build` finalizó sin errores.

Confirmación realizada el 2026-09-29 21:41 CST: una prueba real con propiedad
propia y un `demand_request_id` de otra cuenta devolvió 403. No se creó un
registro ni una notificación. Con este resultado quedó completada la auditoría
final de RLS y seguridad. El siguiente trabajo funcional recomendado es retomar
la actualización del inventario para filtros jerárquicos de zonas.

Actualización visual realizada el 2026-09-29 22:22 CST: se mejoraron las
pantallas de Registro, Header, Footer, filtros y selectores sin modificar
flujos ni datos. Esta nota reemplaza los ajustes intermedios de navegación
móvil y Footer que ya no describían la versión vigente.

Revisión de página principal realizada el 2026-09-29 22:51 CST: la portada
comunica bien el enfoque industrial de QRIH, pero todavía muestra las tres
propiedades ficticias de `lib/data.ts` y un filtro de zonas escrito manualmente.
No representa por completo el portal actual, que ya incluye inventario real,
publicación moderada, requerimientos, contacto autorizado y estadísticas. Se
debe reemplazar la selección de prueba por tres propiedades publicadas. Antes
de implementar la selección por rendimiento, falta definir la métrica: el
portal registra visualizaciones, solicitudes y conversión, pero esos datos son
privados por RLS y no deben exponerse directamente en la portada.

Actualización de portada realizada el 2026-09-29 22:59 CST: la selección QRIH
usa propiedades reales con estado `published`, ordenadas primero por
`featured`, después por `featured_priority` y finalmente por fecha. Se retiró
del buscador la lista manual de zonas y la entrada libre de superficie; ahora
usa `zone_general` y rangos compatibles con Inventario. Se añadió una sección
que comunica los flujos actuales: buscar espacio, publicar y administrar, y
registrar requerimientos. `npm run build` terminó sin errores.

Corrección visual realizada el 2026-09-29 23:10 CST: se reforzó el menú
responsive con un panel oscuro, contrastado y desplegable debajo del Header;
el Footer volvió a tener fondo, borde y enlaces coherentes con la identidad
visual. La sección “Una plataforma, dos caminos” dejó de ser texto plano y
ahora usa tarjetas con jerarquía visual, iconos, numeración y fondos sutiles.
No se modificaron datos ni flujos. `npm run build` terminó sin errores.

Optimización de imágenes implementada el 2026-09-30 09:31 CST: Publicar y
Editar ahora usan un selector reutilizable con máximo de 7 fotografías,
validación de JPG/PNG/WebP y 20 MB por original, procesamiento secuencial en
navegador, conversión a WebP con calidad 80 %, máximo de 1920 px, vista previa,
reducción de tamaño y eliminación individual antes de subir. Se conserva el
bucket `property-images`, la ruta por usuario y `main_image`; además, las
referencias de galería se guardan en `property_images` y se muestran en la
ficha. Se agregó la migración pendiente `014_property_images_policies.sql`
para autorizar la galería y restringir el bucket a WebP. Fue ejecutada el
2026-09-30; la prueba posterior reveló la corrección documentada enseguida.
`npm run build` terminó sin errores.

Corrección de galería realizada el 2026-09-30 09:45 CST: una prueba real
confirmó que la inserción directa en `property_images` era bloqueada por RLS.
Se creó la migración pendiente `015_save_property_images_function.sql`, con
una función segura que valida propiedad, usuario, máximo de 7 y rutas WebP
antes de reemplazar la galería. Publicar y Editar ahora la usan. La interfaz
indica “Sube hasta 7 fotografías”, muestra solo “Foto 1”, “Foto 2”, etc., y
las tarjetas ya no exceden el ancho del formulario. La migración 015 no fue
ejecutada. `npm run build` terminó sin errores.

Corrección de rutas y títulos realizada el 2026-09-30 10:00 CST: la prueba
posterior detectó que la expresión regular de la función 015 rechazaba rutas
WebP válidas. Se creó la migración pendiente
`016_fix_image_path_validation_and_titles.sql`, que sustituye esa validación
por comprobaciones de carpeta del usuario y extensión `.webp`; también añade
el campo `title` a `property_images`. Cada asesor puede escribir un título de
hasta 120 caracteres por fotografía, que se muestra en la galería pública.
`npm run build` terminó sin errores. La migración 016 no fue ejecutada.

Visualización de galería ampliada el 2026-09-30 10:15 CST: se agregó una
galería explícita con títulos a `/admin/[id]`. La ficha pública ya consulta
`property_images`; se creó la migración pendiente
`017_property_images_read_policies.sql` para reafirmar el acceso de lectura:
administrador y propietario pueden ver las imágenes siempre, mientras que el
público solo puede ver imágenes de propiedades publicadas. `npm run build`
terminó sin errores. La migración 017 no fue ejecutada.

Visualizador de fotografías implementado el 2026-09-30 10:30 CST: la ficha
pública y `/admin/[id]` usan un componente reutilizable. Al seleccionar una
foto se abre ampliada; permite avanzar y retroceder con botones o flechas del
teclado, cerrar con botón, Escape o clic fuera de la imagen, muestra el título
y el contador, y bloquea el desplazamiento de fondo. Se adapta a móvil.
`npm run build` terminó sin errores.

Ajuste de tamaño de galería realizado el 2026-09-30 10:40 CST: se detectó que
una regla móvil genérica elevaba todas las imágenes de la ficha a 300 px. La
galería ahora conserva su ancho de contenedor, miniaturas compactas y una foto
principal de altura moderada tanto en escritorio como en móvil. `npm run build`
terminó sin errores.

Ajuste de cuadrícula realizado el 2026-09-30 10:50 CST: la galería de la ficha
de propiedad muestra ahora dos fotografías por fila; la principal conserva el
ancho completo de las dos columnas. `npm run build` terminó sin errores.

Ajuste de proporción realizado el 2026-09-30 11:00 CST: las fotografías
secundarias de la ficha usan ahora una proporción horizontal 2:1 en escritorio
y móvil. La imagen principal conserva su proporción de presentación propia.
`npm run build` terminó sin errores.

## Actualización — PDF de propiedades

- Se implementó la generación dinámica de fichas PDF mediante `@react-pdf/renderer`, incluyendo información, precios, imágenes, galería, logo, datos de ubicación, descripción, nota legal y paginación.
- Se agregó el botón **“Descargar PDF”** en la ficha pública de cada propiedad.
- La descarga funciona correctamente desde el navegador.
- Validación TypeScript: `npx tsc --noEmit` ✅

**Estado: COMPLETADO**

## HISTORIAL DE CAMBIOS — 2026-09-30 / 2026-10-02

### 2026-09-30 — 11:20 — Corrección final de galería responsive

Se corrigió el comportamiento de la galería en móvil.

Problema detectado:
- Una regla genérica de imágenes móviles estaba fijando una altura de `300px` para toda la galería.
- Esto provocaba que la galería completa tuviera una altura artificial y que las filas secundarias no crecieran correctamente.

Corrección:
- La galería ahora crece de acuerdo con el número real de filas.
- Las imágenes secundarias mantienen su proporción visual `2:1`.
- Se conserva el comportamiento responsive.
- La imagen principal mantiene su propia presentación.
- Se evita que reglas globales de imágenes alteren el layout específico de la galería.

Resultado:
- Galería responsive corregida en desktop y móvil.
- No se modifica la lógica de almacenamiento de imágenes.
- No se modifica el límite máximo de fotografías.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

### 2026-09-30 — PDF dinámico de propiedad

Se completó la generación de PDF dinámico para las propiedades.

El PDF incluye:
- Información general de la propiedad.
- Tipo de operación.
- Precios.
- Información de ubicación.
- Descripción.
- Imagen principal.
- Galería de fotografías.
- Logotipo.
- Información relevante de la propiedad.
- Nota legal.
- Paginación.

Implementación:
- Se utiliza `@react-pdf/renderer`.
- El PDF se genera a partir de los datos reales de la propiedad.
- Se agregó la opción `Descargar PDF` en la página pública de detalle de propiedad.
- La descarga fue probada directamente desde el navegador.

Resultado:
- El PDF se genera correctamente.
- La descarga funciona desde la vista pública.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

### 2026-09-30 — Estado de cuenta y suspensión de usuarios

Se implementó la estructura funcional para manejar cuentas activas y suspendidas.

Se agregó al perfil del usuario:

- `account_status`
- `suspension_reason`
- `suspended_at`
- `suspended_by`
- `publications_enabled`

Estados contemplados:
- `active`
- `suspended`

Reglas de negocio establecidas:

#### Cuenta activa
- Puede operar normalmente.
- Sus propiedades pueden aparecer en el catálogo público de acuerdo con las reglas existentes.
- Puede realizar las acciones permitidas por la plataforma.

#### Cuenta suspendida
- No puede realizar nuevas publicaciones.
- Sus propiedades no se eliminan.
- Sus propiedades dejan de aparecer públicamente de acuerdo con las reglas de suspensión.
- El estado de la propiedad NO se modifica automáticamente por la suspensión de la cuenta.
- La suspensión no elimina información ni fotografías.
- El administrador puede seguir viendo y gestionando la información.

#### Reactivación
- Reactivar una cuenta no republica automáticamente las propiedades.
- Las publicaciones permanecen deshabilitadas hasta que el administrador decida habilitarlas explícitamente.
- No se modifica automáticamente el `status` de las propiedades durante la suspensión o reactivación.

También se mantiene la separación entre:
- estado de la cuenta del usuario;
- estado de publicación de la propiedad.

Esto evita utilizar el estado de la propiedad como sustituto del estado de la cuenta.

Estado: IMPLEMENTADO.

---

### 2026-09-30 — Protección administrativa de perfiles

Se consolidó el acceso administrativo mediante la función:

`public.current_user_is_admin()`

La función:
- utiliza `security definer`;
- establece `search_path = public`;
- comprueba el `role = 'admin'` del usuario autenticado;
- permite utilizar la comprobación desde políticas RLS.

Se agregó la política administrativa correspondiente para permitir que los administradores consulten perfiles que no sean únicamente el propio.

La función tiene acceso restringido y se concede ejecución a usuarios autenticados.

Objetivo:
- evitar depender únicamente de comprobaciones visuales del frontend;
- mantener la autorización administrativa respaldada por RLS y PostgreSQL.

Estado: IMPLEMENTADO.

---

### 2026-10-02 — Configuración global de soporte

Se creó la tabla:

`public.platform_settings`

La tabla está diseñada para almacenar configuraciones globales de la plataforma.

Actualmente contiene principalmente:

- `support_email`
- `updated_at`
- `updated_by`

La tabla utiliza una única fila global mediante:

`id boolean primary key default true`

y una restricción que garantiza:

`id = true`

Seguridad:
- RLS habilitado.
- Usuarios autenticados pueden consultar la configuración necesaria.
- Solo administradores pueden insertar.
- Solo administradores pueden actualizar.
- Las modificaciones utilizan `current_user_is_admin()`.

Migración creada:

`036_platform_settings.sql`

La migración fue ejecutada correctamente mediante:

`npx supabase db push`

También se creó la página administrativa:

`/admin/configuracion`

La página:
- requiere autenticación;
- requiere rol `admin`;
- permite consultar el correo de soporte actual;
- permite modificarlo;
- guarda `updated_at`;
- guarda `updated_by`.

Se agregó el acceso a `Configuración` desde el panel administrativo.

Resultado:
- El correo de soporte ya no está hardcodeado en los componentes.
- El administrador puede cambiarlo desde la plataforma.
- Los cambios persisten después de actualizar la página.

Estado: COMPLETADO.

---

### 2026-10-02 — Aviso reutilizable de cuenta suspendida

Se creó el componente reutilizable:

`components/AccountSuspensionNotice.tsx`

Objetivo:
- centralizar el mensaje mostrado a usuarios con cuenta suspendida;
- evitar duplicar el mismo bloque de interfaz en diferentes páginas;
- utilizar el correo de soporte configurado globalmente.

El componente consulta:

`platform_settings.support_email`

y muestra:

**Cuenta suspendida**

`Tu cuenta está suspendida y no puedes realizar nuevas publicaciones.`

Si existe un correo de soporte configurado, también muestra la opción de contacto mediante `mailto:`.

Características:
- componente cliente;
- consulta el correo de soporte desde Supabase;
- no contiene el correo de soporte hardcodeado;
- muestra el correo configurado actualmente;
- permite actualizar el correo desde `/admin/configuracion` y utilizar el nuevo valor en posteriores cargas de la interfaz.

Integración realizada en:

`/publicar`

y:

`/mis-propiedades`

En `/publicar`:
- la cuenta suspendida sigue bloqueada para nuevas publicaciones;
- los botones correspondientes permanecen deshabilitados;
- la validación existente de campos obligatorios no fue alterada;
- el aviso reutilizable reemplaza el aviso inline anterior.

En `/mis-propiedades`:
- se muestra el mismo aviso reutilizable cuando la cuenta está suspendida;
- se mantiene la lógica existente de consulta de propiedades;
- no se eliminan propiedades como consecuencia de la suspensión.

Resultado:
- Ambos puntos de entrada muestran el aviso de suspensión.
- El mensaje utiliza la configuración global de soporte.
- Se evita duplicar la implementación del aviso.
- `npx tsc --noEmit` limpio.

Estado: COMPLETADO.

---

## 2026-10-02 FUNCIONALIDADES RECIENTEMENTE COMPLETADAS

Las siguientes áreas fueron completadas o consolidadas recientemente:

- Galería responsive de propiedades.
- Selector reutilizable de fotografías con máximo de 7 imágenes.
- Validación y optimización de imágenes.
- Almacenamiento de fotografías WebP.
- Galería titulada.
- Visor ampliado de fotografías.
- PDF dinámico de propiedades.
- Estados de cuenta `active` / `suspended`.
- Reglas de negocio para suspensión y reactivación.
- Protección administrativa mediante `current_user_is_admin()`.
- Configuración global de correo de soporte.
- Página administrativa `/admin/configuracion`.
- Aviso reutilizable de cuenta suspendida.
- Integración del aviso en `/publicar`.
- Integración del aviso en `/mis-propiedades`.

Las modificaciones recientes relacionadas con suspensión de cuentas no eliminan propiedades ni modifican automáticamente el `status` de las propiedades.

La reactivación de una cuenta tampoco republica automáticamente las propiedades.

---

## 2026-10-02 ESTADO ACTUAL — FUNCIONALIDADES RECIENTEMENTE COMPLETADAS

Las siguientes áreas fueron completadas o consolidadas recientemente:

- Mejora visual y funcional del panel administrativo `/admin`.
- KPIs administrativos para propiedades.
- Mejora de filtros, tarjetas de revisión y paginación de propiedades.
- Historial administrativo centralizado en `/admin/historial`.
- Filtros de historial por entidad, acción, búsqueda y rango de fechas.
- Navegación entre panel, historial, propiedades y asesores.
- Botón de acceso a Historial agregado al panel de Administración.
- Auditoría de creación, modificación, publicación, rechazo, retiro y reenvío de propiedades.
- Auditoría de verificación, suspensión y reactivación de asesores.
- Corrección de `/inventario` para mostrar correctamente las propiedades publicadas.
- Notificaciones administrativas para propiedades publicadas y rechazadas.
- Consolidación de las reglas de visibilidad pública para cuentas suspendidas.
- Validación de suspensión y reactivación sin eliminar ni republicar automáticamente propiedades.
- Configuración global de correo de soporte.
- Aviso reutilizable de cuenta suspendida integrado en `/publicar` y `/mis-propiedades`.

Estado: COMPLETADO Y VALIDADO.



## Regla documental

Corrección responsive de proporción realizada el 2026-09-30 11:10 CST: el
aspecto 2:1 se fijó en el contenedor de cada foto secundaria y la imagen se
recorta dentro de él. Esto evita que la proporción original altere la
cuadrícula en móvil. `npm run build` terminó sin errores.

Corrección de contenedor móvil realizada el 2026-09-30 11:20 CST: una captura
mostró que una regla genérica fijaba la altura completa de la galería en 300
px, causando que las fotografías se amontonaran. La galería vuelve a crecer
por filas y mantiene las secundarias en proporción 2:1. `npm run build`
terminó sin errores.

Después de cada cambio funcional, actualizar este archivo y `NEXT_STEPS.md`
con el resultado, la verificación realizada y el siguiente paso exacto.
