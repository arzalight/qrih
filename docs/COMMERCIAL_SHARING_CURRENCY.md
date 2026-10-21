# QRIH — Compartir y monedas / entrega local

## Resultado posterior vigente

[RC publicado y aceptación](commercial-deploy-verification-2026-10-20.json) / [informe](COMMERCIAL_INTEGRATION_2026-10-20.md):052 integrada una vez, respaldo verificado, cinco correccionesUSD confirmadas, AUD042 desplegado/verificado. RC5f7b8e2 READY/publicado,157unit/31HTTP remotos y ficha/galería/PDF/filtros PASS. EdiciónUSD y precarga duplicado reales con fixture existente, sin alta nueva. **NO-GO comercial** hasta altaUSD/duplicado completo/revisión monetaria en alcance adicional autorizado. AUD043MEDIO: linkPDF a permalink200, canónico pendiente futuro. Los estados inferiores son el diseño/entrega iniciales, no nuevos gates de backup/migración/deploy.

### Entrega inicial — antecedente

20 de octubre de 2026. **NO-GO para el nuevo alcance comercial hasta RC y aceptación remota.** [Actualización vigente de integración/AUD041/AUD042](COMMERCIAL_INTEGRATION_2026-10-20.md): respaldo local+Drive verificado,052 aplicada una vez, cinco precios USD confirmados y corregidos,157unit/109SQL PASS y ficha/PDF reales desde localhost contra STAGING revisados. El GO anterior no aprueba automáticamente el alcance nuevo. Las secciones inferiores conservan el diseño/recibo de entrega inicial; sus pendientes de copia/052/locales han sido superados por el informe vigente, no deben repetirse.

## Decisiones del usuario

- «Sí, todos son MXN»: confirma la moneda histórica. La migración propone asignar únicamente MXN, sin modificar importes.
- «Sólo se puede compartir una propiedad cuando ya se encuentra publicada»: sustituye el requisito inicial de compartir no publicadas mediante tokens. No se implementan tokens, expiración configurable ni revocación individual; esos casos no aplican al alcance confirmado.
- Inicialmente autorizada sólo la ejecución de SQL temporal; ensayo terminado. El20oct el usuario indicó «continúa hasta deploy si no requieres intervención»: autoriza entrega GitHub e integración052/RC en STAGING tras sus controles, nunca producción/main. **052 aún NO aplicada.** La nueva captura/transferencia necesaria conserva su alcance y confirmación propios.

## Inspección y dependencias comprobadas

Base Git inicialmente limpia en `develop`, `7b392d8e80c5eab3f302487c2356228e0d8c0aee`. Rama de trabajo `feature/commercial-sharing-currency`; código/pruebas entregados en GitHub `715e42acf27a515721229a7aab75c8c241640194`. Los41archivos funcionales coinciden con el recibo local. `main` conserva `55b773756066cd3975b3964dc67f106cf15ead4c`; develop sin integrar, sin migración/deploy nuevos. [Gate actual](COMMERCIAL_DEPLOY_GATE_2026-10-20.md).

Next.js 16.3.6 / React / Supabase SSR y JS / react-pdf / sharp ya instalados. No nuevas dependencias, proveedores, costos o cambios al lockfile. PostgreSQL temporal usa el PGlite externo ya disponible; no Docker/Rancher, .env, credenciales, datos reales ni conexión a Supabase.

Se comprobaron `properties`, `properties_public`, `property_images`, `profiles`, bucket privado `property-images`, `price_value numeric`, `price_unit text`, `price_display`, `main_image_path` y `storage_path` en el baseline y migraciones versionados. La última migración previa es la 051. Esta inspección no reemplaza un preflight vivo del proyecto `mcyxunymhuxyiwklyfpy`; no se usó el conector Supabase de otro proyecto.

## Implementado en código

### PROP-008 — Compartir propiedad publicada

