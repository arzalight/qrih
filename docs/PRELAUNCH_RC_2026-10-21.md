# QRIH — RC visual y formato de precios / 21oct2026

## Autorización y alcance

Tras revisar localhost, el usuario confirmó «correcto. procedemos a subir a netlify». Se autoriza esta entrega del alcance aprobado al sitio existente qrih-staging, desde develop; no producción/main, nuevas cuentas, pagos, recargas ni cambios Supabase. El conector Supabase de otra cuenta no se usa. Código oficial en arzalight/qrih privado; autorización documental previa conserva sólo referencias de custodia, nunca claves o respaldos.

## Contenido

- Siete bloques UX previamente registrados y comentarios posteriores: panel, navegación/cuenta, requerimientos, inicio con seis propiedades, campos/espaciado de Publicar, descripción editable y capas decorativas.
- DEM-001 por separado: sólo elegibilidad por rango de superficie antes de ordenar sugerencias; no cambios de puntuación, SQL/RPC o autorización de postulaciones.
- Formato visual centralizado de precios en tarjetas/catálogos/panel/detalle/admin/ficha/PDF. Valores, moneda, unidad, precisión y cálculo intactos; formato de escritura anterior separado y probado para no reescribir price_display por estética.

## Evidencia local vigente

232 pruebas de aplicación PASS, 31 HTTP anónimas PASS, lint/tipos/build/preflight y diff-check PASS. La primera pasada HTTP sin permiso de red falló EPERM antes de conectar; repetida con acceso a localhost pasó 31/31. No defecto de aplicación atribuido a esa restricción.

PDF público local PIQ: `$6.5 USD m²/mes`, `$73,788 USD/mes`, primera página renderizada y revisada. Tarjetas reales con seis imágenes cargadas. Límites de responsive/roles y otras verificaciones conservados en [registro UX](PRELAUNCH_UI_IMPLEMENTATION.md); no afirmar certificación global, carga o RTO por esta entrega.

## Gate de publicación

Netlify Free comprobado por API: recargas automáticas desactivadas, sobrecostos no incluidos, repo arzalight/qrih, rama develop, logs privados, builds automáticos detenidos y sin builds activos. Panel Usage & billing muestra 251 créditos el 21oct2026, antes de la solicitud. Se permite una sola solicitud de build Git, con ventana temporal acotada y restauración inmediata de stop_builds=true. Sin retry automático ante fallo o resultado incierto.

Se comprobarán SHA exacto, estado READY, publicación en qrih-staging, comprobaciones HTTP anónimas y precios/ficha/PDF remotos. Hasta obtener esa evidencia, la entrega remota sigue PENDIENTE; no heredar el GO del RC comercial anterior. AUD043 y riesgos operativos AUD018 siguen separados.

## Identificadores base

- main intacto: `55b773756066cd3975b3964dc67f106cf15ead4c`.
- develop antes de integrar: `1992ca81e9967ee2946133154c81a0b6597c7399`.
- RC remoto anterior: `5f7b8e2a50c55ea1b4320746f1a7468e8e1ce623` / deploy `6ad82c6afc32e2d1cb980405`.
- SHA nuevo, deploy y resultado: se registrarán tras la solicitud/verificación, sin incluir credenciales ni logs privados completos.
