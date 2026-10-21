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
| 2 · navegación/layouts | PENDIENTE | PENDIENTE | PENDIENTE |
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

Revisión actual en localhost:3108 (dev) para conservar la base anterior en3107 durante la comparación. No iniciar correos/callbacks desde3108: no se añadió a la allowlist de Supabase. Para la aceptación Auth se usará un origen local ya autorizado. No realizar nuevos guardados/contactos/moderación o altas reales para comprobar estilos.

Comparar layouts primero, conservar sidebar sólo para gestión en escritorio amplio y navegación adaptable en tableta/móvil. Ficha comercial fuera del dashboard. Administrador se determina en servidor con los permisos existentes; no inferirlo de user_metadata ni concederlo desde la interfaz. Al final: nuevo build/preflight local y regresión completa, después autorización nueva para RC de Netlify. Hasta entonces NO-GO visual.
