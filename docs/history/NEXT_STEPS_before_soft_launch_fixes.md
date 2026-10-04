# Archivo histórico — no es el plan vigente

Conservado sin ejecutar; sustituido por NEXT_STEPS.md a petición del usuario (2026-10-03).

# NEXT STEPS — QRO INDUSTRIAL HUB / QRIH

> ## Plan vigente — posterior a auditoría 2026-10-03
>
> **No añadir funcionalidades.** Esta sección reemplaza las prioridades históricas posteriores.
>
> ### Bloqueantes antes de Soft Launch
>
> 1. Configurar las Redirect URLs de Supabase Auth y probar el callback de confirmación en staging y producción (AUD-001). El código ya deriva la URL desde el dominio abierto; la configuración externa sigue pendiente.
> 2. AUD-002 está detenido por nuevo riesgo **AUD-002-SIGN**: obtener autorización para separar emisión exclusiva de servidor de lectura/limpieza cliente y bloquear firma nativa con TTL arbitrario. No desplegar el corte local ni aplicar 044/045 todavía. Build/tipos y tests aislados pasan, pero esa barrera no está resuelta.
>    Después de resolverla: preflight de sólo lectura (conteos reales de main_image/convertibles/NULL/formato inesperado/sin galería, ownership y bucket), revisión de excepciones sin forzar datos, 044/045 revisadas, deploy coordinado y privatización por Storage API conservando MIME/tamaño. Ejecutar la matriz externa completa, incluyendo URL antigua, TTL y firma directa de larga duración. Sólo entonces reconsiderar estado de AUD-002 y GO/NO-GO.
> 3. Confirmar por consultas de sólo lectura que Supabase tiene aplicadas las migraciones/policies/functions/triggers esperados de 001–043, especialmente perfiles, propiedades, contactos, autorizaciones, Storage y RPCs `SECURITY DEFINER`.
> 4. Configurar y comprobar en Netlify las variables públicas requeridas, el dominio y las Redirect URLs permitidas de Supabase Auth. No registrar valores secretos en documentación.
> 5. Ejecutar la matriz manual de `QRIH_AUDIT.md`: público, usuario nuevo, publicador, asesor, propietario, admin y suspendido; incluir IDs ajenos, imágenes y PDF.
> 6. Hacer smoke test en el deployment exacto, revisar logs y repetir `npm run build` antes de abrir el grupo piloto.
>
> ### Durante y después del Soft Launch
>
> - Abrir con grupo pequeño, revisar diariamente errores de Netlify/Supabase, altas, publicaciones, contactos, Storage y PDF.
> - Registrar incidencias con evidencia; priorizar sólo seguridad, privacidad, confiabilidad y bugs demostrados.
> - Mantener backup recuperable y responsable de moderación/soporte.
> - Actualizar `PROJECT_STATUS.md` y `QRIH_FUNCTIONAL_INDEX.md` sólo con evidencia verificable.

Este archivo es la hoja de ruta de continuación del proyecto.

IMPORTANTE:

El usuario es principiante y quiere trabajar UN PASO A LA VEZ.

No ejecutar todos los pasos de una sola vez.

Después de cada paso:
1. hacer el cambio,
2. probar,
3. pedir confirmación,
4. continuar únicamente cuando el usuario diga que está listo.

---

# ESTADO ACTUAL

## Prioridad vigente: optimización de imágenes

Esta prioridad fue indicada expresamente por el usuario y reemplaza
temporalmente la prioridad anterior de filtros de zonas.

- [x] Crear `property_contact_authorized` y su notificación.
- [x] Crear `/notificaciones` y enlazarla desde el Header.
- [x] Proteger la función que entrega el contacto del propietario mediante una
  autorización aprobada.
- [x] Ejecutar `npm run build` después de los cambios.
- [x] Ejecutar en Supabase la migración que impide que un usuario normal
  cambie su propio `role` a `admin`.
- [x] Comprobar con una cuenta normal que la autoaprobación de contactos sigue
  guardándose correctamente después de la protección de roles.
