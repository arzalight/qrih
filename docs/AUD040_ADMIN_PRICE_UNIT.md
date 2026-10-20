# AUD-040 — Unidad de precio en edición administrativa

**Entrega20oct autorizada:** usuario «SI» autoriza subir a develop y un único RC adicional Free en qrih-staging, sin producción. Fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a` preparada en objeto GitHub y Git local con SHA idéntico; documentación/evidencia en commit separado, main intacta. [Manifiesto180 nuevo](rc-candidate-inputs-2026-10-20-aud040.json). Guards Free/builds detenidos/variables STAGING y saldo283,7/300créditos verificados. En este corte aún no POST de build ni validación remota de la corrección; textos inferiores de «sin autorización/commit» son antecedentes.

20 de octubre de2026. **MEDIO / CONFIRMADO / CORREGIDO LOCALMENTE / NO DESPLEGADO.**

## Problema y evidencia previa

El fixture autorizado `0198d9d9-08d4-4749-bc61-5f5563cbaeea` conserva en BD `price_unit=m2` (lectura exacta y sin cambios). En el formulario administrativo desplegado, DOM observado: opción vacía «Sin unidad» seleccionada; opciones disponibles `''`, `m²`, `total`. El valor persistido `m2` no tiene opción correspondiente. La acción de guardado lee ese campo y transforma la cadena vacía aNULL en la actualización.

Está confirmado el desacuerdo BD/formulario y la ruta de guardado que permite pérdida de unidad; **no se ejecutó la escritura defectuosa ni se observó corrupción real**. Podría afectar cálculos y presentación comercial después de guardar otros cambios administrativos. No escalamiento de privilegios ni vulnerabilidad RLS demostrados.

## Corrección mínima

- `app/admin/[id]/page.tsx`: dos líneas. La etiqueta visible sigue siendo `m²`, el valor enviado es `m2`. El default admite representación histórica `m²` y la selecciona como `m2`; `total`, NULL y vacío conservan su significado. Sin migración ni reescritura de datos.
- Cinco regresiones en `tests/profile-property-management.test.mjs`: AST del select real y render SSR de React para `m2`, `m²`, `total`, NULL y vacío; comprueban opción seleccionada y valor canónico.5fallos antes/5PASS después.
- `tests/synthetic-test-environment.test.mjs`: conteo exacto del proceso hijo33→38 por esas cinco pruebas, conservando exit0/fail0/skips0 y el entorno sintético. El primer npm test posterior detectó ese conteo obsoleto; se corrigió, sin debilitar el control.

## Validación local

[Recibo de ejecución y huellas de los tres archivos](aud040-local-2026-10-20.json).

138unitPASS/0fallos/0skips (incluye hijo38), cinco casos AUD040PASS, lint y TypeScriptPASS, build30páginas/ProxyPASS, preflight/bundle sin clave privada examinadaPASS,31HTTPlocalhostPASS/0skips y diff-checkPASS. BUILD_ID local `NwiPepFuxUeZzLahbyAlQ`. No réplica de93SQL: no SQL/RLS/migraciones modificados. Servidor propio localhost3107 pausado con PID/carpeta verificados y reabierto; cookies legítimas conservadas, sin cambios de producción.

Tres entradas de las180funcionales anteriores cambian: página administrativa y los dos archivos de pruebas. El manifiesto/READY previo de5c4970e permanece histórico y **no acredita esta corrección**. Sin dependencia ni arquitectura nuevas, sin commit/push/deploy de este lote aún.

## Gate para cierre

Entregar fix/pruebas y documentación de aceptación a develop, nuevo manifiesto/corte revisados y **un único RC adicional sólo si el usuario lo autoriza explícitamente**. Revalidar Free/cuota/builds detenidos antes; no producción/main ni migraciones. Después READY/SHA y humo, comprobar selector y guardado de unidad sobre el fixture rechazado autorizado, no sobre inmuebles reales. No repetir la creación/duplicación/publicación del ciclo ya aceptado.

La aceptación operativa del usuario cubre riesgos de recuperación24h/carga no medidos para un piloto supervisado, no este defecto comercial. **GO del piloto pendiente sólo de entregar y verificar esta corrección** dentro del alcance acordado; no GO de producción o promesa de SLA. [Aceptación funcional y límites](soft-launch-moderation-2026-10-20.json).