- Tarjetas de Mis propiedades: Compartir junto a Editar/Duplicar. Menú con Abrir ficha digital, Copiar enlace y WhatsApp mediante `wa.me` y texto codificado. No envía mensajes automáticamente.
- Ruta estable `/ficha/[slug]`, renderizada en servidor. Cliente público anónimo, proyección comercial explícita y `status = published`, además del filtro vigente de estado/cuenta de `properties_public`.
- Se deniega también al propietario/admin una ficha pública de propiedad no publicada: nunca se heredan cookies para ampliar esa superficie.
- Portada, galería, características, ubicación autorizada, descripción, precio/moneda y descarga PDF. Sin Header, footer visible, captación, edición, administración ni datos de contacto. No se inventa autorización para hacer públicos los datos del asesor.
- Dirección redactada según `location_visibility`. Fotografías mediante el autorizador existente y firmas efímeras en servidor; no URL pública ni persistencia de firmas.
- Mis propiedades deshabilita Compartir si el estado no es published, la cuenta no está activa o `publications_enabled` no es true. Esto mejora la UI, pero **la autorización real sigue en servidor/BD**, no en el botón.
- Cabeceras no-store/no-referrer/noindex; sin Auth ni refresh en la ficha pública. Footer conservado en las otras rutas con un wrapper pequeño; no se mueven páginas ni cambia la arquitectura de autenticación.

### PRICE-001 — MXN / USD

- Selector obligatorio en publicar/editar/duplicar/admin. El servidor de edición/duplicación exige moneda válida, importe decimal y presencia explícita del campo unidad. Un valor heredado desconocido no se convierte silenciosamente en NULL.
- `price_currency` es la única columna nueva propuesta, limitada a MXN/USD. `price_value` **permanece numeric**, sin conversión, redondeo, cambio de escala ni reescritura de cantidades históricas.
- Importes de escritura como cadenas decimales, cálculo comercial con BigInt y formato centralizado en `lib/property-price.ts`. Se conservan fracciones de hasta 12 decimales, en vez de forzar a redondear los históricos a centavos. Casos fuera de ese formato requieren revisión explícita; no se reinterpretan por inferencia.
- `price_value_text:price_value::text` es **un alias de lectura PostgREST, no otra columna**, para evitar pérdida de precisión por JSON number. Catálogos/RPC comerciales devuelven también el equivalente textual.
- Moneda y unidad conservadas en edición y duplicación; formulario heredado requiere un importe numérico explícito cuando antes sólo había texto/NULL. No se adivina un importe a partir de `price_display`.
- Misma función de formato/cálculo para tarjetas, catálogo, detalle, paneles, solicitudes, ficha y PDF. PDF muestra precio anunciado y total calculado cuando corresponde. Venta no recibe mensualidad; se conserva la convención previa del portal Renta/mes y las unidades m²/total/sin unidad. No hay un campo de periodicidad distinto en el esquema inspeccionado; no se añade uno ni se convierten rentas a otro período.
- Filtro del catálogo por moneda. Si se pide un rango, exige también operación y unidad: no compara USD/MXN, venta/renta ni precio por m²/total como equivalentes. Sin tipo de cambio ni conversión implícita.
- Requerimientos no tienen moneda de presupuesto en el esquema actual. Su componente de coincidencia por precio queda en cero hasta tener moneda explícita compatible; siguen operación, ubicación y superficie, sin inventar MXN para presupuestos. SQL y TypeScript mantienen la misma regla. Agregar moneda de presupuestos es una fase posterior separada.

## Migración propuesta, NO aplicada a servicios

`supabase/migrations/20261020212846_052_commercial_currency.sql`, creada vacía mediante el CLI oficial y completada como propuesta.

Efectos exactos:

1. Transacción con límites de espera y tiempo; exige `price_value numeric`.
2. Añade `price_currency text NOT NULL DEFAULT 'MXN' CHECK (...)`. El default constante asigna MXN histórico sin UPDATE de filas, importes, unidades, estados o updated_at.
3. Conserva temporalmente el default MXN para el cliente publicado anterior, cuyo formulario sólo manejaba pesos. Las nuevas UI/API sí exigen selección explícita. La duplicación anterior, que no envía el nuevo campo, hereda la moneda del origen propio; nunca reemplaza USD por MXN ni acepta NULL/moneda ajena.
4. Actualiza las listas y asignaciones monetarias de `qrih_update_property_with_images` y `qrih_duplicate_property`, preservando propiedad/actor activo, estados, bloqueo optimista, idempotencia, auditoría y galería independiente.
5. Añade sólo moneda a la vista pública manteniendo orden, filtro, redacción de dirección, barrera y ACL; no crea políticas públicas ni añade indiscriminadamente futuras columnas.
6. Enriquece únicamente inmuebles públicos del catálogo del asesor y listados autorizados de oportunidades con moneda y lectura decimal textual. Sigue excluyendo teléfono/WhatsApp.
7. Ajusta sólo el componente presupuestario del matching cuando falta moneda. No altera sus pesos restantes, permisos, buckets ni límite de siete fotos.

