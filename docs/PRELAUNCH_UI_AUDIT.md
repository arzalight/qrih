# QRIH — Auditoría UX/UI previa al rediseño

**Actualización posterior:** referencia AVIF recibida/inspeccionada; el diagnóstico inferior conserva su corte anterior. Implementación incremental y estado de correcciones en [seguimiento visual](PRELAUNCH_UI_IMPLEMENTATION.md). No interpretar la solicitud de imagen inferior como pendiente vigente.

## Corte y dictamen

20oct2026, 22:09 CDMX / 21oct2026, 04:09 UTC. Base `1992ca81e9967ee2946133154c81a0b6597c7399`; rama local `feature/prelaunch-ui-review`, creada desde `develop` limpio. `main` no se modifica. **Fase 1: inventario y diagnóstico inicial completados con límites explícitos. Fases 2–10: pendientes; NO-GO del nuevo alcance visual.** Ninguna corrección de interfaz implementada en este corte.

El GO condicionado anterior corresponde exclusivamente al RC publicado `5f7b8e2` y a su aceptación documentada. No aprueba un rediseño futuro ni representa certificación WCAG. No se hizo push, deploy, cambio de Supabase, migración o escritura de negocio por esta revisión. Se conservaron sesiones y datos; no se enviaron correos/contactos, no se guardaron formularios ni se aceptaron términos. La lectura normal del detalle puede registrar visualizaciones mediante su comportamiento existente; no se garantiza ausencia absoluta de telemetría de lectura.

La solicitud contiene una referencia estética a una imagen, pero el adjunto disponible contiene únicamente `Pasted text.txt`. La respuesta posterior «adjunta» tampoco incluyó un archivo gráfico visible para esta sesión. **Referencia gráfica pendiente de reenvío antes de concretar el lenguaje visual final.** La paleta del texto es una propuesta utilizable, no un diseño ya aprobado o implementado.

## Método y evidencia

- Inventario de los 25 `app/**/page.tsx`, componentes, raíz, CSS y rutas API relacionadas con los flujos recientes. Lectura dirigida de renderizado, contratos, condiciones y estilos; no una nueva certificación integral de seguridad ni lectura exhaustiva de toda la lógica de administración.
- Next.js App Router, React, CSS global sin biblioteca UI adicional. `app/layout.tsx` importa `globals.css`, 1.380 líneas / 25.233 bytes; `PortalFooter` omite el footer en `/ficha/`. Cada página decide su cabecera. Administración no comparte la cabecera pública. No hay un sistema de layouts privados unificado.
- Muchos estilos incrustados: 106 apariciones `style={` en `mis-propiedades/page.tsx`, 86 en `admin/[id]/page.tsx`, 76 en `admin/asesores/[id]/page.tsx`; son conteos de código, no errores por sí mismos. `Header.tsx` tiene 521 líneas, mezcla presentación y manejo existente de sesión/notificaciones.
- Navegador integrado, localhost:3107, build de la base anterior y sesión legítima existente. 19 vistas/estados × 4 anchos = **76 mediciones** a 375, 768, 1024 y 1440 px, altura 1.000 px. Se esperó explícitamente el formulario de publicación tras verificar sesión; su captura transitoria vacía no se aceptó como resultado final.
- Capturas locales antes del cambio en `work/prelaunch-ui-before/` del espacio de trabajo de esta conversación; no se agregan fotos reales, capturas privadas o PDFs al repositorio. Se conservaron vistas superiores representativas, no un examen visual de cada píxel de las 76 páginas completas.
- Ninguna de las 76 mediciones mostró `body.scrollWidth` mayor al ancho. **Esto NO implica reflow correcto:** a 768 px los precios se recortan dentro de las tarjetas. Se revisaron capturas y geometría, no sólo ancho del documento.
- Galería comercial real: al abrir, `document.activeElement` seguía en «Ampliar Foto 1», fuera del elemento `role=dialog`. Escape/click y flechas existen en código; no hay captura/restauración del foco ni contención de Tab. No se modificaron fotos.
- Sesión local no administradora: `/admin` muestra «Acceso restringido» en los cuatro anchos. Sólo se verificó esa denegación, NO las tablas ni la moderación con administrador. No se copiaron cookies, tokens ni credenciales entre sesiones.
- Formularios leídos sin guardarlos. No se probaron de nuevo altas, retiro, reenvío, eliminación, autorización de contactos ni cambio de contraseña reales. Su aceptación comercial previa conserva su alcance/fecha, no se convierte en nueva prueba UX.