- [x] Crear la migración `009_remove_live_contact_authorization_update_policy.sql`
  y ejecutar en Supabase la eliminación de la política directa activa de
  `property_contact_authorizations` (confirmado por el usuario, 2026-09-29
  20:38 CST), y la consulta de verificación confirmó cero políticas `UPDATE`
  activas el 2026-09-29 20:39 CST.
- [x] Crear y ejecutar la migración
  `010_remove_unused_interest_update_policies.sql` para eliminar las políticas
  `UPDATE` directas no utilizadas de intereses y registros de oportunidades
  (confirmado por el usuario, 2026-09-29 20:41 CST); la consulta de
  verificación devolvió cero filas el 2026-09-29 20:42 CST.
- [x] Crear y ejecutar la migración
  `011_restore_profile_managed_fields_protection.sql` para restaurar la
  protección de `role`, `plan` y `trial_ends_at` en perfiles (confirmado por
  el usuario, 2026-09-29 20:47 CST); la definición activa fue comprobada y
  contiene los tres campos el 2026-09-29 20:49 CST.
- [x] Preparar `012_version_active_notification_functions.sql` y
  `013_version_active_rls_policies.sql` con las 3 funciones y 19 políticas
  activas detectadas durante la auditoría (2026-09-29 20:55 CST).
- [x] Ejecutar en Supabase las migraciones 012 y 013 (confirmado por el
  usuario, 2026-09-29 20:59 CST).
- [x] Confirmar mediante una consulta de solo lectura que el inventario
  versionado está activo: 3 funciones y 19 políticas RLS (confirmado por el
  usuario, 2026-09-29 21:13 CST).
- [x] Revisar las políticas y funciones activas de Supabase para identificar
  elementos no representados en las migraciones: no se detectaron elementos
  adicionales (confirmado por el usuario, 2026-09-29 21:15 CST).
- [x] Validar como Público el acceso al inventario sin sesión: cargó
  correctamente y mostró 3 propiedades (confirmado por el usuario,
  2026-09-29 21:19 CST).
- [x] Validar como Público la apertura de una ficha de propiedad sin sesión:
  cargó correctamente (confirmado por el usuario, 2026-09-29 21:20 CST).
- [x] Validar como Público que el contacto requiera autenticación: el envío
  redirigió a `/login` antes de crear una solicitud (confirmado por el usuario,
  2026-09-29 21:20 CST).
- [ ] Validar visualmente el acceso de Asesor, Propietario y Admin con cuentas
  de prueba antes de abrir el portal a usuarios reales (pospuesto por decisión
  del usuario el 2026-09-29 21:22 CST).

### Auditoría final de permisos

- [x] Confirmar que un usuario no pueda leer ni modificar propiedades ajenas:
  las políticas activas permiten a terceros solo leer propiedades `published`
  y bloquean modificaciones fuera de los casos autorizados (confirmado por el
  usuario, 2026-09-29 21:26 CST).
- [x] Confirmar que un usuario no pueda acceder a requerimientos ajenos: la
  lectura directa está restringida al propietario o administrador y un ID ajeno
  en `registrar-oportunidad` fue rechazado con 403 (confirmado por el usuario,
  2026-09-29 21:41 CST).
- [x] Confirmar que un usuario no pueda ver ni responder autorizaciones de
  contacto ajenas: las políticas activas limitan la lectura al asesor o dueño
  correspondiente y la respuesta solo ocurre por la función segura (confirmado
  por el usuario, 2026-09-29 21:29 CST).
- [x] Confirmar que un usuario normal no pueda acceder a `/admin`: la prueba
  mostró “Acceso restringido” sin exponer propiedades ni requerimientos
  (confirmado por el usuario, 2026-09-29 21:36 CST).
- [x] Revisar que las rutas con IDs en la URL validen autenticación, rol y
  propiedad del recurso. La única excepción detectada fue corregida y la
  prueba con un ID ajeno devolvió 403 (confirmado por el usuario,
  2026-09-29 21:41 CST).

### Siguiente paso exacto

Ejecutar manualmente en Supabase la migración
`supabase/migrations/017_property_images_read_policies.sql`. Habilita de forma
explícita la lectura de la galería para Admin y propietario, y para el público
solo cuando la propiedad esté publicada. Después, comprobar la galería en
`/admin/[id]`; una ficha pública solo mostrará fotos si su propiedad ya fue
publicada.