**Compatibilidad de despliegue:** aunque las escrituras anteriores siguen funcionando, la versión Netlify previa no sabe mostrar USD. **No publicar USD ni abrir el nuevo alcance comercial antes de un RC nuevo expresamente autorizado y validado.** No ejecutar automáticamente la 052, reenviar 001–051 ni intentar rollback destructivo.

## Resultados locales

| Verificación | Resultado y alcance |
| --- | --- |
| Pruebas de aplicación | 156 PASS, 0 fallos, 0 omisiones; incluye 18 nuevas frente al corte 138 |
| PostgreSQL temporal | 109 PASS, 0 fallos, 0 omisiones; incluye 16 de la nueva suite 052 |
| TypeScript / lint / build | PASS local; no certifica configuración ni API alojadas |
| Preflight | PASS local y bundle sin la credencial privada examinada; no prueba servicios activos |
| HTML | SSR real de componentes con fixture sintético, revisión de escritorio/375/320 px; no sesión ni interacción hidratada |
| PDF | Ruta real renderizada con cargador/bytes sintéticos aislados; dos páginas revisadas y texto extraído con precio anunciado USD, total, unidad y sin dirección privada |
| SQL histórico | Filas completas antes/después, excluyendo sólo columna nueva, iguales; numeric fraccional/NULL, updated_at, políticas, flags RLS y metadatos Storage conservados |
| STAGING de esta entrega | NO APLICADO / NO VALIDADO; tampoco nuevo test HTTP contra el artefacto alojado anterior |

Los fallos intermedios se corrigieron antes del PASS: expectativa antigua del formato en un test; cargador de TSX adaptado a las herramientas instaladas; fixture SQL de duplicación completado con su campo obligatorio location_visibility y rollback del harness corregido. No se debilitaron restricciones de BD para aprobarlos. La revisión de SQL corrigió también una condición inicialmente ubicada sobre superficie en vez de presupuesto, antes de dar por buena la prueba.

La revisión del PDF detectó una ruta local de logotipo inexistente `/icons/qrih.png`: se reemplaza por marca textual QRIH. Se evita encabezado Descripción aislado al pie de página. Son ajustes locales de presentación; no garantizan todos los documentos/datos reales.

## Archivos modificados y trazabilidad

El [recibo local](commercial-local-2026-10-20.json) contiene el inventario completo de archivos y huellas de los cambios funcionales; no incluye secretos ni imágenes reales.