## Inventario de pantallas reales

Fuente de cada ruta: `app` + ruta + `/page.tsx`, salvo `/` (`app/page.tsx`). C = código inspeccionado; V = render local representativo en cuatro anchos; P = variante visual pendiente. Son IDs nuevos del inventario visual; no reemplazan IDs funcionales del índice SIGMA.

| ID | Ruta / estado | Función y componentes principales | Evidencia / límite |
| --- | --- | --- | --- |
| UI-001 | `/` | Hero, buscador GET, `PropertyCard`, selección pública | C/V; lectura real de precios y fotos |
| UI-002 | `/inventario` | Filtros existentes, moneda/unidad/rango y tarjetas | C/V; recorte de precio confirmado en tableta |
| UI-003 | `/bodegas/[slug]` | Galería, precio/total, características, contacto y PDF | C/V; no contacto enviado; hidratación asíncrona del contacto |
| UI-004 | `/ficha/[slug]` | `CommercialPropertySheet`, galería, precio/PDF, sin captación | C/V; cero cabeceras/footers, sin campos de formulario |
| UI-005 | `/asesor/[public_id]` | Catálogo público por RPC, avatar, contactos autorizados y tarjetas | C; P de un catálogo concreto en esta auditoría |
| UI-006 | `/mis-propiedades?view=properties` | Datos propios, métricas reales, portadas/acciones | C/V; sesión legítima, no mutaciones |
| UI-007 | `/mis-propiedades?view=requirements` | Requerimientos propios/coincidencias | C/V; navegación por query existente |
| UI-008 | `/mis-propiedades?view=opportunities` | Requerimientos compatibles para postular propiedad | C/V; no postulaciones nuevas |
| UI-009 | `/mis-propiedades/[id]/editar` | `EditarPropiedadForm`, moneda y `PropertyImageEditor` | C/V; borrador sintético previo de siete fotos, sin guardar |
| UI-010 | `/publicar?duplicar=[id]` | Precarga del editor compartido, copia independiente al guardar | C/V; sin nueva copia; no confundir precarga con duplicación persistida |
| UI-011 | `/mis-propiedades/[id]/solicitudes` | Solicitudes/autorizaciones propias | C/V; estado vacío de fixture; acciones con solicitudes pendientes P |
| UI-012 | `/perfil` | `ProfileInfoForm`, avatar, redes y catálogo | C/V; no información modificada |
| UI-013 | `/notificaciones` | Avisos y contactos sujetos a autorización | C/V; no nueva lectura marcada mediante el menú |
| UI-014 | `/publicar` | `PublicarForm`, moneda, zonas, WebP, portada, borrador/revisión | C/V; no alta ni aceptación legal |
| UI-015 | `/busco-bodega` | Requerimiento, campos industriales y confirmación | C/V del formulario; éxito/envío P |
| UI-016 | `/login` | `Header`, formulario, aviso de correo, recuperación | C/V; no contraseña ingresada ni sesión cambiada |
| UI-017 | `/registro` | Formulario y resumen previo a crear cuenta | C/V de formulario; resumen en código, no cuenta creada |
| UI-018 | `/recuperar-contrasena` | Correo, espera/cooldown, estados de error | C/V de formulario; no correo enviado |
| UI-019 | `/restablecer-contrasena` | Validación de recovery en servidor, formulario autorizado | C; P en este corte; no solicitar/consumir enlace para simple inspección visual |
| UI-020 | `/panel` | Pantalla antigua con cuatro cifras literales en cero | C/V; distinta del panel real y todavía accesible |
| UI-021 | `/admin` | Métricas reales, pendientes, filtros, `AdminPropertiesTable` | C; V sólo acceso restringido, interior P |
| UI-022 | `/admin/[id]` | Moderación, galería y edición administrativa | C dirigida; P con rol válido |
| UI-023 | `/admin/asesores` | Búsqueda, tabla, estados y enlaces | C dirigida; P con rol válido |
| UI-024 | `/admin/asesores/[id]` | Cuenta/asesor y controles administrativos | C dirigida; P con rol válido |
| UI-025 | `/admin/historial` | Filtros de eventos y registros | C dirigida; P con rol válido |
| UI-026 | `/admin/configuracion` | `PlatformSettingsForm`, configuración existente | C dirigida; P con rol válido; no cambiar ajustes al probar apariencia |
| UI-027 | `/terminos` | Contenido legal y cabecera/footer | C; visual P; contenido no se reescribe como diseño |
| UI-028 | `/privacidad` | Contenido legal y cabecera/footer | C; visual P; contenido no se reescribe como diseño |