Después de confirmar la galería, comprobar el visualizador: abrir cualquier
fotografía, avanzar y retroceder, cerrar con la X, Escape y clic fuera de la
imagen. Repetir la prueba desde teléfono.

Confirmar que la galería se mantiene dentro de la ficha y que las miniaturas
no ocupan la altura de la fotografía principal, especialmente en móvil.

Confirmar que la ficha muestra dos fotografías por fila y que la imagen
principal ocupa las dos columnas.

Confirmar que las fotografías secundarias mantienen proporción 2:1 también en
una ventana móvil.

Recargar completamente la ficha en móvil y confirmar que cada foto secundaria
conserva 2:1, aun cuando el archivo original sea vertical.

Confirmar que la galería móvil crece por filas y que las fotos no se
superponen ni quedan recortadas por el contenedor.

Actualización documental: 2026-09-29 22:22 CST. Se aplicó la revisión visual
general de Registro, Header, Footer, filtros y selectores. Esta nota sustituye
los cambios intermedios de menú móvil y Footer que quedaron desactualizados.

Actualización documental: 2026-09-29 22:59 CST. La portada usa propiedades
publicadas reales y las ordena por `featured`, `featured_priority` y fecha de
publicación. El buscador ahora usa `zone_general` y rangos de superficie
compatibles con el inventario. También se agregó una sección que presenta los
flujos de buscar, publicar y registrar requerimientos. `npm run build` terminó
sin errores.

Actualización documental: 2026-09-29 23:10 CST. Se corrigió el panel del menú
responsive con fondo oscuro y enlaces contrastados, se reforzó la presencia del
Footer y se diseñaron las tarjetas de “Una plataforma, dos caminos” con
numeración, iconos y jerarquía visual. No se modificaron datos ni flujos.
`npm run build` terminó sin errores.

Actualización documental: 2026-09-30 09:31 CST. Se implementó la optimización
de imágenes en navegador para Publicar y Editar: máximo 7, JPG/PNG/WebP,
límite original de 20 MB, WebP calidad 80 %, máximo 1920 px, vista previa,
eliminación individual y carga secuencial. Las referencias se guardan en
`property_images` y se muestran en la ficha. Se creó la migración 014 para las
políticas requeridas; fue ejecutada el 2026-09-30. `npm run build` terminó sin
errores.

Actualización documental: 2026-09-30 09:45 CST. Una prueba reportó que RLS
bloqueó el registro de la galería. Se creó la migración 015 con una función
segura para reemplazar las referencias de galería tras validar propiedad,
usuario, máximo 7 y rutas WebP. Se simplificó la vista previa a “Foto 1”,
“Foto 2”, etc., y se contuvo dentro del formulario. La migración 015 aún debe
ejecutarse en Supabase. `npm run build` terminó sin errores.

Actualización documental: 2026-09-30 10:00 CST. La prueba posterior detectó
una validación de ruta demasiado estricta en la función 015. Se creó la
migración 016 para corregirla y añadir títulos editables de hasta 120
caracteres por foto, mostrados en la galería. La migración 016 aún debe
ejecutarse en Supabase. `npm run build` terminó sin errores.

Actualización documental: 2026-09-30 10:15 CST. Se agregó una galería visible
en Admin y se creó la migración 017 para las políticas de lectura de
`property_images`: Admin y propietario siempre; público únicamente si la
propiedad está publicada. La migración 017 aún debe ejecutarse en Supabase.
`npm run build` terminó sin errores.

Actualización documental: 2026-09-30 10:30 CST. Se implementó un visualizador
reutilizable para ficha pública y Admin: ampliación, navegación anterior y
siguiente, contador, título, cierre con X/Escape/clic exterior y adaptación a
móvil. `npm run build` terminó sin errores.

Actualización documental: 2026-09-30 10:40 CST. Se corrigió una regla móvil
que hacía que las miniaturas midieran 300 px. La galería quedó contenida y con
alturas diferenciadas para foto principal y miniaturas. `npm run build`
terminó sin errores.