| Archivos | Cambio | Riesgo de integración |
| --- | --- | --- |
| app/ficha/[slug]/page.tsx; components/CommercialPropertySheet.tsx; lib/commercial-property-server.ts | Ficha nueva y cargador compartido de allowlist pública | Alto hasta validar publicación/cuenta/Storage en servicios |
| components/SharePropertyButton.tsx; lib/property-sharing.ts; app/mis-propiedades/page.tsx | Menú de compartir, sólo published y cuenta habilitada | Medio: navegador/portapapeles/WhatsApp reales pendientes |
| app/layout.tsx; components/PortalFooter.tsx; app/globals.css; proxy.ts | Presentación sin footer y headers/cache de ficha | Medio: SSR/navegación hidratada pendientes |
| lib/property-price.ts; components/PriceCurrencySelect.tsx | Formato decimal/cálculo, moneda y validación central | Alto por dato comercial; pruebas locales acotadas |
| app/publicar/PublicarForm.tsx; app/publicar/page.tsx; editor de Mis propiedades (page.tsx y EditarPropiedadForm.tsx); lib/property-save-server.ts | Selección/persistencia/lectura exacta de precio y moneda en creación, edición y copia | Alto: contratos 052 y concurrencia real pendientes |
| app/bodegas/[slug]/page.tsx; app/api/bodegas/[slug]/pdf/route.tsx | Formato único; PDF comparte cargador con ficha | Medio: PDF y datos reales en proveedor pendientes |
| components/PropertyCard.tsx; app/page.tsx; app/inventario/page.tsx; components/InventoryFilters.tsx | Precio/currency/lectura textual y filtro comparable | Medio: casting PostgREST/consulta real pendientes |
| app/admin/page.tsx; app/admin/[id]/page.tsx; components/AdminPropertiesTable.tsx; app/admin/asesores/[id]/page.tsx; app/mis-propiedades/[id]/solicitudes/page.tsx; app/busco-bodega/page.tsx | Propagación de moneda en paneles, tarjetas y solicitudes | Medio: formularios con sesión legítima pendientes |
| lib/matching.ts; 052_commercial_currency.sql | No puntuar presupuestos de moneda desconocida; RPC/catálogos y dato monetario | Alto: evaluar transición, no inferir presupuestos MXN |
| tests/commercial-properties.test.mjs; tests/commercial-properties-rls.test.mjs; suites de imagen, oportunidades SQL, gestión, errores, SSR, flujos staging y entorno sintético; package.json | Casos nuevos e integración con suites existentes; sin nuevas dependencias | Pruebas sintéticas, no aceptación alojada |
| PROJECT_STATUS.md; QRIH_FUNCTIONAL_INDEX.md; QRIH_AUDIT.md; NEXT_STEPS.md; documentos de operaciones/reanudación/GO/RC anteriores y esta entrega/recibo | NO-GO actual separado de evidencias anteriores | Ningún documento activa funciones ni deploy |

Permanecen sin modificar los optimizadores WebP, uploader/editor de imágenes, galería interactiva, firmador/autorizador existente, Auth, clientes privilegiados, configuración/credenciales, lockfile y migraciones 001–051. No se cambian buckets ni políticas RLS. El catálogo del asesor utiliza la tarjeta compartida y el RPC propuesto; su página no requiere cambio específico.

## Matriz de aceptación pendiente en STAGING

| Caso | Resultado esperado | Evidencia local | STAGING nuevo |
| --- | --- | --- | --- |
| Compartir published anónimo | Ficha sólo comercial; URL estable | Helper/SSR/SQL PASS | Pendiente |
| Copiar enlace / WhatsApp | URL correcta, sin enviar mensaje automático | Codificación/helper PASS; interacción pendiente | Pendiente |
| draft/pending/paused/rejected/expired/pending_update | Sin enlace habilitado y sin lectura pública/nuevas firmas | UI helper y SQL PASS | Pendiente |
| Enlace con slug inexistente/manipulado | No información ajena ni fallback privilegiado | Selector parametrizado/helper PASS | Pendiente HTTP |
| Suspender/deshabilitar publicaciones/retirar inmueble | Nueva ficha y nuevas firmas denegadas | SQL PASS | Pendiente con fixture autorizado |
| Revocar/expirar token privado | No aplica: usuario prohibió compartir no publicadas | Sin tokens implementados | No aplica |
| Dirección/contacto no autorizados | No se incluyen | SSR/allowlist/SQL PASS | Pendiente inspección |
| Fotos privadas / máximo 7 / WebP | Sólo rutas autorizadas y límite vigente | Regresiones SQL/imagen PASS; Storage físico nuevo no probado | Pendiente |
| Crear MXN / USD | Moneda y decimal exactos | Parser/SQL/validación PASS; formulario real pendiente | Pendiente |
| Editar / duplicar | Moneda, unidad, decimal, portada y fuente conservados | API sintética y SQL PASS | Pendiente |
| Admin / catálogo asesor / tarjetas / solicitudes | Importe, moneda y unidad consistentes | Código/tipos/SQL/formato PASS | Pendiente |
| Ficha / PDF | Precio anunciado y total coinciden | SSR + PDF sintético real PASS | Pendiente con fotos autorizadas |
| Históricos | Sólo columna moneda MXN; ningún importe/estado/unidad modificado | Snapshot SQL completo PASS | Pendiente huellas antes/después |
| Filtros | Rango sólo con moneda/operación/unidad; sin conversión | Validación decimal PASS | Pendiente API real |
| Sesión prolongada / retiro tras firma | Sin firmas nuevas; anteriores pueden durar TTL | Mecanismo previo conservado, no prueba prolongada nueva | Pendiente según alcance |
| Escritorio / móvil | Lectura y controles utilizables, sin footer/captación | SSR estático inspeccionado 1280/375/320 | Pendiente Safari/UI hidratada |

