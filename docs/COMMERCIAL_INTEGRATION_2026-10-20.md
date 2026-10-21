# QRIH — Integración comercial / control vigente

## Resultado vigente — RC publicado, aceptación final pendiente

20oct2026,21:08CDMX: RC `5f7b8e2a50c55ea1b4320746f1a7468e8e1ce623` publicado en QRIH STAGING, deploy `6ad82c6afc32e2d1cb980405`. [Recibo remoto](commercial-deploy-verification-2026-10-20.json): un único build, SHA/READY/publicación exactos,157unitCI/31HTTP PASS,0fallos/0skips, lint/tipos/build/preflight/scanner276archivos PASS.187entradas funcionales/huella5f72e610… conservadas; main/producción intactos, Free/saldo previo268,1 y stop_builds restituido. No otro deploy por documentos.

Ficha, seis WebP por bytes, galería interactiva, privacidad/cache/404no públicas y filtros por moneda/rango comprobados en sitio desplegado. PDF real remoto1.393.248bytes,3páginas/6fotos/precio6.50USD y total73,788USD; páginas renderizadas y revisadas. **AUD042 CORREGIDO/DESPLEGADO/VERIFICADO**. AUD041 cinco correcciones confirmadas y verificadas, sin conversión.

Sesión legítima localhost+STAGING: borrador existente1MXN→1USD→1MXN, reabrir conserva selección, precarga de duplicación conservaUSD/m2/7fotos; no se guardó otra copia. Sólo dos fixtures, finales rejected/draft, portada/galerías y otros campos comparados iguales, salvo updated_at y texto derivado esperado `$1 MXN/m²/mes` en el borrador editado. Sin borrados/contactos/publicación nueva.

**GO técnico del RC; NO-GO apertura comercial hasta altaUSD/duplicación guardada/revisión conservando moneda.** El alcance de dos fixtures no permite una tercera por inferencia; permiso adicional acotado solicitado, aún no usado. Las pruebas sintéticas109y el E2E anterior conservan su alcance; no se presentan como altasUSD actuales ni todos los roles/estados/Safari/RTO/carga reales.

**AUD043 MEDIO / CONFIRMADO / NO CORREGIDO:** enlace del PDF deriva de Request.url (route.tsx409), cuyo origen Netlify es el permalink exacto del deploy. Link200 comprobado, sin localhost/secretos, pero no dominio canónico. Posible pérdida de vigencia tras futuros despliegues/retención es riesgo inferido, no caída actual ni ensayo temporal. Corrección propuesta pequeña: origen público canónico allowlisted + regresión de adaptador en próximo lote autorizado; no confiar en Host arbitrario ni consumir otro RC ahora. Ficha compartida usa enlace estable del dominio público, no ese permalink ni Storage como identificador.

### Antecedentes — integración previa al RC

20oct2026 CDMX; verificación posterior21oct02:49:20UTC. El corte siguiente sustituía respaldo/052 pendientes. No sustituye pruebas históricas ni promete disponibilidad.

## Gates completados

- [Respaldo nuevo](backup-verification-2026-10-20.json): BD/Auth/66objetos Storage,51tablas,8.071.288bytes cifrados. Paquete local y segunda copia Drive privada, lectura de retorno/tamaño/SHA256 iguales; tres generaciones conservadas. Sin restore, borrado ni clave subida. Es una captura previa a052, no una copia continuamente actualizada de las escrituras posteriores.
- [052 aplicada una sola vez](commercial-staging-migration-2026-10-20.json) en `mcyxunymhuxyiwklyfpy`, con preflight y registro atómico del historial.12filas históricas conservadas salvo columna nueva MXN;23tablas restantes/catálogos normalizados/RLS/ACL/Storage comparados. Cinco fuentes de función/seguridad/search_path y verificación independiente PASS. No repetir001–052, repair ni db push global.
- Advisors:1error/31warnings/3info al consultar. El error corresponde a la excepción previamente documentada de vista pública definer `properties_public`, con filtro/barrera/proyección revisados; no se afirma cero avisos ni cierre de todos los warnings.
- Código funcional `715e42a`, corrección posterior `77cd6800b37c7ce13463e476eade766de901ea5e`, rama `feature/commercial-sharing-currency`.157pruebas de aplicación PASS,0fallos/0skips;109SQL temporales PASS; lint/tipos/build y preflight PASS. Build local `5ULX_7OfZmAiera2voFAT`. El recibo local de156pruebas es histórico y no se reescribe.

## AUD-041 — ALTO / CONFIRMADO / DATOS CORREGIDOS Y VERIFICADOS

La confirmación inicial «todos MXN» contradijo descripciones históricas USD. Se detuvo la aceptación comercial y se obtuvo confirmación explícita por ID/importe, sin inferencia ni conversión. Dos operaciones acotadas y transaccionales corregidas una vez, con locks/timeouts/precondiciones/hash de descripción, comparación de todos los demás campos y cinco registros honestos de auditoría (`actor_id NULL`, mantenimiento postgres, sin suplantar propietario).

