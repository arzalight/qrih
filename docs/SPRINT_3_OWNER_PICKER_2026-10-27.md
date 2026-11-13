# Sprint 3 complementario — propietarios desde el formulario

## Entrega y estado

**Implementado y probado localmente; no habilitado ni validado integrado en STAGING.** Sin despliegue, push, cambios en main, SQL remoto o escrituras en propiedades/contactos reales. No se modificaron las 26 propiedades existentes. El gate de respaldo/recuperación sigue en **NO-GO**. Esta tarea no autoriza resolverlo ni iniciar Sprint 4.

Rama: `feature/sprint-3-commercial-tools`. HEAD conservado: `841463390298f6e5d5236ebf05b8f5492a8c1640` (checkpoint Sprint 2). Sprint 3 y esta mejora permanecen sin commit. Corte local final: 209 archivos de código/migraciones/pruebas, SHA-256 `6ebabf271564587a50d1b4f4097d3c4fbbbdc06ba336097912de879e37f82f7b`; mismo algoritmo/alcance de código que el preflight anterior, documentación y secretos excluidos. El corte de 208 archivos del preflight anterior **ya no corresponde** a esta versión.

## Comportamiento

- Alta y edición/duplicación reutilizan `PrivatePropertyFields` y el directorio `advisor_owners`; no se crea otra agenda.
- Búsqueda desde dos caracteres, debounce de 300 ms, cancelación por AbortController y rechazo de respuestas tardías. Consulta sólo por actor autenticado; incluso un admin usa su propio directorio en el selector.
- Hasta tres coincidencias, orden exacta → inicio → parcial, con normalización NFD de acentos, minúsculas y espacios. Desempate determinista por nombre normalizado e ID. `%`/`_` no son comodines: SQL usa `strpos`, no SQL construido con el texto del usuario.
- Sólo ID/nombre/empresa en la respuesta de selección y resultados; teléfono/correo/notas no se consultan para el desplegable. El nombre de búsqueda viaja en una cabecera, no en URL/historial. Respuestas privadas `no-store`, `Vary: Cookie`.
- Selección guarda UUID en campo oculto; nombre libre sin seleccionar/confirmar no se acepta como asociación. Se puede cambiar o limpiar. Se recupera el nombre de la asociación actual mediante lectura propia mínima, también si está archivado. Las búsquedas nuevas excluyen archivados.
- Combobox con listbox, opción activa, flechas, Enter y Escape; botones nativos para ratón/tacto y objetivos mínimos de 44 px. No depende de hover. Un blur sin destino conocido no desmonta la opción antes del click táctil.
- «Crear nuevo propietario: [nombre]» crea **sólo estado local pendiente**, no un POST de contacto. Panel desplegable opcional de empresa, teléfono y correo. Texto explícito de pendiente y de cuándo se registrará.
- Borrador guarda el pendiente en `property_private_details.pending_owner`, bajo la misma RLS de la asociación; no lo guarda en localStorage/sessionStorage, JSON comercial, auditorías ni metadatos públicos. Recargar el editor recupera el pendiente. Un error de lectura bloquea editar en lugar de inventar un vacío.
- Envío a revisión registra/asocia dentro de la misma transacción de la propiedad. Un fallo en la asociación revierte contacto, propiedad, galería BD y privado. Los RPC comerciales y la moderación siguen siendo la fuente del comportamiento anterior.
- Un nombre exacto en resultados avisa para elegir el existente. Al enviar, la equivalencia se define como **nombre y empresa normalizados iguales**, dentro del mismo asesor y sin archivo. Si existe otro contacto equivalente, se revierte y se pide selección explícita: no se adivina la persona ni se sobreescribe su teléfono/correo.
- ID estable de creación y token privado de pendiente, guard de doble clic y bloqueo transaccional por asesor+equivalencia. Un reintento devuelve la propiedad ya confirmada; no convierte implícitamente un borrador anterior en pendiente. La edición repetida con versión antigua falla sin duplicar contacto. No hay unicidad global ni deduplicación destructiva de contactos existentes.
- Duplicación sigue forzada a borrador, conserva asociación propia o pendiente como editable y no modifica la fuente. Contactos ajenos nunca son seleccionables/asociables. Cambiar o quitar propietario limpia el pendiente de forma explícita.
- Errores mantienen campos/fotos del formulario; el mensaje de equivalencia es específico y recuperable. Un resultado de red desconocido pide revisar Mis propiedades antes de reintentar y no elimina fotos posiblemente confirmadas.

## Esquema: una migración adicional, sin aplicar

Archivo generado con la CLI instalada y preparado localmente:

`20261027142223_sprint3_owner_picker_pending.sql`

SHA-256: `1c5a2404b2007a8716969a3b50359a955691c749a3b1c9313b412db57432b6e3`.

