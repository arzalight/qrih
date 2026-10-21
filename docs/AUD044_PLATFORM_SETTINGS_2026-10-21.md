# AUD-044 — Configuración de soporte sin fila inicial

**MEDIO / CONFIRMADO / CORREGIDO EN DATOS STAGING; UI LOCAL VERIFICADA.** Sin nuevo deploy ni validación de UI remota.

## Evidencia y causa

Con sesión administradora legítima, el build local3107 mostraba «Error cargando configuración» y «Cannot coerce the result to a single JSON object». La consulta existente en app/admin/configuracion/page.tsx exige id=true con single(). Una comprobación privilegiada exclusivamente de COUNT confirmó0filas en el QRIH STAGING mcyxunymhuxyiwklyfpy; no era prueba positiva de RLS, sino diagnóstico de existencia. Migración036 ya define tabla singleton/constraint y la inserción inicial de id=true, support_email=NULL. No se determinó por qué faltaba ese dato ni se atribuye al rediseño/recuperación por inferencia.

Impacto: administrador no puede abrir el formulario ni configurar correo de soporte; la cuenta suspendida conserva el aviso pero sin dirección de contacto. No escalamiento, publicación indebida o exposición de secretos demostrados.

## Corrección acotada autorizada

Usuario autorizó expresamente crear sólo esa fila en STAGING. Se verificó de nuevo COUNT=0; INSERT de id=true/support_email=NULL, sin upsert ni modificación de existentes; readback COUNT=1/id=true/correoNULL. Cualquier discrepancia detenía el proceso sin reintento. Resultado:1fila insertada,0filas actualizadas/eliminadas,0migraciones,0cambiosRLS. Sin tocar propiedades, perfiles, Auth, Storage o producción.

No se reejecutó036 ni se creó una migración repetida. El correo no se deduce de SMTP/correos personales: queda vacío por decisión autorizada, pendiente de definición humana.

## Verificación

Nueva lectura con sesión admin real en localhost3107: título «Configuración», campo support-email presente/vacío y0alertas. Captura privada settings-aud044-pass.png fuera de Git. No se pulsó Guardar ni se alteró la política de permisos. La validación anónima HTTP conserva el redirect administrativo al login.

Pendiente: elegir dirección de soporte y guardarla bajo autorización; verificar UI del nuevoRC remoto cuando se autorice. Este hallazgo/corrección no convierte el nuevo alcance visual en GO.