| Propiedad / ID | Importe exacto conservado | Resultado confirmado |
| --- | --- | --- |
| PIQ · f0676768-27bd-4b32-ba1f-91c5ef38f686 | 6.50 | USD/m²/mes |
| Colón · 7aa8cb4e-2ea4-4a34-8a48-bee2f841526f | 6.75 | USD/m²/mes; unidad antes NULL, ahora m2 autorizada |
| El Marqués · 14ae4738-ba2b-41ce-98e0-35435cf8bd44 | 5.00 | USD/m²/mes |
| Colón · 219860d1-c672-46a5-b5a3-b8837085c6bc | 6.39 | USD/m²/mes |
| Colón · 520369a2-d461-4a5c-9e0b-deab1375c693 | 6.39 | USD/m²/mes |

Sólo moneda y texto derivado `price_display` (y unidad autorizada en un registro); `updated_at` por trigger existente. Cantidades, descripciones, estados, fotos y otros campos conservados; no nueva publicación. Actualizar el texto derivado mantiene moneda correcta también para el artefacto anterior que aún no lee `price_currency`. Esta compatibilidad no autoriza publicar más USD desde clientes antiguos. Los tres registros adicionales fueron detectados en una lectura posterior; no se atribuye su creación al agente ni se considera estático STAGING.

Verificación independiente21oct02:49:20UTC: cinco importes/monedas/unidades/visibilidad correctos; cinco auditorías sin conversión; una sola052; bucket privado/WebP; fila114conunidadNULL intacta. Proyección pública anónima:13filas,0contradicciones de tokens USD frente a MXN detectadas. Ese sondeo no demuestra que todo precio del negocio sea correcto. [Recibo](commercial-integration-verification-2026-10-20.json).

## AUD-042 — ALTO / CONFIRMADO / CORREGIDO LOCAL + GITHUB; RC PENDIENTE

`lib/property-price.ts` interpretaba unidad vacía como total mensual pese a anuncios heredados por m². Corrección mínima en `77cd680`: unidad no reconocida conserva el anuncio original y moneda; no calcula total ni inventa unidad. Regresión en `tests/commercial-properties.test.mjs` para NULL/undefined/vacío/desconocido. Unidades válidas siguen calculándose exactamente. Registro `4abacc35-d2c1-464f-8c61-d609f7cac069`:114MXN,unidadNULL,anuncio `$114/m²` conservados sin backfill inferido.

## Aceptación real completada y límites

Localhost3107 contra QRIH STAGING: sesión legítima de propietario, menú Compartir/copiar y mensaje «Enlace copiado.»; controles deshabilitados en fixtures no publicados. Sin mensajería WhatsApp enviada, nueva propiedad ni aceptación de términos. Ficha pública usa cliente anónimo separado.

Lecturas HTTP anónimas: ficha published200, no-store/no-referrer/noindex, sin cookie ni navegación/footer/captación; seis WebP firmadas verificadas por bytes/MIME/magic. Slugs rejected/draft/inexistente404. Anuncio heredado114preservado sin total inventado. PIQ muestra US$6.50USD/m²/mes y total US$73,788USD/mes.

PDF real generado desde localhost con datos/fotos autorizados: HTTP200,application/pdf,no-store,1.393.172bytes; tres páginas renderizadas e inspeccionadas, seis imágenes embebidas, precio anunciado/total USD y sin precio anterior MXN. El enlace interno apunta correctamente al origen localhost de esta prueba; se comprobará el origen Netlify tras deploy. No se subieron PDFs ni imágenes reales a GitHub.

No se trasladan los PASS sintéticos a creación/duplicación/edición USD mediante sesión real, todos los roles/estados, Safari, concurrencia o renovación prolongada. No se crea una tercera fixture. La aceptación gestionada del RC anterior sigue siendo histórica. Firmas anteriores conservan TTL900s/300sPDF y PDF descargado no es revocable. RTO24h/carga real no medidos y riesgo AUD018 operativo aceptado previamente conservan su alcance.

## Siguiente gate

Manifiesto nuevo preparado:187entradas, huella `5f72e61052bcfc6e063deb342fd2103fdd6dca49712d190f23ef45989587fb37`; fuente77cd680/build5ULX. Documentación sincronizada localmente. La creación de blobs documentales en GitHub fue detenida por revisión automática de privacidad: rutas locales y referencias de respaldos/Drive/custodia en documentos operativos requieren confirmación de su inclusión en el repositorio privado. No se elude el rechazo mediante otro canal; ningún nuevo commit/ref/develop/deploy por este intento. Parte de los blobs no referenciados fue creada antes del rechazo, no equivale a entrega de rama.

Autorización posterior recibida del usuario («SI»): incluir esas referencias operativas/rutas/Drive en `arzalight/qrih` privado, visibles a quienes tienen acceso al repositorio; no claves, contraseñas ni bundles de respaldo. El rechazo previo se conserva como antecedente, no se elude ni se interpreta como autorización de secretos.

Continuación: integrar documentación y develop sin main, cuota Free fresca y builds detenidos. Lectura actual Netlify confirma Free/stop_builds y artefacto anterior; dashboard muestra268créditos disponibles (redondeado),0builds y ninguna tarjeta registrada. Un único RC autorizado, sin reintento automático; comprobar SHA/READY/publicación, humo y matriz comercial antes de un nuevo dictamen. No deploy documental ni producción.