Hay 28 entradas porque se separan las tres vistas del panel y la duplicación; corresponden a **25 archivos de página**, no 28 rutas físicas nuevas. `/auth/callback` es un Route Handler, no una pantalla adicional; confirma/redirige al flujo existente. `/api/bodegas/[slug]/pdf` produce PDF; no se confunde con la ficha HTML.

## Funcionalidades recientes verificadas en código

| ID funcional existente | Estado implementado | Archivos / contratos a preservar |
| --- | --- | --- |
| PROP-003 | Edición draft/rejected; published requiere confirmar retirada antes de editar | `ManagePropertyActions.tsx`, editor, `/api/retirar-propiedad`, `/api/editar-propiedad`; NO cambiar transiciones |
| PROP-006 | Duplicación con precarga y persistencia independiente al guardar | `app/publicar/page.tsx`, `EditarPropiedadForm.tsx`, `/api/duplicar-propiedad`; NO convertir GET en escritura |
| PROP-007 | Portada privada, principal y renovación/reintento acotado | `OwnPropertyCover.tsx`, endpoint `portada`, `PropertyImageEditor`; NO usar URLs públicas/persistir firmas |
| PROP-008 | Compartir exclusivamente published/cuenta habilitada | `SharePropertyButton.tsx`, `property-sharing.ts`, ficha/cargador público; NO habilitar estados adicionales |
| PRICE-001 | MXN/USD en alta/editor/tarjetas/administración/ficha/filtros | `PriceCurrencySelect.tsx`, `property-price.ts`, proyecciones vigentes; conservar cifras, moneda, unidad y reglas de comparación |
| PDF-001 | Ruta existente con información y precios del contrato compartido | No modificar renderer/URLs/firmas por un simple cambio de CSS; AUD-043 sigue separado |

Estas funciones están implementadas; no son tareas nuevas de negocio. No se deduce funcionalidad del texto de los documentos. Por el contrario, `/panel` contiene un marcador antiguo, y no debe presentarse como panel real. `AdminPropertiesTable` **sí tiene paginación**: 35 filas inicialmente, opciones 20/35/50/60/100, recorte y botones; no crear otra paginación ni afirmar que falta.

## Matriz inicial de hallazgos

Todos siguen **ABIERTOS / NO CORREGIDOS** en este corte. Severidad UX no equivale a vulnerabilidad de seguridad. No se confirmó aquí un defecto crítico de seguridad; tampoco se certifica toda la seguridad de nuevo.

