# QRIH — Implementación visual previa al Soft Launch

## Estado actual

Referencia gráfica recibida e inspeccionada el20oct2026: archivo AVIF aportado por el usuario,740×528. Se decodificó localmente aPNG únicamente para inspección; no se incorpora el diseño ajeno como imagen del producto. Sustituye el bloqueo por referencia ausente del [diagnóstico inicial](PRELAUNCH_UI_AUDIT.md), que conserva su fecha/evidencia.

**IMPLEMENTACIÓN PARCIAL / NO-GO del nuevo alcance visual.** Rama `feature/prelaunch-ui-review`; base del diagnóstico `a558807`. Sin push, deploy, migraciones, cambio de Supabase, RLS, permisos, datos de negocio o producción/main. El GO comercial anterior no valida este código.

## Sistema adoptado

Inspiración: fondo claro, superficies blancas, navegación compacta, jerarquía tipográfica y acentos índigo/lila; no copiar tarjetas financieras ni inventar estadísticas. Tokens en `app/globals.css`: fondo#F5F7FA, superficie#FFFFFF, texto#253247, primario#5365A8, hover#42538F, muted#59677D, acento#8C87C8 exclusivamente decorativo y acento claro#D8D4F5 sobre superficies oscuras. Estados semánticos con texto, no sólo color; foco opaco#394C96, escala espacial4/8/12/16/24/32/48, radios8/12/16 y sombras suaves. Fuente del sistema sin descargas ni dependencias nuevas.

Se mantiene el CSS y la arquitectura actuales, con clases reutilizables de panel, vacío, campo, acciones y botones secundario/destructivo. Alias `--cyan` conserva compatibilidad durante la migración gradual. No se afirman cubiertos todos los estilos incrustados por cambiar tokens.

## Registro por bloques

| Bloque | Implementado | Validado localmente | STAGING |
| --- | --- | --- | --- |
| 1 · tokens/base/componentes compartidos | SÍ: tipografía, paleta, controles/foco/disabled, estados y tarjetas responsive | 11pruebasUI PASS,lint/tiposPASS; catálogo13precios sin clipping/bodyoverflow en375/768/1024/1440 | PENDIENTE |
| 2 · navegación/layouts | SÍ: cabecera, disclosure de cuenta, rail de gestión>=1200, menú adaptable y redirect/panel |18UI y12Auth/notificacionesPASS;nav pública y admin375/768/1024/1440,Escape/foco y filtro sin overflowPASS;privadas restantes pendientes | PENDIENTE |
| 3 · catálogo/detalle/galería | SÍ: tarjetas semánticas, filtros, detalle agrupado y visor accesible |21UI/157aplicación,lint/tipos PASS; visor real móvil/teclado PASS. Nueva pasada completa de cuatro anchos PENDIENTE | PENDIENTE |
| 4 · panel/perfil/formularios | SÍ: etiquetas asociadas, tokens, panel y confirmación/carga |32UI/157aplicación,lint/tipos PASS; publicación real1440 sin overflow ni campos sin label; resto responsive/éxito real PENDIENTE | PENDIENTE |
| 5 · administración/secundarios | SÍ: tablas, estados, etiquetas y tokens |33UI/157aplicación,lint/tipos PASS; render de36filas/paginación. Nueva pasada visual admin real PENDIENTE por herramienta | PENDIENTE |
| 6 · ficha/Auth | PENDIENTE; recibe únicamente tokens globales por ahora | PENDIENTE | PENDIENTE |
| 7 · cierre responsive/accesibilidad/performance | PENDIENTE | Pruebas por bloque no equivalen a cierre | PENDIENTE |

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

Tablas de propiedades/asesores con región de scroll enfoc able y descrita, caption, scope de columnas y enlaces44px. PropertyStatusBadge sólo presenta los siete estados existentes con texto español/clases semánticas; no concede permisos. Paginación conserva20/35/50/60/100, cálculo/handlers; indica página actual. Render real con36fixtures sintéticas muestra1–35, segunda página disponible y precioUSD exacto. Filtros no cambian GET, campos ni opciones.

