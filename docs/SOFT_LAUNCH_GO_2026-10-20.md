# QRIH — Dictamen de Soft Launch

## Dictamen histórico — alcance comercial ampliado todavía NO-GO

El usuario añadió después de este dictamen Compartir y MXN/USD como requisitos. [Estado actual y matriz](COMMERCIAL_SHARING_CURRENCY.md): implementado/probado localmente, 052 sin aplicar ni validar en STAGING, sin nuevo RC. **El GO condicionado que sigue corresponde sólo al artefacto anterior; no es el GO del nuevo alcance.** Se preserva su evidencia sin reescribir resultados históricos.

20 de octubre de 2026. **GO CONDICIONADO para un piloto supervisado en el QRIH STAGING existente**, con los datos reales ya seleccionados por el usuario. No GO de producción, apertura indiscriminada ni garantía de disponibilidad.

## Evidencia que cierra el gate técnico actual

- [RC y verificación](aud040-deploy-verification-2026-10-20.json): commit publicado `f803f35faba9cf871a81f93560112e20358230c2`, fuente `4c7d05057f2429306d8ed5ba6097d9b273eb292a`, deploy `6ad79257b59620a2a787e9a1`, READY/publicación/SHA exactos. [Aplicación del piloto](https://qrih-staging.netlify.app).
- 138 pruebas unitarias remotas y 31 comprobaciones HTTP remotas: PASS, 0 fallos y 0 omisiones; lint/tipos/build/preflight completos. [Manifiesto de 180 entradas](rc-candidate-inputs-2026-10-20-aud040.json). Documentación posterior no modifica el artefacto ni requiere otro build.
- [Aceptación autenticada](soft-launch-moderation-2026-10-20.json): publisher y admin legítimos, publicación→cancelación→retiro→edición→revisión→rechazo; acceso público/privado e imágenes/PDF comprobados en localhost y STAGING; duplicación con 7 rutas nuevas, portada y edición independientes. Límite de cobertura declarado, no certificación universal.
- **AUD-040 MEDIO CORREGIDO/DESPLEGADO/VERIFICADO:** selector real elige `m2` con etiqueta `m²`; guardado administrativo autenticado del fixture retorna éxito y conserva unidad. Huellas de ambas propiedades y galerías iguales antes/después, excluyendo sólo updated_at. Ningún guardado defectuoso sobre inmuebles reales.
- Ambos fixtures siguen sin publicar: original rejected y duplicado draft, 14 WebP conservados. Sin borrados, nuevas migraciones, privilegios suplantados ni modificaciones de inmuebles reales por el agente.
- Free, sin recargas/overages/pagos; 283,7 créditos observados antes, un único build autorizado y builds automáticos detenidos. Main/producción intactos. El contexto Netlify «Production: develop» es el slot publicado de qrih-staging, no producción del negocio.

## Condiciones aceptadas por el usuario

Respuesta explícita: «Sí, acepto esos límites para el piloto». Fabián supervisa el piloto y la política manual de copias ya acordada. **Recuperación integral dentro de 24 h y carga/concurrencia real NO están medidas.** No transformar objetivo o aceptación de riesgo en un PASS, SLA o promesa de recuperación.

1. Mantener copia cifrada verificada por día de uso y antes de cambios importantes, local más segunda copia privada Drive, clave separada. Objetivo: 3 generaciones; hoy existen 2 verificadas en su corte. Sin poda automática ni respaldos diarios programados.
2. Fabián pausa manualmente nuevas altas si falla respaldo, correo o cuota. Revisar el incidente y la última copia válida antes de continuar; no se implementó un cierre automático ni monitoreo permanente del agente.
3. Mantener el piloto supervisado y no promover a producción/main sin permiso y revisión propios. GitHub es fuente del código, no respaldo de BD/fotografías.
4. Desarrollo en localhost+Supabase STAGING+GitHub; Netlify sólo para nuevos RC expresamente autorizados. No otro deploy por cerrar este documento.

La copia cifrada local previa se revalidó por hash sin descifrar; checkpoint del 20 de octubre a las 15:45 UTC, antigüedad aproximada de 12,82 h en ese momento. No nueva exportación, transferencia, restore ni revisión actual de permisos Drive. El ensayo de recuperación previo conserva su evidencia acotada; **AUD-018 conserva riesgo operativo residual aceptado para este piloto, no se declara totalmente corregido**.

## Seguimiento no bloqueante dentro del piloto condicionado

Medir recuperación integral en 24 h y carga/concurrencia; comprobar renovación natural prolongada de firmas; acumular generaciones verificadas y revisar operación real/correo/cuotas. Los estados/actores no probados en vivo, PDFs sin nuevo render visual y controles sintéticos conservan esos límites. No forzar pruebas destructivas para simular cobertura. URLs ya firmadas duran su TTL y PDFs descargados no son revocables.

Este dictamen permite planear el inicio del piloto dentro del alcance aceptado. **No envía invitaciones, no publica registros adicionales, no cambia producción ni sustituye el consentimiento del usuario para acciones nuevas.**