| ID | Severidad / certeza | Evidencia | Impacto / corrección mínima prevista |
| --- | --- | --- | --- |
| UX-001 | ALTO / confirmado visual y código | `.cards` conserva tres columnas hasta 760px; en inventario a768, tarjeta≈133,73px; a1024≈210,53px. Precio USD recortado por `overflow:hidden` de tarjeta | Impide leer importe/unidad. Grid según ancho disponible y columnas intermedias; precio con reflow explícito; no alterar valores |
| UX-002 | ALTO / confirmado código/DOM | Login con dos placeholders sin label; registro con seis labels separados sin htmlFor/id; alta/editor con 15 campos sin asociación y títulos de fotos sólo placeholder; requerimiento/contacto similares | Nombre/propósito poco claro y etiquetas que desaparecen. Labels persistentes vinculados, instrucciones y errores asociados; no cambiar nombres/required/payload/reglas |
| UX-003 | ALTO / confirmado interacción/código | `PropertyImageGallery.tsx`: modal abre con foco en botón de fondo; role/aria-modal sin contención del teclado | Usuarios de teclado pueden interactuar fuera del visor. Modal nativo o manejo mínimo de foco, Tab/Shift+Tab/Escape y retorno al disparador; conservar galería y firmas |
| UX-004 | MEDIO / confirmado cálculo de pares de color | Muted `#71818A` sobre blanco≈4,03:1; pending `#8A7130` sobre `#F7F0DC`≈4,11:1; se usan en texto pequeño | Insuficientes para texto normal objetivo AA. Oscurecer tokens de texto/estados y medir sus pares reales; no depender sólo del color |
| UX-005 | MEDIO / confirmado código, evaluación completa pendiente | Header sin estado de ruta activo/aria-current; disclosure de perfil sin aria-expanded/aria-controls, Escape no manejado; enlaces principales comprimidos a768 | Orientación y teclado inconsistentes. Nav con estado accesible, cierre/foco predecibles y breakpoint según contenido; no derivar permisos desde metadata editable |
| UX-006 | MEDIO / confirmado código/render | `app/panel/page.tsx` muestra cuatro ceros literales y «Conecta tu cuenta de Supabase…», aunque existe panel real conectado | Mensaje engañoso. Compatibilidad mínima propuesta: redirigir `/panel` a `/mis-propiedades` en servidor; no crear métricas ni cambiar permisos |
| UX-007 | MEDIO / confirmado código | `app/mis-propiedades/page.tsx:376`, saludo literal «HOLA, FABIÁN» | Identidad incorrecta para otras cuentas. Saludo neutro o nombre del perfil ya autorizado; no nuevas consultas/claims privilegiados |
| UX-008 | MEDIO / confirmado código/capturas | Botones negro/cian/dorado/gris con radios/paddings diferentes; cardBody, panel y admin tienen estilos duplicados | Jerarquía difusa y costo de mantenimiento. Tokens/variantes compartidos, extracción gradual; no reemplazo global ciego ni segunda biblioteca |
| UX-009 | MEDIO / confirmado código, reproducción del éxito pendiente | Overlay de éxito en `PublicarForm` usa divs, sin semántica modal/foco; mensajes de login/alta sin live region consistente | Éxito/error puede pasar inadvertido. Unificar mensajes/status y diálogo donde corresponde sin tocar guardado, temporizador o destinos |
| UX-010 | MEDIO / riesgo de rendimiento, no métrica de campo | `PropertyCard` usa backgroundImage (sin alt/lazy); galería carga todas con img sin loading diferido; foto de ficha fija a360px | Revisar img semántica y tamaños/carga; conservar firmador servidor, portada estable y prioridad de foto inicial. No declarar mejora LCP sin medición |
| UX-011 | MEDIO / confirmado código, visual admin pendiente | Tabla con min-width1000 y overflowX:auto, sin nombre/instrucción de desplazamiento/foco explícito del contenedor; estilos de celdas y estados locales | Mantener tabla y paginación; scroll accesible, caption/scope, acciones/totales legibles. No ocultar información por CSS ni simular datos |
| UX-012 | BAJO / confirmado código | Inicio anuncia «DOS CAMINOS» y muestra tres tarjetas | Copy inconsistente. Ajustar frase, conservar las tres rutas existentes |
| UX-013 | BAJO / confirmado código/estado transitorio | `PublicarForm` devuelve null antes de ready; login Suspense fallback null; carga sin explicación consistente | Pantalla transitoria vacía. Estado de carga discreto y accesible, no dashboard ficticio ni cambios Auth |
| UX-014 | MEDIO / riesgo de regresión, no defecto nuevo | CSS global y estilos incrustados; cambios globales alcanzan ficha independiente, legales y admin | Selectores acotados, revisión incremental de todas las familias y comparación visual antes/después. No envolver `/ficha/` con navegación de dashboard |

El chart existente usa datos calculados de consultas y texto numérico; no reemplazarlo por valores inventados. Sus barras de altura mínima no justifican nuevas estadísticas. El defecto PDF de origen/permalink **AUD-043** conserva su hallazgo técnico separado y no se corrige incidentalmente en este lote.

## Contrastes de la paleta propuesta (no aplicada)

Ratios calculados por luminancia sRGB, no estimados mirando la captura. `#5365A8` sobre blanco≈5,53:1, adecuado para texto normal en ese par; `#8C87C8` sobre blanco≈3,27:1, **no usarlo como texto normal ni botón con texto blanco pequeño**. Reservarlo como acento decorativo/superficie o buscar variante más oscura. El cian actual sobre blanco≈1,88:1 no sirve como texto normal; texto oscuro actual sobre cian≈8,65:1 sí tiene contraste. No concluir que todos los botones cian fallan sin verificar color de texto.

