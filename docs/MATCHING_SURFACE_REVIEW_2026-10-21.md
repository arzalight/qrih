# Matching de superficie — 21oct2026

## Dictamen acotado

**MEDIO / CONFIRMADO / CORREGIDO EN SUGERENCIAS LOCALES / RC REMOTO PENDIENTE.** DEM-001 conserva su ID. Corrección funcional independiente de la presentación: un requerimiento de234–234m² recibía90,5440 y5511m² como coincidencias. No hallazgo nuevo de autenticación o exposición de datos.

## Causa comprobada

lib/matching.ts calcula puntuación ponderada, no elegibilidad: operación30 + zona general20 + zona industrial20 ya suman70 aunque la superficie puntúe0.90m² obtiene aproximadamente75.77 por la función gradual de superficie y se etiqueta Alta coincidencia. rankPropertiesForDemand ordenaba todas las candidatas y los consumidores tomaban las tres primeras, sin excluir fuera de rango. Reproducido en prueba con los mismos tamaños y en la interfaz anterior.

## Corrección mínima

Los rangos mínimo/máximo indicados se respetan inclusivamente antes de ordenar sugerencias;sin margen porcentual nuevo. Un solo extremo deja abierto el otro. Si hay rango pero falta superficie verificable,no se sugiere compatibilidad. Límites no finitos,negativos o invertidos no producen sugerencias. Sin rango,se conserva el comportamiento anterior.

rankPropertiesForDemand y rankDemandsForProperty usan la misma condición. calculateMatch/pesos/normalización/comparación de presupuesto no cambian. No se crean índices,campos,APIs,cuentas o dependencias.

| Consumidor | Alcance |
| --- | --- |
| app/mis-propiedades/page.tsx,view=requirements | Ordena sólo propiedades dentro del rango;el234–234 existente ahora muestra ninguna compatible |
| app/mis-propiedades/page.tsx,view=opportunities | Usa la misma función antes de mostrar opciones;sin postulaciones nuevas |
| app/busco-bodega/page.tsx | Sugerencias posteriores al alta usan la misma función;no se envió otro requerimiento |
| app/admin/page.tsx | Ranking inverso aplica la misma condición;prueba sintética,sin moderación ni nuevo E2E positivo |
| API/RPC/SQL/RLS | Sin modificación ni ejecución. Este filtro de sugerencias no es una nueva autorización de registro en servidor |

## Verificación

215pruebas PASS(51UI incluidas),31HTTP anónimas PASS,lint/tipos/build/preflight/diff-check PASS;0fallos/0skips.7pruebas nuevas de matching:reproducción90/5440/5511→exclusión y234→inclusión,ambos límites,extremos abiertos,superficie ausente,no finitos/rango inválido,sin rango y ranking inverso. Se actualizó únicamente41→48 en el contador de la prueba de aislamiento CI porque ejecuta las7nuevas pruebas;no se relajaron guardas de origen ni aserciones de0fallos/0skips. La primera ejecución falló sólo por ese contador esperado;repetición final completa PASS.

Con sesión legítima y build local3107,el requerimiento existente conserva sus valores/fecha/estado y muestra Aún no encontramos propiedades compatibles;no aparecen90/5440/5511.375/768/1024/1440 sin overflow. No envío,copia,borrado,postulación,interés,moderación o cambio de presupuesto/superficie. Sin push,commit,deploy,producción o migraciones.

## Límites

Esto corrige superficie de las sugerencias,no certifica todo el motor de matching. Operación,zonas y presupuesto conservan puntuación original;no se convierten todos los criterios en filtros estrictos. No se infiere moneda de requerimientos históricos ni conversión de presupuesto. No se modifica la puntuación SQL ni la elegibilidad de postulaciones del RPC;si se requiere una regla obligatoria también al registrar,debe revisarse explícitamente en otro lote. No nueva suiteSQL/migración aplicada por esta corrección. NO-GO del nuevoRC visual/funcional hasta aceptación y deploy expresamente autorizado.