## Riesgos y límites

- **ALTO, riesgo de transición confirmado en código:** el artefacto alojado anterior ignora USD. No se afirma que ya existan propiedades USD mal publicadas; usuario confirmó históricos MXN. Bloquear publicación USD hasta nuevo RC.
- **ALTO, gate de integración pendiente:** 052 todavía no aplicada ni contrastada con esquema vivo/ACL de STAGING. PASS en PostgreSQL temporal no equivale a Supabase administrado.
- **MEDIO, limitación conocida:** la ficha deja de servirse al retirar/suspender según el filtro vigente, pero firmas ya emitidas pueden funcionar hasta 900 s para galería o 300 s para PDF; PDF descargado no revocable. No se promete revocación inmediata ni individual de enlaces públicos estables.
- **MEDIO, deuda de modelo delimitada:** presupuesto sin moneda no aporta puntuación económica. Unidades desconocidas, numeric NULL o precisión fuera del formato no se fuerzan ni redondean; revisión explícita si aparecen en datos reales.
- **BAJO / presentación, corregido localmente:** logotipo PDF inexistente y encabezado huérfano del fixture.
- Ninguna vulnerabilidad crítica nueva confirmada; la ausencia de prueba no demuestra seguridad universal. AUD-018/recuperación integral/carga y demás límites previos siguen con su alcance, no se cierran por estas funciones.

## Procedimiento siguiente, sin ejecutar automáticamente

1. Continuación hasta deploy autorizada. Primero completar el gate pendiente de nueva copia cifrada local+Drive del estado actual, previa confirmación de su alcance. Después comprobar proyecto exacto, esquema vigente/baseline+044–051, ausencia de052, tipos/constraints, cuota y ventana sin escrituras concurrentes. No repetir herramientas antiguas bloqueadas ni reutilizar recibos consumidos.
2. Conservar huellas agregadas antes de propiedades completas, cantidades/unidades/estados, perfiles, galería, Storage, RLS y ACL. Preparar operación coordinada: ninguna publicación USD sobre el código Netlify anterior.
3. Aplicar sólo 052 una vez si se autoriza. Comparar huellas excluyendo sólo price_currency; exigir MXN histórico, mismas cantidades, misma privacidad y ACL. Ante discrepancia detenerse, no convertir importes ni borrar/normalizar datos.
4. Iniciar localhost con esta rama contra QRIH STAGING, con sesión legítima y fixtures sintéticos acotados autorizados. Ejecutar la matriz nueva sin usar inmuebles reales como pruebas destructivas ni aceptar términos por el usuario.
5. Revisar/versionar/entregar la rama a GitHub con permiso; integrar en develop sin tocar main. Preparar manifiesto/RC nuevos: los 180 hashes del candidato previo no describen esta entrega.
6. Sólo con autorización separada y cuota Free suficiente: un RC Netlify, verificar SHA/READY, humo y matriz comercial; después reevaluar GO. Sin deploy sólo documental.

El servidor antiguo de localhost:3107 se detuvo durante la compilación y no se reinicia con esta rama incompatible con la BD todavía sin 052. La vista sintética es temporal y no es el portal autenticado.

## Documentación técnica consultada

- [Supabase changelog](https://supabase.com/changelog.md): revisado para cambios relevantes; no se cambian SMTP, TLS, esquemas reservados ni proveedor.
- [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) y [Storage firmado](https://supabase.com/docs/reference/javascript/storage-from-createsignedurl).
- [PostgREST: casting de columnas](https://docs.postgrest.org/en/stable/references/api/tables_views.html#casting-columns): lectura numeric como texto; filtros siguen sobre numeric, no sobre casts.
- Guías de Next instaladas: layouts/pages, Route Handlers y usePathname. Las guías Supabase/PostgreSQL guiaron ACL, numeric y autorización; la guía PDF exigió render y revisión visual, no sólo extracción de texto.