Actualización documental: 2026-09-30 10:50 CST. La galería de la ficha se
ajustó a dos fotografías por fila; la principal conserva el ancho de ambas
columnas. `npm run build` terminó sin errores.

Actualización documental: 2026-09-30 11:00 CST. Las fotos secundarias de la
ficha se ajustaron a aspecto horizontal 2:1 en escritorio y móvil; la imagen
principal mantiene su presentación independiente. `npm run build` terminó sin
errores.

Actualización documental: 2026-09-29 21:15 CST. La comparación del inventario
completo confirmó 6 funciones y 28 políticas RLS activas; todas están
representadas por las migraciones 001 a 013. No fue necesario crear ni ejecutar
una migración adicional.

Actualización documental: 2026-09-29 21:19 CST. La primera prueba de Público
fue correcta: `/inventario` cargó sin sesión y mostró 3 propiedades. El código
consulta exclusivamente registros con estado `published`. La siguiente prueba
pública es abrir una ficha de propiedad sin iniciar sesión.

Actualización documental: 2026-09-29 21:20 CST. La ficha pública abrió
correctamente sin sesión. La siguiente y última prueba de Público verificará
que el contacto requiera autenticación antes de crear una solicitud.

Actualización documental: 2026-09-29 21:20 CST. La prueba final de Público fue
correcta: el formulario de contacto redirigió a `/login` sin crear una
solicitud. La validación de Público queda completada.

Actualización documental: 2026-09-29 21:22 CST. Por decisión del usuario, se
posponen las comprobaciones visuales restantes de Asesor, Propietario y Admin.
No deben considerarse completadas y deberán realizarse antes de abrir el portal
a usuarios reales. La prioridad posterior de inventario queda pospuesta.

Actualización documental: 2026-09-29 21:24 CST. El usuario estableció como
nueva prioridad la auditoría final de RLS y seguridad. Incluye acceso a
propiedades, requerimientos, autorizaciones de contacto, `/admin` e IDs
manipulados en URL. Se inicia por las propiedades ajenas.

Actualización documental: 2026-09-29 21:24 CST. La revisión local de
`properties` confirmó que la lectura pública se limita a propiedades
`published`, la lectura privada exige `owner_id = auth.uid()` y las
actualizaciones se reservan al administrador o al propietario de una propiedad
rechazada que se reenvía a revisión. Falta comprobar las expresiones activas
en Supabase mediante una consulta de solo lectura.

Actualización documental: 2026-09-29 21:26 CST. Las expresiones RLS activas de
`properties` fueron confirmadas en Supabase. La lectura de terceros se limita a
`published`; los cambios solo están permitidos al administrador o al propietario
de una propiedad rechazada al reenviarla a `pending`. El primer punto quedó
cerrado y continúa la revisión de requerimientos ajenos.

Actualización documental: 2026-09-29 21:27 CST. La revisión local de
autorizaciones de contacto confirmó que la lectura se limita al asesor de la
solicitud o al dueño de la propiedad. La respuesta se realiza mediante una
función que exige que el propietario de esa propiedad responda una solicitud
pendiente. Falta confirmar la definición activa en Supabase.

Actualización documental: 2026-09-29 21:28 CST. La definición activa de
`respond_property_contact_authorization` fue confirmada: exige sesión, valida
que la propiedad pertenezca a quien responde y solo permite responder una
solicitud pendiente. Falta recibir las políticas RLS activas de la tabla para
cerrar este punto.

Actualización documental: 2026-09-29 21:29 CST. Las políticas RLS activas
confirmaron que solo el asesor vinculado o el dueño de la propiedad pueden leer
una autorización. No hay política de actualización directa; la única respuesta
usa la función segura ya verificada. El punto quedó cerrado y continúa `/admin`.

Actualización documental: 2026-09-29 21:36 CST. La revisión local confirmó que
`/admin` y `/admin/[id]` exigen sesión y `role = 'admin'`. Las acciones de
moderación repiten esta comprobación en el servidor y las políticas RLS limitan
las actualizaciones administrativas. Falta la comprobación práctica con una
cuenta normal para cerrar el punto.

