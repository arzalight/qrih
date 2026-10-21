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
| 3 · catálogo/detalle/galería | PARCIAL: grid y wrap de precio del bloque1 | Geometría de catálogo PASS; resto PENDIENTE | PENDIENTE |
| 4 · panel/perfil/formularios | PENDIENTE | PENDIENTE | PENDIENTE |
| 5 · administración/secundarios | PENDIENTE | PENDIENTE; necesita rol legítimo para aceptación real | PENDIENTE |
| 6 · ficha/Auth | PENDIENTE; recibe únicamente tokens globales por ahora | PENDIENTE | PENDIENTE |
| 7 · cierre responsive/accesibilidad/performance | PENDIENTE | Pruebas por bloque no equivalen a cierre | PENDIENTE |

### Bloque 1

Archivos: `app/globals.css`, `tests/prelaunch-ui.test.mjs`, script `test:ui` de `package.json` y documentación. Sin cambio de dependencias/lockfile. Grids adaptados al ancho útil, precios con wrap y contraste, radios/sombras/tokens compartidos. Foco de campos ya no se elimina; uploader mantiene foco visible en su label. Movimiento reducido respetado. Textos de estado continúan presentes.

Ocho pares reales de tokens superan4,5:1 en pruebas calculadas de luminancia; foco/surface y foco/paper superan3:1. Esto no certifica WCAGglobal: estilos inline, imágenes, teclado/lectores y todos los estados siguen sujetos a revisión. Catálogo local a768px: tarjeta≈419px frente a≈134px anteriores;375≈337,5/1024≈314,8/1440≈274,7px. Cero precios con scrollWidth>clientWidth de13 y sin overflow del body en los cuatro anchos. Capturas comparativas permanecen en el espacio privado de trabajo, no en Git.

UX-001: corrección local y reproducción de catálogo verificadas; aceptación del RC pendiente. UX-004: pares de tokens corregidos/probados, revisión de toda la UI pendiente. UX-008/014: consolidación inicial, no cierre global. Resto de hallazgos abiertos hasta sus respectivos bloques.

## Límites y continuación

### Bloque 2 — 21oct2026

`Header` conserva sin cambios los handlers de carga/consulta, click de notificaciones y signOut; se extrae presentación a clases, aria-current/expanded/controls y Escape con retorno al disparador. Menú normal hasta1199px, rail224px sólo gestión>=1200. `body:has(.header--workspace)` reserva el espacio sólo cuando esa cabecera se renderiza, sin route groups/layouts nuevos ni cambios de URL. Las seis páginas admin pasan la variante administrativa únicamente en su retorno autorizado, después de los guards activos de servidor; no se concede rol por URL/user_metadata ni se reemplaza su autorización. Footer conserva contenido/rutas y se retiran colores inline duplicados.

`/panel` ahora redirige en servidor a `/mis-propiedades`, preservando marcadores sin enseñar cuatro ceros ficticios. La raíz y la ficha comercial no reciben navegación de gestión. No se cambian los destinos de moderación/notificaciones, el login o las sesiones.

Con la sesión admin introducida por el usuario: `/admin`375/768/1024/1440 sin overflow del body,rail224px sólo a1440; menú de cuenta340px dentro del viewport y Escape devuelve foco al toggle. En catálogo anónimo, menú abierto/cerrado/Escape y ruta activa correctos en375/768/1024,nav normal a1440. No se pulsaron notificaciones ni moderaciones, ni se guardaron datos. Nueva observación confirmada dentro de UX-011: la rejilla fija de filtros admin desbordaba a768px; se ajustó exclusivamente gridTemplateColumns al ancho disponible. Mismos campos/nombres,GET y auto-submit existentes. Tabla ancha conserva scroll interno; el desplazamiento accesible sigue en bloque5.

18pruebasUI y12pruebas Auth/navegación de notificaciones,lint/tiposPASS. La primera ejecución del fixture SSR nuevo falló por resolver React desde un dataURL del propio mock; se corrigió sólo el resolver de la prueba y la suite pasó. No fallo productivo Auth ni bypass. Validación remota,build final y restantes pantallas/estados siguen pendientes. La sesión del navegador anterior ya no estaba disponible al retomar; se reinició el servidor dev3108 y el usuario inició sesión legítima nuevamente, sin copiar tokens/cookies.

Revisión actual en localhost:3108 (dev); las capturas anteriores de3107 conservan la comparación, sin depender de que aquel servidor siga activo. No iniciar correos/callbacks desde3108: no se añadió a la allowlist de Supabase. Para la aceptación Auth se usará un origen local ya autorizado. No realizar nuevos guardados/contactos/moderación o altas reales para comprobar estilos.

Comparar layouts primero, conservar sidebar sólo para gestión en escritorio amplio y navegación adaptable en tableta/móvil. Ficha comercial fuera del dashboard. Administrador se determina en servidor con los permisos existentes; no inferirlo de user_metadata ni concederlo desde la interfaz. Al final: nuevo build/preflight local y regresión completa, después autorización nueva para RC de Netlify. Hasta entonces NO-GO visual.