Debe revisarse **después** de `20261027061535`, `20261027061537` y `20261027061538`; requiere baseline + 044–052 y esas tres. Los hashes y contenidos de las tres migraciones previas permanecen intactos. Ahora hay **cuatro migraciones pendientes**, no una autorización implícita para ampliar el lote anterior. No se aplicó ninguna remotamente.

Cambios:

1. Columna JSONB `pending_owner` en el detalle privado existente, validación de claves/tipos/tamaños/correo/UUID y exclusión con asociación definitiva. Sin nueva tabla de contactos, backfill o cambios en `properties`.
2. Helpers de normalización/validación e índice por asesor/nombre normalizado para contactos activos. Sin extensiones nuevas.
3. RPC `qrih_search_own_owners(text)`, `SECURITY INVOKER`, filtro explícito de actor activo + propia cuenta y proyección de tres columnas/límite 3.
4. Setter privado ampliado, conservando actualizaciones parciales heredadas; `owner_contact_id` explícito limpia el pendiente. Misma RLS/triggers de validación de pertenencia, sin habilitar escrituras ajenas/admin ni acceso anónimo.
5. RPC versionados `qrih_create_property_with_owner` y `qrih_save_property_with_owner` para alta/guardado con confirmación del contacto. Reutilizan operaciones comerciales anteriores; el edit guarda privados mientras el inmueble aún es borrador/rechazado, y luego transiciona. Un error comercial revierte también ese privado.
6. Finalizador privado bajo INVOKER: actor activo, propiedad propia en revisión, lock transaccional por cuenta/equivalencia, alta con ID estable y asociación. Nada de service_role ni metadata editable para autorizar.
7. Constraint triggers diferidos impiden confirmar `pending` con datos de propietario aún sin finalizar, incluso desde una transición heredada/directa. La moderación posterior permanece intacta. No hay cron, notificación masiva, DROP ni DELETE de contactos.
8. RPC de capacidad `qrih_owner_picker_ready`: sin ella, el componente indica «por habilitar» y no permite simular búsquedas/guardados privados exitosos. El flujo comercial heredado sin campos privados se conserva.

El DDL es transaccional y de ejecución única, **no reejecutable a ciegas**. La idempotencia de los RPC no equivale a idempotencia DDL. Verificar historial, orden, dependencias y este hash en un nuevo preflight antes de autorizar SQL.

## Archivos de esta mejora

| Área | Archivos |
|---|---|
| Selector/panel | `components/PrivateOwnerFields.tsx`, `app/globals.css` |
| Validación/tipos/carga privada | `lib/private-commercial.ts`, `lib/private-commercial-server.ts` |
| Lectura autenticada del directorio | `app/api/propietarios/route.ts` |
| Guardado | `app/publicar/PublicarForm.tsx`, `lib/property-save-server.ts` |
| Esquema | `supabase/migrations/20261027142223_sprint3_owner_picker_pending.sql` |
| Pruebas | `tests/sprint3-commercial.test.mjs`, `tests/sprint3-commercial-rls.test.mjs`, `tests/property-write-errors.test.mjs`, `tests/profile-property-management.test.mjs`, `tests/commercial-properties.test.mjs`, `tests/synthetic-test-environment.test.mjs` |
| Documentación | Este informe, nota de vigencia del preflight y `PROJECT_STATUS.md`, `NEXT_STEPS.md`, `QRIH_AUDIT.md`, `QRIH_FUNCTIONAL_INDEX.md` |

`EditarPropiedadForm` y páginas privadas ya usaban el componente/cargador: reciben la mejora sin otra agenda ni cambios a sus rutas. El componente de directorio y su CRUD completo siguen vigentes; no se reemplazan por el buscador reducido. Se conservaron todos los cambios del Sprint 3 previos a esta tarea.

## Pruebas y evidencia

| Comprobación | Resultado local |
|---|---|
| Aplicación/API/regresión `npm test` | **288/288 PASS**, cero omitidas |
| PostgreSQL aislado `npm run test:rls` | **130/130 PASS**, cero omitidas |
| HTTP sobre build local `npm run test:http` | **39/39 PASS**, cero omitidas |
| TypeScript, lint, build Next | PASS |
| Preflight del bundle y diff-check | PASS; sin credencial privada examinada en cliente |

**457 pruebas automatizadas**; no se suman otra vez las ejecuciones focalizadas. La suite focalizada de aplicación Sprint 3 contiene 15 casos; la de BD incluye 18 subcasos y su caso padre (19 en el contador Node). PGlite usa fixtures A/B/admin/suspendido y baseline + 044–052 + cuatro migraciones, no base remota.

Cobertura obligatoria:

