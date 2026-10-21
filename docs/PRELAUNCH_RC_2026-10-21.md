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

**PUBLICADO / READY / VERIFICACIÓN REMOTA ACOTADA PASS.** No heredar ni ampliar el GO del RC comercial anterior por esta entrega. AUD043 y riesgos operativos AUD018 siguen separados; no nueva prueba autenticada de alta/edición/moderación, carga o RTO.

## Identificadores base

- main intacto: `55b773756066cd3975b3964dc67f106cf15ead4c`.
- develop antes de integrar: `1992ca81e9967ee2946133154c81a0b6597c7399`.
- RC remoto anterior: `5f7b8e2a50c55ea1b4320746f1a7468e8e1ce623` / deploy `6ad82c6afc32e2d1cb980405`.
- SHA publicado: `84169857330a81bd9b1a0f7ee5d9750a2586c2d3`.
- Árbol Git del RC: `05b6fc4045f35d64ff83e82d0f55c91f5f282596`.
- Commit funcional de superficie: `6e731a1`; UX/precios aprobados: `d37c69b`.
- Build `6ad9345ad070f6760a151f7e`; deploy `6ad9345ad070f6760a151f80`.

## Resultado remoto — 21oct2026, 15:54 CDMX

Una solicitud de build, sin reintentos. API confirmó READY/done=true/error=false, commit exacto y published_deploy iguales al RC. Publicado `2026-10-21T21:54:20.462Z`. El panel llama Production al contexto que sirve qrih-staging: no es main ni el Supabase de producción. [Sitio STAGING](https://qrih-staging.netlify.app/) / [deploy](https://app.netlify.com/projects/qrih-staging/deploys/6ad9345ad070f6760a151f80).

Build remoto: 232 pruebas PASS, 0 fallos/omitidas, compilación correcta y secrets scan de 288 archivos sin hallazgos. Evidencia leída del panel, sin publicar logs completos. Las 31 HTTP anónimas pasan contra el dominio STAGING: rutas privadas sin sesión, API inválida/no autenticada, origen y callbacks inválidos sin sesión fabricada. Sin escrituras válidas ni cambios de cuentas.

Inicio remoto: seis tarjetas, monedas/precios nuevos visibles. Ficha independiente PIQ: `$6.5 USD m²/mes`, `$73,788 USD/mes`, acceso a PDF y galería presentes, sin navegación/contactos administrativos. No se forzó descarga de todas las fotos lazy. PDF remoto generado correctamente; texto extraído y primera página renderizada/inspeccionada con importes/moneda/unidad correctos y sin recortes en precios. Las descripciones libres históricas no se reescriben. Lecturas no equivalen a nueva aceptación de todos los estados autenticados.

Builds automáticos restaurados a detenidos inmediatamente tras aceptar la solicitud, comprobados al finalizar por API; no nuevos builds por la documentación de cierre. Free, recargas y sobrecostos desactivados; saldo mostrado por el panel al cierre 251 créditos (la contabilidad puede actualizarse después, no afirmar coste cero en créditos). Ningún pago, cambio de plan, producción, migración o modificación de datos por este deploy.

Capturas y copia pública de verificación fuera de Git en el workspace: netlify-published-20261021.png, staging-published-prices-20261021.png, staging-commercial-sheet-20261021.png, prices-remote-pdf-page1.png y prices-remote-piq-20261021.pdf. No respaldos ni credenciales incluidos. La documentación de cierre se entrega con skip netlify; un HEAD documental posterior no cambia el SHA funcional publicado.