Objetivo AA para componentes intervenidos, no declaración de cumplimiento global. Referencias primarias: [WCAG2.2 contraste](https://www.w3.org/TR/WCAG22/#contrast-minimum), [labels WAI](https://www.w3.org/WAI/tutorials/forms/labels/), [modal APG](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [tamaño de objetivo](https://www.w3.org/TR/WCAG22/#target-size-minimum). Objetivos táctiles44px son una decisión de usabilidad del proyecto; no confundirlos con el mínimo AA24px y sus excepciones de WCAG2.2.

## Dirección de diseño propuesta, pendiente de referencia gráfica

- Conservar identidad textual QRO INDUSTRIAL HUB/QRIH, información industrial y fotos reales; no copiar un dashboard financiero ni añadir KPIs.
- Tokens únicos propuestos: fondo `#F5F7FA`, superficie `#FFFFFF`, texto `#253247`, primario `#5365A8`, acento `#8C87C8` con las restricciones de contraste anteriores. Añadir muted, bordes, semánticos y foco con sus pares medidos. Escala de espacios4/8/12/16/24/32/48, radios8/12/16, sombra suave; tipografía local del sistema, sin descarga de fuente/biblioteca nueva.
- Consolidar CSS actual para base y tokens; usar clases de componente/CSS Modules cuando una familia requiera aislamiento. No cambiar estructura App Router, servidor/cliente, dependencias o layouts de acceso por estética.
- Evaluar lateral sólo en contexto de gestión: el inventario público ya tiene filtros laterales y tarjetas muy estrechas en tableta; añadir otro lateral persistente agravaría UX-001. No imponerlo al sitio público, autenticación o ficha. Comparar cabecera compacta + navegación de sección frente a lateral colapsable una vez visible la referencia. Opciones por rol basadas en autorización existente; no inventar pantalla «Configuración» personal que no existe ni mostrar administración al propietario.
- Separar acciones primarias/secundarias/destructivas, mantener las deshabilitadas con explicación visible y no únicamente title/opacity. Conservar confirmación de retirada y confirmación nativa de eliminación hasta un cambio explícito revisado; no probar eliminaciones reales.
- Formularios con labels, grupos claros e instrucciones de obligatoriedad; no cambiar contratos, campos requeridos, validación económica ni precisión monetaria.
- Ficha compartida como pieza comercial, sin dashboard/nav/footer/formularios, y coherencia de datos con PDF. CSS HTML no cambia estilos internos de React-PDF: esa comparación requiere validación independiente, no se da por heredada.

## Secuencia de implementación y controles

Cada bloque tendrá diff delimitado, comprobación local y commit separado en esta rama. No push/deploy automático ni integración con main. No se inicia implementación visual final hasta recibir la imagen solicitada o una indicación explícita de prescindir de ella.

| Bloque | Archivos/familias previstas | Verificación antes de continuar |
| --- | --- | --- |
| 1 · sistema compartido | `app/globals.css`, variantes de controles/tarjetas/status | Contrastes calculados, foco, disabled, lint/tipos/tests; ninguna dependencia nueva |
| 2 · navegación | `Header.tsx`, `Footer.tsx`, `/panel`, raíz sólo si se explica | Menú375/768/1024/1440, teclado, aria-current, sesión/roles, ficha intacta |
| 3 · catálogo/detalle | `PropertyCard`, `InventoryFilters`, inicio/inventario/detalle/asesor, galería | Precio/moneda sin clipping, foto principal, lazy apropiado, vacío/error y modal con foco |
| 4 · gestión/formularios | Mis propiedades/perfil/edición/duplicación/publicación, upload/editor | Todas las acciones/estados preservados, labels,7fotos/WebP, guardado sin cambio de payload |
| 5 · administración/secundarios | AdminPropertiesTable/filtros, seis páginas admin, solicitudes/notificaciones/requerimientos | Paginación real, scroll/teclado, permisos, solicitudes y moderación; rol admin legítimo requerido para aceptación real |
| 6 · ficha/Auth | CommercialPropertySheet, login/registro/recovery/reset | No captación/nav/footer en ficha; mecanismo/PKCE/recovery/roles sin cambios; PDF consistente |
| 7 · cierre | Pruebas/UI responsive/accesibilidad/rendimiento y documentación | Nuevo build local, matriz crítica, comparativa; luego pedir autorización RC de Netlify, nunca desplegar automáticamente |

Fuera del alcance: nuevos módulos/filtros de BD/roles/analítica/IA, arquitectura extensa, RLS, migraciones, cambios de precios o transiciones. Si surge un defecto de seguridad/funcional independiente, identificar severidad y abrir su corrección separada antes de tocarlo.

## Línea base de pruebas ejecutada

| Comprobación | Resultado de este corte | No demuestra |
| --- | --- | --- |
| Git inicial | Develop limpio, base1992ca8; rama específica creada | Entrega remota de nuevos archivos |
| `npm test` | 157/157 PASS,0fallos/0skips | E2E real de todos los actores |
| `npm run lint` | PASS,0warnings | Diseño accesible por sí solo |
| `npm run typecheck` | PASS | Render final de nuevo CSS |
| `npm run test:http` local | 31/31 PASS,0fallos/0skips; lecturas/requests inválidos sin sesión | Alta/edición/contacto/moderación autenticados |
| Primer intento HTTP | Bloqueado por sandboxEPERM; no respuestas de aplicación; repetido con permiso de red local y suite completa PASS | 31 defectos de QRIH; no se registran como tales |
| Responsive base | 76 mediciones; sin overflow del body; UX-001 clipping interno confirmado | Todas las páginas/estados libres de desbordamiento o WCAGAA |
| Teclado galería | Fallo UX-003 reproducido, cierre comprobado | Correcto confinamiento de foco |
| Build/preflight | NO REEJECUTADOS en esta fase sin cambios de código | Build de rediseño; pruebas anteriores mantienen fecha/alcance |
| Accesibilidad automatizada completa | NO EJECUTADA; sin instalar dependencias | Certificación WCAG, lector de pantalla o Safari |
| Netlify | NO deploy ni cambios | Nueva validación de interfaz en adaptador remoto |

Warnings existentes del runtime Node sobre tipo de módulo/stripTypeScriptTypes y errores Auth sintéticos del fixture aparecieron en la suite que terminó PASS. No modificar configuración/dependencias para silenciarlos dentro de este diagnóstico.

## Matriz de aceptación después de implementar

Todas las celdas del rediseño están pendientes; aceptación del RC anterior no cuenta como PASS del nuevo artefacto. Usar perfiles legítimos; datos sintéticos previos autorizados, sin guardar/cambiar estados de datos reales para revisar estética.

| Caso | Criterio / evidencia requerida |
| --- | --- |
| Registro/login/confirmación | Labels/errores/foco/aviso correo; mismo callback y destino por rol, sin duplicar cuenta |
| Recuperación | Formularios/estados legibles, enlace vencido seguro, usuario realiza cualquier cambio real de contraseña |
| Alta | Moneda/precio/unidad/superficies, validación, borrador/revisión, confirmación y foto; fixture nuevo sólo si hace falta y se autoriza |
| Editar/reenvío | Draft/rejected editables; published confirma retirada; pending/pending_update sin habilitar edición por CSS |
| Duplicar | Precarga íntegra,7fotos/portada, copia independiente al guardar, no escritura por visitar URL |
| Fotos | Cover/fallback/orden/7límite/WebP; renovación y rutas privadas existentes; no mostrar URLs firmadas en mensajes/logs |
| Compartir | Sólo published/cuenta habilitada, menú accesible, copiar/abrir; no enviar WhatsApp/contactos de prueba |
| Ficha | Sin nav/footer/form/captación, galería/teclado/precios/características; no publicadas404 |
| PDF | Generación real y comparación visual/datos con ficha, precios y moneda exactos; no corregir AUD043 sin lote propio |
| Catálogo/filtros | Todos los controles actuales, moneda/operación/unidad/rango; texto completo y foto en cuatro anchos, sin valores convertidos |
| Mi panel | Sólo identidad/datos propios, estados y acciones correctos; nada de cifras simuladas |
| Admin | Sesión admin legítima, paginación/filtros/tabla responsive/estados; no cambiar ajustes ni aprobar fixtures por estética |
| Solicitudes/notificaciones | Pendiente/autorizado/denegado, estados y contactos según permisos; no mutación accidental al inspeccionar |
| Roles | Anónimo/owner/otro owner/admin/suspendido según reglas vigentes; verificar servidor/RLS, no sólo visibilidad de botón |
| Salir | Mantener signOut/destino y ausencia de datos privados tras salir; conservar acceso legítimo para retomar pruebas |
| Teclado/lector | Orden/foco visible, modalTab/ShiftTab/Escape/retorno, labels, alerts/status, scroll tabla, zoom/reflow |
| Rendimiento | Mismo número de dependencias; peso CSS/JS y métricas antes/después con método explícito; no animación pesada ni CLS inventado |
| RC remoto | Sólo tras autorización nueva, SHA exacto/build/adaptador/headers/fotos/PDF/flujo crítico; build local no sustituye STAGING |

## Siguiente intervención necesaria

Reenviar la imagen de referencia (PNG/JPG/WebP visible en el chat) o indicar que se use únicamente la paleta y criterios del documento. Después implementar y comprobar los siete bloques. Más adelante hará falta una sesión admin legítima para validar su interfaz; no se pide cambiar roles ni conceder privilegios. El nuevo alcance permanece **NO-GO** hasta su cierre y aceptación remota autorizada.