Actualización documental: 2026-09-29 21:36 CST. La prueba con una cuenta normal
mostró “Acceso restringido” al abrir `/admin`; no se expusieron propiedades ni
requerimientos. El punto de acceso administrativo quedó cerrado. Continúa la
revisión final de IDs manipulados directamente.

Actualización documental: 2026-09-29 21:36 CST. La revisión de IDs confirmó
que edición, solicitudes de propiedad, contacto, intereses, autorizaciones,
notificaciones y rutas administrativas validan sesión, propietario o rol según
corresponde. El único hallazgo es `registrar-oportunidad`, que valida la
propiedad pero no el acceso al requerimiento recibido. La auditoría final no
puede cerrarse hasta corregir y verificar esa ruta.

Actualización documental: 2026-09-29 21:41 CST. Se actualizó
`app/api/registrar-oportunidad/route.ts`: antes de insertar, consulta el
requerimiento por su ID y `user_id = auth.uid()`. Un ID ajeno devuelve 403 y no
alcanza la inserción ni la notificación. `npm run build` terminó sin errores.
La prueba real con una propiedad propia y un requerimiento de otra cuenta
devolvió 403. La auditoría final de RLS y seguridad quedó completada.

## Completado

- [x] Proyecto Next.js funcionando
- [x] Supabase conectado
- [x] Autenticación
- [x] Publicación de propiedades
- [x] Carga de imagen principal
- [x] Generación de slug
- [x] Envío a revisión
- [x] Panel de propiedades
- [x] Visualizaciones
- [x] Solicitudes
- [x] Estadísticas
- [x] Moderación administrativa
- [x] Publicar propiedad
- [x] Rechazar propiedad
- [x] Retirar propiedad
- [x] Editar propiedad rechazada
- [x] Volver a enviar propiedad rechazada
- [x] Filtros de operación
- [x] Filtros de superficie
- [x] Footer
- [x] Aviso de privacidad
- [x] Términos y condiciones
- [x] Crear zone_general en properties
- [x] Crear catálogo centralizado de zonas
- [x] Selector jerárquico de zonas en publicación
- [x] Guardar zone_general al publicar
- [x] Selector jerárquico de zonas en edición
- [x] Leer zone_general al editar
- [x] Guardar zone_general al editar

---

# TRABAJO POSTERIOR A LA AUDITORÍA

Los siguientes pasos de inventario continúan pendientes, pero solo deben
iniciarse después de completar la verificación de permisos y las pruebas por
rol.

## 1. Actualizar el inventario para utilizar la nueva jerarquía de zonas

Archivo:

app/inventario/page.tsx

Objetivo:

Dejar de depender exclusivamente de una lista de zonas escrita manualmente.

El inventario debe utilizar:

import { ZONAS_GENERALES, ZONAS_INDUSTRIALES_POR_ZONA } from '@/lib/zonas'

Debe poder trabajar con:

zone_general

zone

La consulta de Supabase deberá permitir filtrar por:

- zona general
- zona industrial

El inventario debe seguir filtrando correctamente por:

- operación
- superficie

No romper los filtros existentes.

---

# 2. Convertir el filtro de inventario en selección jerárquica

La experiencia deseada es similar a publicación:

Primero:

Zona general

Después:

Zona industrial

Las opciones industriales dependen de la zona general seleccionada.

Ejemplo:

Zona general:
El Marqués

Zona industrial:
- Conín
- El Marqués
- El Colorado
- Aeropuerto
- Finsa
- Parque Tecnológico Innovación Querétaro
- Parque Aeroespacial Querétaro

La solución técnica puede requerir convertir la parte de filtros en un pequeño componente cliente.

No hacer este cambio hasta completar el paso 1 y revisar el código existente.

---

# 3. Probar inventario

Después de implementar los filtros:

Probar:

- sin filtros
- Renta
- Venta
- zona general
- zona industrial
- operación + zona
- zona + superficie
- operación + zona + superficie
- limpiar filtros

Confirmar que las propiedades mostradas coinciden con los filtros.

---

# 4. Evitar inconsistencias de zona

