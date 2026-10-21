# QRIH — Implementación visual previa al Soft Launch

## Estado actual

### Publicar — cuatro comentarios / 21oct2026

- Alta nueva: PublicarForm pasa value=MXN a PriceCurrencySelect. El componente compartido y EditarPropiedadForm siguen recibiendo el valor original; no se cambia el default global ni se asigna moneda a históricos NULL. SSR real del selector cubre MXN/USD/NULL/undefined/vacío. No conversión de importes ni tablas.
- Etiquetas visibles Municipio/Zona y ayudas de selección coherentes en alta y editor compartido por edición/duplicación. Se mantienen zone_general/zone, ids, estado, callbacks, required/disabled, ZONAS_GENERALES/ZONAS_INDUSTRIALES_POR_ZONA y todos los valores. El cambio de nombre no transforma el catálogo geográfico ni introduce un padrón municipal.
- Precio y condiciones: medición previa real 56px entre etiquetas (gap28 + márgenes14+14). Se eliminan sólo esos márgenes dentro de price-options y se usa gap calc(56px/3); medición posterior 18.664px en ambos huecos. Checkboxes, nombres, estado y tamaño18px preservados.
- 223 pruebas (59 UI), lint/tipos/build/preflight/diff-check PASS; contratos AST de los campos originales intactos. Navegador local732px: MXN inicial, elección USD permanece tras cambiar Municipio a El Marqués, Zona se habilita con el catálogo original, sin overflow. Prueba sólo en formulario de revisión aparte; no guardar, enviar, aceptar términos ni cargar imágenes. No nuevo E2E de guardado/duplicación declarado por comprobar selector/contratos.

Captura publish-mxn-municipio-zone-spacing.png fuera de Git. Sin migración, RLS, API, datos, commit, push o deploy. Actualiza la presentación y el default autorizado del alta, no la arquitectura ni el dictamen de aceptación del nuevoRC.

### Navegación simplificada — comentario posterior21oct

Se elimina site-nav__marker de Header.tsx/CSS y se retiran sólo Notificaciones/Mi perfil del arreglo de navegación de trabajo;Mi cuenta conserva Abrir mi perfil,avisos,Ver todas las notificaciones yCerrar sesión. No rutas,permisos,handlers o funcionalidad eliminados. Navegación pública/admin conserva sus destinos y queda sin marcadores decorativos.220tests(56UI incluidas),lint/tipos/build/preflight/diff-check PASS. Navegador real732px:4destinos(Mi panel,Subir propiedad,Inventario,Busco una bodega),0marcadores,sin overflow;ambos enlaces de cuenta verificados sin pulsar avisos ni salir. Captura navigation-four-links-no-markers.png fuera de Git. Sin datos,commit/push/deploy;aceptación del nuevoRC pendiente.

### Inicio — tres comentarios21oct2026

