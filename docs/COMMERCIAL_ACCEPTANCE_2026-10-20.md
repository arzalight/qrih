# QRIH — Cierre de aceptación comercial del RC

Estado de entrega: el usuario autorizó explícitamente subir a `arzalight/qrih` privado documentación con rutas locales de respaldos, referencias/IDs/enlaces de Drive y referencias de custodia, visibles a sus colaboradores, sin claves, contraseñas ni archivos de respaldo. La revisión automática había detenido la entrega antes de completar árbol/commit/actualización de rama; no se eludió ese control. Se reanuda por el mismo canal con esta autorización verificable. Este cierre es exclusivamente documental: no cambia código funcional, `main` ni el RC publicado, ni inicia otro deploy.

20oct2026 CDMX; comprobación21oct03:42:14UTC. **GO CONDICIONADO para el piloto supervisado en el QRIH STAGING existente.** [Dictamen y condiciones](SOFT_LAUNCH_GO_2026-10-20.md) / [recibo de aceptación](commercial-acceptance-2026-10-20.json). Este cierre sustituye el NO-GO por altaUSD/duplicado/revisión pendientes; los recibos anteriores conservan su fecha y cobertura.

## Artefacto y controles conservados

- RC `5f7b8e2a50c55ea1b4320746f1a7468e8e1ce623`, deploy `6ad82c6afc32e2d1cb980405` READY y publicado comprobados; fuente funcional77cd680,187entradas/huella5f72e610… iguales en disco/Git al manifiesto. No código nuevo por esta aceptación/documentación.
-157unit remotas y31HTTP remotos PASS,0fallos/0skips, lint/tipos/build/preflight y escaneo Netlify276archivos PASS en el RC.109SQL sintéticas previas conservan su cobertura; no son nuevas pruebas gestionadas.
-052 aplicada una vez, respaldo cifrado previo local+Drive/tres generaciones y cinco correccionesUSD confirmadas ya verificados. No repetidos por este cierre. Free y builds detenidos confirmados por API; sin otro deploy, pagos/recargas/overages, producción/main o conector Supabase ajeno.

## Flujos críticos cerrados en el RC real

Usuario autorizó hasta dos registros sintéticos adicionales sin publicar y completó personalmente declaración/términos/Guardar como borrador. El agente no aceptó acuerdos ni creó cuentas. Se usó la sesión legítima de STAGING, distinta de la sesión propietaria anterior de localhost.

| Caso | Resultado comprobado |
| --- | --- |
| Alta USD | Nuevo borrador `2b0a3281-f4e0-4903-963b-af979109d0d7`:100m²,7.50USD/m²/mes; BD numeric devuelve7.5, cantidad equivalente exacta, sin conversión |
| Duplicación completa | Copia `0a385120-c492-454b-a2cd-922dbe5c4a8a` guardada una sola vez como draft, conservaUSD/7.5/m2/100m², título de prueba diferenciado |
| Independencia | Hash de fila original igual antes/después de duplicar; hash de copia igual antes/después de agregar foto y enviar original a revisión |
| Revisión | Primer intento sin foto rechazado por regla existente1–7; no fallo de moneda. Se añadió una JPEG sintética NO COMERCIAL, optimizada/validada WebP. Original pasa a pending, conservaUSD/7.5/m2, edición/compartir deshabilitados |
| Fotografías | Original1WebP privada19.082bytes,MIME/magic comprobados, portada coincide con galería y ruta por propietario; copia0fotos porque se creó antes de añadir la foto al original |
| Privacidad de datos | Anónimo no ve ninguno en properties_public ni tabla base; ficha/detalle/PDF de ambos404 en seis GET, sin firmas en respuestas |
| Privacidad Storage | Firma anónima y URL pública de la imagen pending denegadas; ninguna URL firmada persistida |
| Aislamiento | Otra sesión autenticada con propietario distinto en localhost recibe404 al editar el draft de la nueva cuenta; no se extrajeron cookies/tokens ni se suplantó identidad |

Quedan cuatro fixtures autorizadas, todas sin publicar: previas rejected/draft con7fotos cada una, nuevas pending/draft con1/0. No borrados, contactos comerciales ni cambios nuevos de inmuebles reales por esta aceptación. El pending es claramente NO COMERCIAL: no aprobarlo para el piloto. Se conserva como evidencia; este cierre no autoriza eliminarlo.

## Cobertura que no se inventa

La guía Supabase orientó separar huellas/readback privilegiado de las pruebas de autorización: estas últimas se comprobaron con el anónimo y sesiones legítimas, sin usar service_role para simular acceso de usuario. Changelog y cambios TLS/PG revisados; este cierre no cambia motor, esquema, TLS, dependencias ni permisos.

Ficha compartida published anónima, galería interactiva/seis WebP/PDF real3páginas/precio-totalUSD/filtros comparables y legacy-unit fueron verificados en el RC en el recibo remoto. La nueva duplicaciónUSD se guardó sin fotos; la duplicación con7fotos independientes pertenece a la aceptación gestionada anterior y a regresiones, no a esta nueva copia. EdiciónMXN→USD→MXN/persistencia/precargaUSD7fotos anterior conserva su alcance propio.

No prueba universal de todos los roles/estados, Safari nuevo, concurrencia/carga real, renovación prolongada ni RTO integral24h. Esos límites no se convierten en PASS. La política manual y riesgos operativos ya aceptados para el piloto siguen vigentes; no SLA ni GO de producción.

## Riesgos y mínimo pendiente

- Sin bloqueante crítico/alto confirmado pendiente dentro del alcance técnico probado para este piloto. El riesgo operativo AUD018 aceptado no se declara totalmente corregido.
- **AUD043MEDIO/CONFIRMADO/NO CORREGIDO:** enlace del PDF al permalink del artefacto, actualmente200; origen canónico estable pendiente en próximo lote autorizado. Posible pérdida futura por retención es inferencia, no indisponibilidad actual medida. La ficha compartida sí tiene URL estable pública.
- Firmas previas conservanTTL900s/300sPDF; PDFs descargados no revocables. Presupuestos sin moneda no aportan matching económico y unidades desconocidas no generan totales inventados.
- Operar con Fabián supervisor, copia cifrada por día de uso/antes de cambios, segunda copia privada/clave separada y pausa manual de altas ante fallo de respaldo/correo/cuota. No programar ni exportar por este documento. Producción/main y cualquier nuevo RC requieren autorización propia.
