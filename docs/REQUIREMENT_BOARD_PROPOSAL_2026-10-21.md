# Tablero de requerimientos — propuesta pendiente de implementación/aplicación

## Decisión confirmada por el usuario

Nueva pestaña «Tablero de requerimientos» dentro de Mi panel. Cuentas activas autenticadas podrán consultar los requerimientos activos, incluso sin propiedades propias o coincidencias. Activo conserva exactamente el criterio existente: estado new y fecha dentro de los últimos 45 días, con cuenta solicitante activa. No mostrar nombre, empresa, teléfono, correo, texto libre ni identificadores del usuario solicitante. No se abre al público anónimo.

## Por qué no reutilizar el feed actual como si fuera completo

La migración 050 contiene qrih_private.opportunity_feed/public.qrih_opportunity_feed: devuelve una lista técnica redactada, pero exige una propiedad publicada propia y puntuación >0. RLS de demand_requests sólo deja leer filas propias o de administrador. Eliminar filtros en el cliente no puede obtener «todos»; usar service_role para sacar filas privadas o presentar el feed parcial como tablero completo sería incorrecto.

## Cambio mínimo propuesto, todavía NO ejecutado

Crear una función nueva qrih_private.requirement_board y una fachada public.qrih_requirement_board. No modificar opportunity_feed, register_opportunity, tablas, RLS, registros o funciones existentes.

- La fachada pública será SECURITY INVOKER; la lectura redactada interna necesita SECURITY DEFINER al igual que el feed 050, porque el cliente no tiene acceso a filas privadas ajenas. No usar SECURITY DEFINER como solución genérica a permisos.
- search_path vacío y nombres totalmente calificados. Comprobar auth.uid() no nulo y qrih_private.opportunity_actor_active(), que valida identidad/cuenta activa y rechaza sesiones anónimas. La identidad siempre proviene de la sesión, nunca parámetros/metadata editable.
- Proyección explícita: id, operation, zone_general, zone, area_min, area_max, budget_min, budget_max, status y created_at. No inventar moneda: la proyección vigente de 050 no la define. Si falta, el tablero indicará moneda no especificada; no convertir presupuestos.
- Filtrar d.status='new', d.created_at>=now()-interval '45 days' y EXISTS perfil solicitante con account_status='active'. Incluir propios y ajenos autorizados; no exigir propiedades propias.
- Orden created_at DESC, id como desempate. Paginación de 25 filas, máximo 50 por llamada, offset no negativo; permitir recorrer todos los activos sin devolver un JSON ilimitado. Datos de conteo sólo bajo las mismas restricciones.
- Revocar EXECUTE de PUBLIC/anon/authenticated en ambas funciones nuevas y conceder únicamente lo necesario a authenticated. Reutilizar el schema privado no expuesto; no exponer qrih_private en PostgREST ni tocar permisos de tablas. Sin acceso service_role desde navegador.

## UI preparada como diseño, no activada todavía

Mi panel conservará Propiedades, Requerimientos y Oportunidades; añadirá Tablero de requerimientos (`view=board`) tras disponer de la nueva función. Lista de resumen técnico con operación, municipio/zona, área, presupuesto sin moneda inferida, fecha y estado. Sin datos personales ni botones que registren postulaciones fuera de la validación existente. Vacío honesto, error y navegación por páginas; no confundir lista completa con coincidencias.

No se inserta una pestaña que consulte una función inexistente ni se etiqueta como completo el feed parcial. La nueva pestaña/lista y su lectura se implementarán juntas después de revisar el cambio. Se generará la migración con CLI y siguiente identificador real disponible, tras comprobar inventario; este documento no crea ni ejecuta migraciones.

## Pruebas antes de aplicar

1. Anon/sesión ausente/suspendida/usuario anónimo: ninguna fila; no EXECUTE anónimo.
2. Cuenta activa sin propiedades: ve todos los activos redactados, propios/ajenos; con propiedades no se restringe por score.
3. new de hoy y límite de 45 días incluidos; cerrados, antiguos o solicitante suspendido excluidos. Probar límites temporales de forma determinista.
4. Sin nombre/empresa/email/teléfono/owner_id/user_id/textos libres en payload, HTML o errores.
5. Paginación, orden estable, límites/offset inválidos, conteo bajo iguales restricciones.
6. RLS original de demand_requests sigue impidiendo lectura directa de filas ajenas; opportunity_feed y postulación existentes se mantienen intactos.
7. Prueba SQL sintética separada; después revisión del SQL exacto, respaldo previo autorizado y autorización explícita para aplicar sólo en QRIH STAGING.

## Estado

**DECISIÓN DE ALCANCE CONFIRMADA / PROPUESTA PREPARADA / SIN MIGRACIÓN / SIN PESTAÑA ACTIVA.** No se modificaron datos, grants, RLS ni configuración. Su aplicación no está cubierta por la autorización anterior de deploy del RC8416985.