Revisar todos los puntos donde se crea o modifica una propiedad.

Debe quedar prohibido conceptualmente que el usuario escriba libremente:

zone

La zona debe salir siempre de:

lib/zonas.ts

Esto aplica a:

- publicación
- edición
- inventario
- eventualmente otros formularios

---

# 5. Mejorar comportamiento de los selectores

Después de que el sistema básico funcione:

Si el usuario cambia:

Zona general A

por:

Zona general B

la zona industrial seleccionada anteriormente debe limpiarse o cambiarse correctamente.

Esto aplica a:

- publicación
- edición
- inventario

No priorizar esto antes de terminar la funcionalidad principal.

---

# 6. Revisar propiedades antiguas

Las propiedades de prueba antiguas pueden tener:

zone_general = NULL

No es necesario migrarlas.

Cuando se trabaje con datos reales, todas las propiedades nuevas deberán tener:

zone_general
zone

---

# 7. Ejecutar build

Después de completar una tanda importante de cambios:

npm run build

El build debe terminar correctamente.

Si falla:

- no continuar agregando funcionalidades
- corregir primero el error
- volver a ejecutar build

---

# 8. Revisar experiencia de publicación

Una vez terminados los filtros de inventario:

Revisar flujo completo:

1. Registro/login
2. Publicar
3. Seleccionar zona general
4. Seleccionar zona industrial
5. Guardar
6. Ver propiedad pendiente
7. Moderar
8. Publicar
9. Ver en inventario
10. Filtrar por zona
11. Abrir propiedad

---

# 9. Revisar experiencia de rechazo

Flujo esperado:

1. Admin rechaza propiedad.
2. Usuario ve rechazo.
3. Usuario entra a editar.
4. Usuario cambia información.
5. Usuario puede modificar zona general.
6. Usuario selecciona zona industrial correspondiente.
7. Usuario guarda.
8. Propiedad vuelve a pending.
9. Admin puede revisarla nuevamente.

---

# 10. Revisar solicitudes y visualizaciones

Comprobar posteriormente:

- registro de visualizaciones
- solicitudes de contacto
- estadísticas del propietario
- asociación correcta con property_id
- restricciones RLS

---

# 11. Mejoras futuras del portal

Después de estabilizar el inventario:

- búsqueda más avanzada
- mejores filtros
- experiencia de detalle de propiedad
- favoritos
- propiedades destacadas
- home_pool
- sistema de planes
- verificación de propiedades
- expiración/verificación periódica
- mejoras de panel
- mejoras de administración
- analítica
- SEO
- optimización móvil

Estas funciones son posteriores.

No implementarlas antes de estabilizar las funciones actuales.

---

# DECISIONES QUE NO DEBEN CAMBIARSE SIN CONSULTAR

## Zonas

La jerarquía aprobada es:

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

# REGLAS DE CONTINUACIÓN

- No dar cinco pasos a la vez.
- No asumir conocimientos técnicos avanzados.
- Usar Terminal cuando sea posible.
- Proporcionar comandos listos para copiar y pegar.
- Explicar brevemente qué hace cada comando.
- Pedir confirmación después de cada paso.
- Revisar antes de modificar.
- No eliminar funcionalidades existentes.
- No cambiar tecnologías sin autorización.
- No modificar las zonas aprobadas sin consultarlo.
- Mantener el proyecto funcionando después de cada cambio.
- Hacer primero cambios pequeños.
- Ejecutar npm run build después de cambios importantes.
- Actualizar `PROJECT_STATUS.md` y `NEXT_STEPS.md` después de cada cambio
  funcional, registrando resultado, verificación y siguiente paso.

---

# PUNTO EXACTO DE REANUDACIÓN

El proyecto está detenido inmediatamente después de agregar correctamente zone_general al endpoint:

app/api/editar-propiedad/route.ts

El siguiente trabajo es:

ACTUALIZAR app/inventario/page.tsx

para utilizar:

zone_general

zone

y el catálogo centralizado:

lib/zonas.ts

No comenzar otra funcionalidad antes de resolver este punto, salvo que el usuario indique expresamente lo contrario.