Seis páginas admin, filtros/configuración y solicitudes/notificaciones adoptan tokens en estilos existentes. Formularios admin con labels previos ahora vinculados por htmlFor/id; selectores de zonas etiquetados. Historial permite wrap de filtros. No nuevas acciones/consultas ni cambio de moderación, verificación, suspensión, notificaciones leídas o autorización de contactos. Rutas admin siguen bajo los guards originales (prueba positiva sólo sesión legítima anterior, no rol fabricado).

33UI y157aplicación PASS,lint/tipos PASS. La herramienta también agotó tiempo al retomar/recargar admin; no se afirma haber visto el nuevo interior completo ni tener sesión nueva verificada por ese intento. Aceptación visual admin real, cuatro anchos, contacto/avisos con todos sus estados y Safari siguen pendientes. No confundir render sintético con prueba E2E del servicio.

## Límites y continuación

### Bloque 2 — 21oct2026

`Header` conserva sin cambios los handlers de carga/consulta, click de notificaciones y signOut; se extrae presentación a clases, aria-current/expanded/controls y Escape con retorno al disparador. Menú normal hasta1199px, rail224px sólo gestión>=1200. `body:has(.header--workspace)` reserva el espacio sólo cuando esa cabecera se renderiza, sin route groups/layouts nuevos ni cambios de URL. Las seis páginas admin pasan la variante administrativa únicamente en su retorno autorizado, después de los guards activos de servidor; no se concede rol por URL/user_metadata ni se reemplaza su autorización. Footer conserva contenido/rutas y se retiran colores inline duplicados.

`/panel` ahora redirige en servidor a `/mis-propiedades`, preservando marcadores sin enseñar cuatro ceros ficticios. La raíz y la ficha comercial no reciben navegación de gestión. No se cambian los destinos de moderación/notificaciones, el login o las sesiones.

Con la sesión admin introducida por el usuario: `/admin`375/768/1024/1440 sin overflow del body,rail224px sólo a1440; menú de cuenta340px dentro del viewport y Escape devuelve foco al toggle. En catálogo anónimo, menú abierto/cerrado/Escape y ruta activa correctos en375/768/1024,nav normal a1440. No se pulsaron notificaciones ni moderaciones, ni se guardaron datos. Nueva observación confirmada dentro de UX-011: la rejilla fija de filtros admin desbordaba a768px; se ajustó exclusivamente gridTemplateColumns al ancho disponible. Mismos campos/nombres,GET y auto-submit existentes. Tabla ancha conserva scroll interno; el desplazamiento accesible sigue en bloque5.

18pruebasUI y12pruebas Auth/navegación de notificaciones,lint/tiposPASS. La primera ejecución del fixture SSR nuevo falló por resolver React desde un dataURL del propio mock; se corrigió sólo el resolver de la prueba y la suite pasó. No fallo productivo Auth ni bypass. Validación remota,build final y restantes pantallas/estados siguen pendientes. La sesión del navegador anterior ya no estaba disponible al retomar; se reinició el servidor dev3108 y el usuario inició sesión legítima nuevamente, sin copiar tokens/cookies.

Revisión actual en localhost:3108 (dev); las capturas anteriores de3107 conservan la comparación, sin depender de que aquel servidor siga activo. No iniciar correos/callbacks desde3108: no se añadió a la allowlist de Supabase. Para la aceptación Auth se usará un origen local ya autorizado. No realizar nuevos guardados/contactos/moderación o altas reales para comprobar estilos.

Comparar layouts primero, conservar sidebar sólo para gestión en escritorio amplio y navegación adaptable en tableta/móvil. Ficha comercial fuera del dashboard. Administrador se determina en servidor con los permisos existentes; no inferirlo de user_metadata ni concederlo desde la interfaz. Al final: nuevo build/preflight local y regresión completa, después autorización nueva para RC de Netlify. Hasta entonces NO-GO visual.