- Cero/una/tres/más de tres coincidencias y normalización de `JOSÉ`, `José`, `Muñoz`, espacios repetidos; top 3 exacto/inicio/parcial y exclusión de archivados.
- Selección con UUID, limpiar/cambiar, texto no confirmado bloqueado y pendiente con validación cliente/servidor/BD.
- Borrador con pendiente recuperable sin contacto definitivo; cargador de editor real probado y fallo de carga bloqueante.
- Alta y revisión atómicas, conservación de tokens/ID ante doble clic y reintentos; handler real de publicar ejecutado con mocks sin red, no sólo inspección del texto.
- Error de equivalente y error inducido **después** de insertar contacto pero antes de asociar: cero contacto huérfano y cero propiedad parcialmente creada. Posterior selección explícita del existente aceptada.
- Edición/duplicación a nuevo borrador, privados fuera de `p_changes`, fuente conservada, ID ajeno rechazado por API/RLS, B no lee pendientes de A, admin no busca en directorio ajeno desde picker.
- Transición heredada pendiente con propietario sin finalizar falla al ejecutar constraints diferidos. La misma suite preserva pruebas de moderación/publicación/auditoría sin privados.
- Navegador con componente real y servidor de fixtures sin Supabase: tres resultados, selección mediante flecha+Enter, UUID recibido en FormData, creación pendiente por click sin POST de contacto, campos opcionales, error de búsqueda sin pérdida de texto y limpieza. Evidencia `../../evidence/sprint3-owner-picker-pending.png`. La pestaña/servidor temporal se retiraron al terminar; no hubo formularios enviados al backend real.
- HTML comercial real renderizado con canarios extra en `pending_owner`, nombre interno y contacto: ningún canario aparece. El loader conserva su allowlist pública y no consulta tablas privadas.
- **PDF binario nuevo generado por el GET real** con datos exclusivamente sintéticos, renderer real e imágenes omitidas por mock del preparador: HTTP 200, PDF/no-store, 1 página. Texto extraído y metadatos inspeccionados con pypdf: ningún `PRIVATE_CANARY`, ni dirección privada; título comercial presente. PNG renderizado con Poppler e inspeccionado sin recortes/solapamientos. Artefactos de prueba: `../../evidence/sprint3-owner-picker-privacy.pdf` y `.png`. No es certificación de descarga hospedada ni de imágenes remotas.

Incidencias resueltas durante pruebas: el bloqueo de fila después de transicionar a pending chocaba con UPDATE RLS de borrador; se corrigió el orden sin ampliar permisos. El handler de alta ocultaba el mensaje de equivalencia con un catch genérico; ahora conserva el mensaje controlado. El contador esperado de suites bajo entorno hostil pasó de 51 a 53 por los dos casos API nuevos, sin eliminar casos. El renderizador PDF inicial carecía de config de fuentes; se detuvo su proceso y se renderizó con config/cache locales y fuentes del runtime, sin modificar el PDF ni dependencias.

Guías usadas para mantener autorización por fila e invocación segura: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [funciones](https://supabase.com/docs/guides/database/functions). Changelog oficial revisado mediante HTML por incompatibilidad de contenido markdown; sin cambio de versiones ni actualizaciones de dependencias.

## Riesgos y preparación para STAGING

1. **NO-GO sigue vigente:** respaldo actualizado/recuperación y acceso administrativo aún pendientes. Se requiere un preflight nuevo que incluya cuatro migraciones y el nuevo corte. Esta entrega no autoriza ninguna de ellas ni despliegue.
2. El build local en `http://localhost:3110` está disponible, pero conectado al esquema STAGING aún sin habilitar: el selector real mostrará «por habilitar». La funcionalidad se verificó con BD aislada y navegador sintético, no con contactos reales.
3. Contención de dos conexiones reales y validación integrada hospedada permanecen pendientes del gate anterior. Los locks e idempotencia locales no se presentan como prueba multisesión real. Prueba táctil física en dispositivo real pendiente; controles nativos y áreas de toque implementados, teclado/ratón comprobados.
4. No se agregan constraints de unicidad global sobre nombres existentes. La equivalencia exige nombre+empresa normalizados; homónimos requieren elección explícita y revisión del asesor. No se deduplican ni sobrescriben datos históricos.
5. Respuestas de red perdidas pueden dejar fotos subidas sin referencias, según el flujo heredado; se preservan hasta conciliación autorizada para no borrar objetos potencialmente confirmados. La prueba demuestra rollback de contacto/asociación/filas, no rollback de bytes de Storage externos.
6. No se volvieron a consultar las 26 huellas remotas en esta tarea; la última comparación íntegra es la del preflight previo. Aquí no hubo escritura de propiedades, contactos, estadísticas ni una nueva visita pública real. Las comprobaciones de configuración de build/inicio son lecturas de límite cero.

**Dictamen:** GO para revisión de código y pruebas locales de esta mejora; **NO-GO para aplicar SQL, desplegar o cerrar validación integrada de Sprint 3**. Trabajo detenido en la entrega solicitada, sin solicitar ejecución implícita de acciones remotas.
