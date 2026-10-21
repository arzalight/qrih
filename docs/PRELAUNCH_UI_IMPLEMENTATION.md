# QRIH — Implementación visual previa al Soft Launch

## Estado actual

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