app/page.tsx mantiene createPublicServerSupabaseClient/properties_public,published,orden featured→featured_priority→created_at y firma autorizada por lote/TTLpublic;única modificación de consulta limit3→6. No datos,RLS,Storage o políticas modificados. La guía Supabase delimitó revisión documental,lectura pública y verificación;[referencia oficial de limit](https://supabase.com/docs/reference/javascript/limit) consultada. Changelog markdown no pudo leerse por content-type de herramienta;fallback al HTML oficial,sin actualizar SDK ni cambiar APIs.

Eyebrow SELECCIÓN fuera de la fila;título/enlace como hermanos centrados en escritorio y apilados/alineados a izquierda en móvil. Clase de rejilla sólo de inicio:3columnas,2entre761–1023 y1hasta760. Se retira sección band completa y suCSS sin consumidores;permanecen tres capacidades,Busco una bodega en navegación/capacidad/footer y formularios existentes.

219tests(55UI incluidas),lint/tipos/build/preflight/diff-check PASS;0fallos/0skips. La consulta real de Home ejecutada por Next contra QRIH STAGING devolvió6 tarjetas y6imágenes cargadas,sin crear fixtures ni escribir. Verificado en pestaña independiente a1280px:3columnas y centros de título/enlace coinciden;732px:1columna y ambos alineados a izquierda;sin overflow y banda ausente. La emulación375/768/1024/1440 de la pestaña independiente no obedeció los tamaños solicitados:esas iteraciones devolvieron1280o732,no contarlas como cuatro PASS. La pasada anterior en la pestaña original verificó375/768/1024/1440 antes de fijar la rejilla3/2/1;no sustituye verificación final de cada breakpoint. Overrides restaurados;formulario que el usuario abrió en su otra pestaña no fue enviado ni modificado.

Durante recompilación,el servidor local anterior emitió errores de manifiestoRSC;se reinició y la página final se verificó sin ese error. No atribuirlo a producción ni aplicar un refactor para ocultarlo. Captura home-selection-final-viewport.png fuera de Git;captura por clip de selección muestra zonas no pintadas fuera de viewport y no se usa como prueba de imágenes faltantes. Sin commit/push/deploy o cambio de dependencias. NO-GO del nuevoRC hasta aceptación/autorización conservado;no afirmar mejora de rendimiento por incrementar tarjetas.

### Requerimientos sin envoltorio visual — comentario posterior21oct

Retirado h2 duplicado Mis requerimientos y eliminado borde/padding exterior también en escritorio,ampliando el ajuste móvil anterior. Se conserva únicamente section con aria-label como agrupación accesible,sin marco visible;tarjetas,contenido y matching intactos.217tests,lint/tipos/build/diff-check PASS.375/962/1440:un solo título,borde0/padding0,tarjeta presente y sin overflow. Captura requirements-no-outer-frame.png fuera de Git. Sin acciones comerciales,datos,commit,push/deploy;aceptación visual/remota pendiente.

### Navegación y cuenta — dos comentarios21oct2026

Header.tsx mueve profile-menu completo fuera de nav y lo sitúa junto al disparador de menú en header-controls. Botón de perfilSVG44×44,aria-label/title Mi cuenta;contador de avisos conservado. Cuenta y navegación se cierran mutuamente;Escape devuelve foco al disparador correspondiente. En escritorio de gestión>=1200,el menú de navegación ya es rail:cuenta queda arriba de la lista,con popover hacia el contenido,no al pie. Sin convertir la navegación en un nuevo layout ni añadir permisos.

site-nav__marker deja de contener◇ y usa círculo gris#9ca3af5×5px,decorativo/aria-hidden. Perfil mantiene identidad,Abrir mi perfil,últimos avisos,Ver todas las notificaciones yCerrar sesión. HuellaAST de loadUserAndNotifications/handleNotificationClick/handleSignOut idéntica al corte anterior;sin cambios de consultas,frecuencia,marcado de avisos o signOut. No se pulsaron avisos/salir para verificar estilos.

217tests(53UI incluidas),31HTTP,lint/tipos/build/preflight/diff-check PASS. Sesión legítima en localhost3107:320/375/768/1024/1440 sin overflow,perfil44×44,popover dentro de los cinco viewports;375 menú abierto con6puntos grises y cuenta fuera de nav. Cuenta abre sin desplegar lista;al abrirla cierra menú,Escape cierra/devuelve foco. Menú público de Inventario375/1440 sin overflow y con cuenta accesible. Captura header-profile-menu-mobile.png fuera de Git,sin identidad expuesta. No testnuevo real de signOut/lectura de aviso ni certificaciónglobal de roles/accesibilidad. Sin datos,commit,push/deploy;NO-GO del nuevoRC conservado.

### Requerimientos — cuatro ajustes visuales / 21oct2026

Retirada etiqueta REQUERIMIENTOS redundante;tarjeta interior con primary-soft y sugerencias blancas separadas por12px. Wrapper requirements-panel conserva contenido y navegación;en<=680px se elimina sólo marco/padding/título repetido,no la lista. Nuevo traduce exclusivamente estado new y deja de estirarse:altura28px y align-self:flex-start.375/768/1024/1440 sin overflow;tarjeta/estado/ausencia de etiqueta verificados en build local con sesión legítima.51UI incluidas en215tests,31HTTP,lint/tipos/build/preflight PASS. Sin escrituras de datos ni deploy.

El comentario sobre coincidencias se trató como corrección funcional independiente en lib/matching.ts,no como CSS ni ajuste de cifras. [Registro DEM-001](MATCHING_SURFACE_REVIEW_2026-10-21.md). Sus límites sustituyen cualquier afirmación anterior de lib sin cambios para este nuevo lote;API/SQL/RLS sí permanecen intactos. Aceptación humana/remota pendiente.

### Siete comentarios visuales aplicados — 21oct2026

Eliminados el texto Administra… de cabecera (compartida por las tres pestañas),Revisa cómo… de preferencias,fecha y periodo visible de las tarjetas. Periodo también retirado del resumen superior para indicarlo visualmente sólo en Rendimiento;etiquetas accesibles conservan28días y los cálculos no se convierten en totales históricos. Visto sustituye Visualizaciones sólo en tarjetas;Solicitudes sustituye Ver solicitudes sin cambiar destino. Tres puntos sin texto visible,con aria-label por propiedad,title Más acciones y superficie44×44px. Fecha sigue en datos/consulta y demás pantallas no intervenidas;no se agregan campos a detalle por esta petición.

207tests(50UI incluidas)/31HTTP,lint/tipos/build/preflight/diff-check PASS.375/768/1024/1440 sin overflow;disparador44×44 sin texto,ausencia de fecha/periodo visible en tarjetas y menú/Escape/retorno de foco comprobados con sesión legítima,sin ejecutar acciones comerciales. Captura panel-seven-comments.png fuera de Git. Sin commit/push/deploy ni cambios de datos. Mantener aceptación visual pendiente y NO-GO del nuevoRC;resto del sitio no modificado por estos comentarios.

### Refinamiento UX del panel — 21oct2026, posterior al cierre de siete bloques

Usuario autoriza reorganizar primero Mis propiedades tras señalar espacio desperdiciado y acciones amontonadas. Implementado sólo en la rama local existente; sin commit/push/deploy ni cambios de datos. Esta revisión sustituye la aceptación visual pendiente del panel, no declara aceptado todo el sitio.

- Cabecera directa con Publicar propiedad y Mis notificaciones; pestañas existentes conservadas. Resumen compacto; propiedades fuera del contenedor de rendimiento. Gráfica/conversión/mayor interés conservados tras las tarjetas en un disclosure nativo cerrado; preferencias de contacto al final de las tres vistas, también plegables. Se compacta únicamente el pie de esta pantalla, conservando enlaces legales/navegación.
- Tarjetas sin padding anidado ni altura igualada que agregaba huecos. Precio, superficie y métricas existentes; periodo de 28 días explícito. Editar visible sólo donde ya se permitía, solicitudes disponibles y Más agrupa duplicación, compartir cuando corresponde, ficha/edición publicada y eliminar separado. No se añaden permisos ni vista privada nueva. Se conserva la confirmación de retirada al editar published y la confirmación de eliminación.
- Trazabilidad: app/mis-propiedades/page.tsx → PropertyActionDisclosure, ManagePropertyActions(compact), DeletePropertyButton(compact), SharePropertyButton/OwnPropertyCover sin cambios → mismas APIs/BD/RLS. CSS acotado a property-workspace/own-property-*; sin dependencia nueva. Prueba de huella confirma idéntico el bloque servidor de identidad/consultas/cálculos/firma; render sintético cubre edición compacta en siete estados y cuenta inhabilitada.
- 206 pruebas PASS (incluyen 49 UI),31 HTTP anónimas PASS,lint/tipos/build/preflight/diff-check PASS;0fallos/0skips. El build es local de producción conectado exclusivamente al QRIH STAGING configurado, no un deploy. Warnings Node preexistentes no se silenciaron.

| Ancho | Primera tarjeta desde inicio | Ancho tarjeta | Filas de acciones principales por tarjeta | Overflow body |
| --- | --- | --- | --- | --- |
| 375 | 451px (antes1947) | 343px (antes277) | 1 / 1 | No |
| 768 | 435px | 340px | 1 / 1 | No |
| 1024 | 379px | 468px | 1 / 1 | No |
| 1440 | 310px (antes1122) | 546px | 1 / 1 | No |

Mediciones sobre las mismas dos propiedades sintéticas existentes y sesión legítima; títulos largos/no extrapolar alturas a todo registro. A375px alturas553/661px frente a863/1061 anteriores. A320px comprobación adicional sin overflow, con wrap permitido. Más abre/cierra,Tab llega a Duplicar y Escape cierra/devuelve foco; rendimiento/preferencias abren con teclado sin activar el toggle ni guardar. Pestañas de requerimientos/oportunidades revisadas en lectura. Capturas escritorio/móvil fuera de Git. No se ejecutaron eliminar,duplicar,retirar,compartir,guardados ni nuevas aceptaciones legales.

**IMPLEMENTADO / VALIDADO LOCAL ACOTADO / ACEPTACIÓN HUMANA Y RC PENDIENTES.** Inventario,ficha y formulario mantienen los hallazgos de jerarquía identificados en la revisión UX posterior; no se afirma corregido todo el sitio ni se cambian los límites de NO-GO del rediseño, AUD043 y AUD018.

Referencia gráfica recibida e inspeccionada el20oct2026: archivo AVIF aportado por el usuario,740×528. Se decodificó localmente aPNG únicamente para inspección; no se incorpora el diseño ajeno como imagen del producto. Sustituye el bloqueo por referencia ausente del [diagnóstico inicial](PRELAUNCH_UI_AUDIT.md), que conserva su fecha/evidencia.

**SIETE BLOQUES IMPLEMENTADOS / VALIDACIÓN LOCAL ACOTADA / NO-GO hasta aceptación del nuevoRC.** Rama `feature/prelaunch-ui-review`; base del diagnóstico `a558807`. Sin push, deploy, migraciones, cambiosRLS/permisos/propiedades ni producción/main. Única escritura STAGING: fila de configuración AUD-044 expresamente autorizada, descrita debajo. El GO comercial anterior no valida este código.

**Excepción posterior autorizada21oct:** AUD-044 confirmó ausencia de fila singleton de configuración en STAGING. Se creó únicamente id=true/correoNULL, tras autorización explícita y con readback;0updates/deletes/migraciones/RLS. [Registro independiente](AUD044_PLATFORM_SETTINGS_2026-10-21.md). No se editan propiedades ni se elige correo por inferencia.

## Sistema adoptado

Inspiración: fondo claro, superficies blancas, navegación compacta, jerarquía tipográfica y acentos índigo/lila; no copiar tarjetas financieras ni inventar estadísticas. Tokens en `app/globals.css`: fondo#F5F7FA, superficie#FFFFFF, texto#253247, primario#5365A8, hover#42538F, muted#59677D, acento#8C87C8 exclusivamente decorativo y acento claro#D8D4F5 sobre superficies oscuras. Estados semánticos con texto, no sólo color; foco opaco#394C96, escala espacial4/8/12/16/24/32/48, radios8/12/16 y sombras suaves. Fuente del sistema sin descargas ni dependencias nuevas.

Se mantiene el CSS y la arquitectura actuales, con clases reutilizables de panel, vacío, campo, acciones y botones secundario/destructivo. Alias `--cyan` conserva compatibilidad durante la migración gradual. No se afirman cubiertos todos los estilos incrustados por cambiar tokens.

## Registro por bloques

| Bloque | Implementado | Validado localmente | STAGING |
| --- | --- | --- | --- |
| 1 · tokens/base/componentes compartidos | SÍ: tipografía, paleta, controles/foco/disabled, estados y tarjetas responsive | 11pruebasUI PASS,lint/tiposPASS; catálogo13precios sin clipping/bodyoverflow en375/768/1024/1440 | PENDIENTE |
| 2 · navegación/layouts | SÍ: cabecera, disclosure de cuenta, rail de gestión>=1200, menú adaptable y redirect/panel |Nav pública/admin cuatro anchos,Escape/foco,menú44px y redirect real PASS | PENDIENTE |
| 3 · catálogo/detalle/galería | SÍ: tarjetas semánticas, filtros, detalle agrupado y visor accesible |Cuatro anchos y precios sin recorte; visor real build final móvil/teclado PASS | PENDIENTE |
| 4 · panel/perfil/formularios | SÍ: etiquetas asociadas, tokens, panel y confirmación/carga |Cuatro anchos,2tarjetas propias,edición/duplicado precargados/labels PASS; guardados/éxito real nuevos PENDIENTES | PENDIENTE |
| 5 · administración/secundarios | SÍ: tablas, estados, etiquetas y tokens |Seis interiores admin reales/cuatro anchos PASS;33UI de corte y render36filas. AUD044 reparado aparte | UI RC PENDIENTE; filaAUD044 comprobada |
| 6 · ficha/Auth | SÍ: ficha independiente/tokens; etiquetas/autocomplete/foco/mensajes Auth |38UI/157aplicación,lint/tipos/build/preflight PASS; no nuevos correos ni cambio de contraseña real | PENDIENTE |
| 7 · cierre responsive/accesibilidad/performance | SÍ en alcance local; no certificación global |196pruebas (157previas+39UI)/31HTTP,lint/tipos/build/preflight PASS;28vistas×4anchos y PDF real | PENDIENTE |

Los apartados por bloque conservan los cortes de cada commit; sus pendientes de herramientas/medición quedan sustituidos sólo por la evidencia concreta del bloque7 siguiente, no por aceptación remota o E2E de todos los estados.

### Bloque 7 — cierre local21oct2026

- **196pruebas** en npm test (incluye ahora39UI),0fallos/0skips;31HTTP anónimas sobre build final3107,lint/tipos/build/preflight PASS. No omitir UI en la ejecución habitual; dependencias/lockfile sin cambios.
- **28vistas×375/768/1024/1440=112mediciones:** body sin desbordamiento. Inventario13precios y catálogo de asesor habilitado12 sin clipping. Seis interiores admin reales, panel con2tarjetas propias, requerimientos/oportunidades, perfil, avisos, alta, edición y duplicación precargadas, solicitudes, Auth y legales. Recuperación muestra caso sin enlace válido, no éxito real; solicitudes del registro probado sin contactos. No afirmar que se aceptaron todos los estados/roles por medir geometría.
- Menú móvil final44px, expanded/Escape/retorno de foco PASS; galería real final375px con6fotos,dialog:modal,Tab/ShiftTab/flechas/Escape/scroll/restauración PASS. Capturas de publicación móvil/escritorio,admin y ficha fuera de Git. Los timeouts previos se superaron con pestaña nueva/control documentado y lecturaDOM; no fallo productivo inferido.
- Catálogo del propio admin devuelve404 por regla existente publisher/active/publications_enabled; no se cambió su rol ni se contó ese404 como catálogo positivo. Catálogo real habilitado100033 mostró12propiedades en los cuatro anchos. Restablecimiento sin marca válida es prueba negativa, no cambio de contraseña.
- En historial se detectaron dos filtros sin nombre accesible durante la pasada: se añadieron labels visibles a búsqueda/acción y fechas; repetidos los cuatro anchos sin campos sin etiqueta. Confirmación de alta queda dentro de main y mantiene formulario oculto/redirect; no se hizo un guardado nuevo para provocar ese éxito.
- PDF actual descargado desde la ficha local:3páginas,6imágenes,6.50USD/m²/mes y total73,788USD; las tres páginas renderizadas/inspeccionadas sin solapamiento ni fotos faltantes. Renderer/API/PDF no modificados. Poppler encontró un fallo de fontconfig local y se detuvo; revisión alternativa con PDFium ya instalado, sin instalaciones ni cambios del documento. Enlace del PDF local apunta a localhost, no es validación de origen Netlify; AUD043 remoto sigue abierto.
- CSS fuente25.233→38.762bytes;gzip5.522→7.994bytes en el corte final. El crecimiento acompaña extracción de inline/navegación/estados;no afirmar mejora de transferencia/LCP/CLS sin medir bundle/página/red. Sin fuentes externas,animación pesada,librería o dependencia nueva.
- Sin cambios en lib,API,callback,proxy,migraciones o lockfile respecto a develop1992ca8. Main55b7737/develop1992ca8 conservados. Datos/RLS/Auth/Storage no modificados por el rediseño salvo AUD044 autorizado.

### Aceptación pendiente y dictamen

**Preparado para revisión humana local, NO-GO Soft Launch del nuevo alcance.** Falta aprobar visualmente y autorizar un nuevoRC Free; no se despliega ni fusiona main automáticamente. En ese RC comprobar origen/headers/firmas/PDF y repetir flujos de escritura críticos (alta/edición/revisión/duplicado/contacto/moderación/Auth/logout) con cuentas/fixtures autorizados, aceptación legal/contraseña por el usuario y límites vigentes. No reutilizar el GO del RC anterior ni crear nuevas cuentas/fixtures sin necesidad/autoridad.

WCAG2.2AA es objetivo, no certificación: falta matriz de estados/lectores/zoom/Safari/rendimiento real. Soporte necesita dirección humana; AUD043 y riesgos operativosAUD018 continúan. No nuevo crítico/alto confirmado en este rediseño; las limitaciones de prueba no son PASS.

### Historial de commits de implementación

1.2e138d0 tokens/base;2.d19dc46 navegación/layouts;3.c61b495 catálogo/detalle/galería;4.c1f9df3 panel/formularios;5.ecb956d administración/secundarios;6.588ce7b ficha/Auth;7.commit de cierre que contiene este registro. a558807 conserva diagnóstico;288659c registra AUD044 autorizado por separado. Todos locales en feature/prelaunch-ui-review, sin push/deploy.

### Bloque 1

Archivos: `app/globals.css`, `tests/prelaunch-ui.test.mjs`, script `test:ui` de `package.json` y documentación. Sin cambio de dependencias/lockfile. Grids adaptados al ancho útil, precios con wrap y contraste, radios/sombras/tokens compartidos. Foco de campos ya no se elimina; uploader mantiene foco visible en su label. Movimiento reducido respetado. Textos de estado continúan presentes.

Ocho pares reales de tokens superan4,5:1 en pruebas calculadas de luminancia; foco/surface y foco/paper superan3:1. Esto no certifica WCAGglobal: estilos inline, imágenes, teclado/lectores y todos los estados siguen sujetos a revisión. Catálogo local a768px: tarjeta≈419px frente a≈134px anteriores;375≈337,5/1024≈314,8/1440≈274,7px. Cero precios con scrollWidth>clientWidth de13 y sin overflow del body en los cuatro anchos. Capturas comparativas permanecen en el espacio privado de trabajo, no en Git.

UX-001: corrección local y reproducción de catálogo verificadas; aceptación del RC pendiente. UX-004: pares de tokens corregidos/probados, revisión de toda la UI pendiente. UX-008/014: consolidación inicial, no cierre global. Resto de hallazgos abiertos hasta sus respectivos bloques.

### Bloque 3 — 21oct2026

Tarjetas con fotografía semántica, texto alternativo, dimensiones reservadas y carga diferida; se conservan la URL autorizada recibida, destino y formatter MXN/USD. Filtros conservan nombres/opciones/GET y handlers; sólo se retira presentación inline. Detalle conserva consultas, barrera published, firma de fotografías, dirección autorizada, contacto y PDF; se organiza en paneles/especificaciones legibles. Inicio corrige «dos caminos» por los tres existentes (UX-012).

El visor utiliza dialog nativo, foco inicial, ciclo Tab/ShiftTab explícito, Escape, flechas y retorno al disparador; restaura el scroll anterior. Verificado en ficha real a375px con seis fotografías: ShiftTab del cierre llega a Siguiente, Tab vuelve al cierre, flechas cambian fotografía y Escape vuelve a Ampliar Foto1. Sin navegación/footer/formularios añadidos a ficha. Pruebas del handler real y render de siete fotografías incluidas. UX-003 corregido/verificado localmente, aceptación remota pendiente. UX-010 mejora semántica, no medición de LCP/CLS ni rendimiento certificado.

21pruebasUI y157aplicación PASS, sin fallos/omisiones; lint/tipos PASS. Capturas privadas conservadas fuera de Git. La nueva repetición conjunta de home/catálogo/detalle/ficha en los cuatro anchos se interrumpió por timeout del control de viewport del navegador (también en llamada aislada); no se declara PASS ni fallo de la aplicación por ello. Las mediciones anteriores de bloques1/2 mantienen sólo su alcance. Build final y aceptación visual integral todavía pendientes.

### Bloque 4 — 21oct2026

Componente FormField sin estado ni dependencias: etiqueta visible asociada por id y obligatoriedad informativa; controles originales mantienen name/type/required/min/max/step/valores/disabled y handlers. Publicación, edición/duplicación, requerimiento y solicitud de contacto intervenidos; títulos de fotografías ahora tienen label visible. No se envió ningún formulario, aceptaron términos ni subieron imágenes. Ocho huellas AST de contratos anteriores (c61b495) verifican los campos/opciones/handlers, sin depender de Git al ejecutar pruebas.

Panel conserva consultas, cifras calculadas, tarjetas, portadas, Editar/Duplicar/Compartir/eliminar y condiciones por estado/cuenta. Saludo fijo Fabián sustituido por neutro (UX-007). Perfil y formularios adoptan tokens, sin cambiar permisos ni bloqueo de identidad. Publicación deja de devolver pantalla en blanco al cargar (UX-013 parcial) y muestra confirmación en página con foco/live, formulario oculto y el mismo redirect de3segundos, sin overlay modal inaccesible (UX-009 parcial).

32UI y157aplicación PASS,lint/tipos/diff-check PASS. En navegador real local1440: publicación cargó la sesión legítima, ningún control sin label y body1440. Revisión visual detectó zonas comprimidas por grid anidado; se separó el bloque de ubicación para dar el ancho completo a sus dos zonas. No se declara aceptación de guardado/éxito real, mobile, Safari o STAGING. La primera prueba nueva falló por orden de atributos SSR y por buscar return null también en el parser numérico legítimo; se acotaron las aserciones, sin alterar ese parser.

### Bloque 5 — 21oct2026

Tablas de propiedades/asesores con región de scroll enfocable y descrita, caption, scope de columnas y enlaces44px. PropertyStatusBadge sólo presenta los siete estados existentes con texto español/clases semánticas; no concede permisos. Paginación conserva20/35/50/60/100, cálculo/handlers; indica página actual. Render real con36fixtures sintéticas muestra1–35, segunda página disponible y precioUSD exacto. Filtros no cambian GET, campos ni opciones.

Seis páginas admin, filtros/configuración y solicitudes/notificaciones adoptan tokens en estilos existentes. Formularios admin con labels previos ahora vinculados por htmlFor/id; selectores de zonas etiquetados. Historial permite wrap de filtros. No nuevas acciones/consultas ni cambio de moderación, verificación, suspensión, notificaciones leídas o autorización de contactos. Rutas admin siguen bajo los guards originales (prueba positiva sólo sesión legítima anterior, no rol fabricado).

33UI y157aplicación PASS,lint/tipos PASS. La herramienta también agotó tiempo al retomar/recargar admin; no se afirma haber visto el nuevo interior completo ni tener sesión nueva verificada por ese intento. Aceptación visual admin real, cuatro anchos, contacto/avisos con todos sus estados y Safari siguen pendientes. No confundir render sintético con prueba E2E del servicio.

### Bloque 6 — 21oct2026

Ficha comercial usa los mismos tokens, portada con dimensiones reservadas y columnas adaptables; permanece sin Header/Footer/nav/forms ni captación. Mismos datos autorizados/formatter/PDF/galería; prueba SSR comprueba dirección privada ausente,USD7.50/m²/mes y total750USD/mes. El formatter existente omite decimales de total entero: prueba corregida para respetar esa convención, sin modificar importes/formatter.

Login y registro con labels asociados/autocomplete; resumen de registro recibe foco al cambiar de paso y errores anunciados. Login tiene carga explícita en Suspense, no pantalla vacía. Recuperación/restablecimiento mantienen controles etiquetados existentes; no se reimplementan mecanismos Auth. Cuatro huellas AST de handlers previos (ecb956d) verificadas idénticas. Sin registro, correos, recovery real, cambio de contraseña, claves o callbacks nuevos. Revisar Auth real sólo en3000/3107 autorizados, no3108.

38UI y157aplicación PASS;lint/tipos/buildNext y preflight de bundle sin credencial privada examinada PASS. Primer fixture de ficha necesitó resolver la importación relativa real de galería en el loader de prueba; no defecto de bundling de Next. Estas pruebas no validan nuevo deploy, PDF real posterior ni Safari/WCAGglobal. AUD043 del enlace PDF continúa separado y no corregido.

## Límites y continuación

### Bloque 2 — 21oct2026

`Header` conserva sin cambios los handlers de carga/consulta, click de notificaciones y signOut; se extrae presentación a clases, aria-current/expanded/controls y Escape con retorno al disparador. Menú normal hasta1199px, rail224px sólo gestión>=1200. `body:has(.header--workspace)` reserva el espacio sólo cuando esa cabecera se renderiza, sin route groups/layouts nuevos ni cambios de URL. Las seis páginas admin pasan la variante administrativa únicamente en su retorno autorizado, después de los guards activos de servidor; no se concede rol por URL/user_metadata ni se reemplaza su autorización. Footer conserva contenido/rutas y se retiran colores inline duplicados.

`/panel` ahora redirige en servidor a `/mis-propiedades`, preservando marcadores sin enseñar cuatro ceros ficticios. La raíz y la ficha comercial no reciben navegación de gestión. No se cambian los destinos de moderación/notificaciones, el login o las sesiones.

Con la sesión admin introducida por el usuario: `/admin`375/768/1024/1440 sin overflow del body,rail224px sólo a1440; menú de cuenta340px dentro del viewport y Escape devuelve foco al toggle. En catálogo anónimo, menú abierto/cerrado/Escape y ruta activa correctos en375/768/1024,nav normal a1440. No se pulsaron notificaciones ni moderaciones, ni se guardaron datos. Nueva observación confirmada dentro de UX-011: la rejilla fija de filtros admin desbordaba a768px; se ajustó exclusivamente gridTemplateColumns al ancho disponible. Mismos campos/nombres,GET y auto-submit existentes. Tabla ancha conserva scroll interno; el desplazamiento accesible sigue en bloque5.

18pruebasUI y12pruebas Auth/navegación de notificaciones,lint/tiposPASS. La primera ejecución del fixture SSR nuevo falló por resolver React desde un dataURL del propio mock; se corrigió sólo el resolver de la prueba y la suite pasó. No fallo productivo Auth ni bypass. Validación remota,build final y restantes pantallas/estados siguen pendientes. La sesión del navegador anterior ya no estaba disponible al retomar; se reinició el servidor dev3108 y el usuario inició sesión legítima nuevamente, sin copiar tokens/cookies.

Revisión actual en localhost:3108 (dev); las capturas anteriores de3107 conservan la comparación, sin depender de que aquel servidor siga activo. No iniciar correos/callbacks desde3108: no se añadió a la allowlist de Supabase. Para la aceptación Auth se usará un origen local ya autorizado. No realizar nuevos guardados/contactos/moderación o altas reales para comprobar estilos.

Comparar layouts primero, conservar sidebar sólo para gestión en escritorio amplio y navegación adaptable en tableta/móvil. Ficha comercial fuera del dashboard. Administrador se determina en servidor con los permisos existentes; no inferirlo de user_metadata ni concederlo desde la interfaz. Al final: nuevo build/preflight local y regresión completa, después autorización nueva para RC de Netlify. Hasta entonces NO-GO visual.

### Formato visual centralizado de precios — 21oct2026

Única salida visual en lib/property-price.ts: símbolo $ para MXN/USD, código una sola vez, espacio antes de m², /mes para Renta y sin ceros decimales innecesarios. Miles con coma; se mantiene toda precisión significativa, sin Number/redondeo/conversión. Venta conserva ausencia de mensualidad. Cálculo decimal BigInt, filtros, matching, valores/monedas/unidades permanecen iguales.

Consumidores existentes: PropertyCard (inicio/inventario/catálogo de asesor), Mis propiedades/requerimientos/oportunidades/solicitudes, busco-bodega, detalle público, AdminPropertiesTable/admin/asesor administrativo, CommercialPropertySheet (ficha compartida) y PDF. Admin detalle usa ahora el formato común también en su campo de precio mostrado readonly y en el antes/después de Precio; comparación de cambios sigue usando valores originales. No se reescribe el registro histórico.

Separación explícita de persistencia: propertyPriceForStorage conserva exactamente salida previa de price_display en PublicarForm, property-save-server y actualización administrativa. Esas rutas cambian sólo import/función de formato, no validación, payload numérico, unidad o moneda. No se ejecutó ninguna escritura real. No se editan descripciones libres ni textos históricos arbitrarios para sustituir cifras que podrían no ser precios estructurados.

Anuncios heredados con unidad ausente mantienen la protección de no calcular total. Si su texto tiene estructura monetaria reconocible se normaliza sólo visualmente, conservando unidad explícita y convención Renta/mes; no se deduce unidad de superficie ni se escribe en BD. Textos arbitrarios o separadores inválidos conservan fallback anterior; moneda ausente continúa Moneda no definida. No afirmar saneados datos incompletos ni inferirlos.

232 pruebas PASS (incluidos los cuatro ejemplos exactos, precisión larga, ceros finales, multiplicación decimal, ventas, moneda/unidad faltante, render real de tarjeta/tabla/ficha y persistencia previa intacta). Lint, tipos, build y preflight PASS. Navegador local: seis precios de tarjetas, todos con nueva sintaxis; seis fotos cargadas. PDF público leído desde localhost: precio anunciado `$6.5 USD m²/mes`, total `$73,788 USD/mes`; texto extraído y primera página renderizada/inspeccionada sin solapamiento en precios. El primer intento de Poppler falló por fontconfig del runtime; se usó la configuración local existente y render pasó, sin cambiar PDF ni dependencias. Resto de páginas sin cambios de layout; no nueva certificación integral de todas las pantallas/roles. Capturas prices-final-cards.png y prices-final-pdf-page1.png y copia de lectura prices-final-piq.pdf fuera de Git. Sin datos, migraciones, configuración, commit/push ni deploy; NO-GO del nuevo RC hasta aceptación y autorización conservado.

### Círculos decorativos detrás del texto — 21oct2026

Corrección acotada en globals.css: cada home-capability-card crea contexto aislado; su ::after usa z-index -1 y pointer-events none. La decoración sigue sobre el fondo pero detrás de títulos, párrafos, iconos y enlaces. Sin cambios de geometría, contenido ni destinos. Prueba de regresión CSS añadida: 225 pruebas (61 UI), lint y build PASS. Navegador local confirma los estilos calculados en las tres tarjetas; captura home-circles-behind-text.png fuera de Git. Sin datos, commit/push ni deploy.

### Plantilla editable de descripción — 21oct2026

PublicarForm inicializa únicamente el textarea de alta nueva con la plantilla solicitada (26 líneas no vacías, agrupadas por condiciones, superficies, servicios y contrato). `defaultValue` permite completar o borrar libremente; no existen handlers de foco/clic que repongan o vacíen el texto. Edición/duplicación no se modifican y siguen mostrando la descripción persistida. No hay autocompletado por valores de otros campos ni afirmación automática de características: el usuario debe revisar el contenido antes de enviarlo.

224 pruebas (60 UI), lint/tipos/build/preflight PASS. Contrato del formulario actualizado sólo por el nuevo defaultValue autorizado; prueba dedicada del literal, textarea editable y descripción original de edición. Revisión independiente en localhost: contenido permanece al clicar y texto modificado permanece al cambiar operación; prueba descartada sin enviar formulario. Sin cambios de datos, SQL, permisos, configuración, commit/push o deploy. Servidor local reiniciado con build nuevo. Captura `publish-description-template.png` fuera de Git. Aceptación visual y nuevo RC remoto pendientes.
