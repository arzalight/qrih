# AUD-018 — Plan de respaldo y recuperación a $0

Actualización: 2026-10-07, America/Mexico_City; plan iniciado2026-10-06. **ALTO de operación / EN REVISIÓN — NO CORREGIDO.** Herramientas/servicios vacíos y transferencia ficticia preparados; ningún dump, descarga de archivos Storage o restore real realizado.

## Aislamiento vigente — dos reglas autorizadas aplicadas / validación PASS

Usuario autorizó exactamente tabla propia/dos reglas y reversión por fallo, **no exportación ni restore**. `apply-bridge-guard.mjs` fuera del checkout ejecutó preflight, SQL local READ ONLY/vacío, whitelist/hash de propuesta y --check, snapshot privado y carga atómica en br-01ed69b976c4. Se añadió create table para rechazar un nombre concurrente existente; mismo contenido autorizado, sin flush ruleset/tablas Docker/defaults/sysctl/SSH o red nueva. Las cinco tablas preexistentes permanecen iguales excepto contadores; única tabla añadida inet qrih_aud018_bridge_guard con dos cadenas/dos reglas.

| Prueba final realizada, sólo LOCAL | Resultado / límite |
|---|---|
| Gateway22 | Accesible desde seis antes de aplicar; bloqueado desde los seis después. Regla INPUT acumula46 paquetes descartados durante lote. No login/clave/sesión SSH/túnel desde contenedor. |
| Otros puertos gateway | TCP53/80/443/2375/3128/8080 bloqueados desde cada uno de los seis. Sólo probes fijos sin payload; no scan masivo ni prueba de cada otra IP local VM. |
| Rutas/DNS público | Seis sin default IPv4/IPv6/ruta a públicos fijos, DNS example.com por Docker bloqueado y TCP1.1.1.1:443 bloqueado; DNS directo UDP/gateway desde DB bloqueados. DNS interno db positivo en seis. No ruta artificial ni secreto/PII en queries. |
| Comunicación interna | DB→Auth/REST/Storage/Mailpit:4HTTP200; Kong→Auth/REST/Storage:3HTTP200; Kong/Auth/REST/Storage→DB5432:4TCP positivos sin payload. Cinco healthchecks healthy/REST sin check configurado, comprobado por HTTP. No flujo Auth/login/Storage restaurado demostrado. |
| Administración y exposición | Nuevas llamadas rdctl/Docker exec/SQL local funcionan desde Mac; listener SSH original igual, sin desactivarlo. NetworkSettings hostports0 y lsof confirma sin escucha en55421/55422/55424. No nueva apertura/transporte browser/Next. |
| Invariantes/datos | Mismos IDs/PIDs/imágenes/volúmenes/alias/bindings solicitados/redes; interna exclusiva y anterior vacía. SQL READ ONLY/ROLLBACK antes/después: Authusers0/identities0/buckets0/objects0/publictables0, properties/qrih_private ausentes. Sin Env/claves/filas/logs completos leídos ni SQL remoto. |
| FORWARD / límites | Regla autorizada presente; contador0 porque no se forzó una ruta de salida. Pruebas negativas conservan rutas actuales, no certifican todos los protocolos/ARP/kernel/administrador host ni persistencia tras restart. Ambas familias declaradas; IPv6 deshabilitado/no ruta, no tráfico IPv6 real forzado. |

Recibo final `/Users/fabianlira/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an/work/aud018-tools-20261006.KqHlHu/bridge-guard-apply-pLWCP9/verification.json`600/directorio700, snapshot.json600 en el mismo destino. authorizedFirewallApplied=true/validationPass=true/unrelatedRulesetUnchanged=true. Propuesta SHA256 c1c28d66c3ac4f8a8f1330c09d0725a15f4833f0ab8f33db75c4223697427233; sin herramientas/snapshots/receipts/credenciales agregados al checkout. **No repetir --apply por documentación o para revalidar:** rechaza tabla existente; una verificación futura debe ser sólo lectura del estado ya instalado.

### Incidentes de herramientas y reversión efectivamente comprobada

Preflight inicial se detuvo sin mutación por campo Health inexistente en REST; consulta filtrada corregida con index/with, no añadir healthcheck ni leer Env/logs. Self-test del validador de tabla propia aceptó caso válido y rechazó puente incorrecto/regla extra/policy global modificada. Preflight corrected/check/vacío pasó antes de primera carga.

Primer lote bridge-guard-apply-BQE1ND aplicó el contenido autorizado y luego falló validación; retiró **únicamente la tabla recién creada y sus dos reglas**, sin borrar datos/volúmenes/reconectar red/reiniciar. Recibo failure.json guarda rollbackPass=true; el campo phase de ese primer recibo refleja último paso de rollback, no diagnostica por sí solo el fallo inicial (corregido en helper para futuros errores). Lectura independiente con inspect-bridge-guard-design.mjs corroboró ausencia de tabla propia, cinco tablas originales/digest bfe6193b4992f47bc4f87e5397bd76ca839bea795e8759a049dec41b964861e0 y membresía interna preservada.

Diagnóstico independiente: nc -n contra alias db falla por dirección/resolución; mismo probe contra IP verificada de DB pasa. nsenter --net conserva filesystem/resolver de VM, no el del contenedor. Helpers HTTP ahora usan --resolve sólo para IPs de metadata exacta y TCP IP numérica; DNS interno se comprueba aparte mediante127.0.0.11, sin editar /etc/hosts/resolv/configuración. Modo --network-probes sin tabla pasó7HTTP/4TCP antes de reaplicar idénticas reglas. Segunda carga/lote final PASS arriba. Este fallo de herramientas no se clasifica como pérdida de conectividad de app, vulnerabilidad ni motivo de cambio de arquitectura. Snapshots/recibos de ambos lotes conservados; reversión acotada es recuperable mediante reaplicación autorizada, no retirada de datos QRIH.

**Gate de gateway cerrado sólo en alcance probado; AUD-018 ALTO/EN REVISIÓN—NO CORREGIDO y NO-GO externo se conservan.** Sin exportación/importación/restauración/SQL remoto/SMTP/código/RLS/migración/deploy/compra. Guías Supabase/PostgreSQL orientaron separar preparación y restauración real, mínimo alcance y agregados locales READ ONLY/ROLLBACK. Siguiente: conexión SQL privada/destino cifrado/ventana/cuota contra tamaño/transporte local; autorización de captura sólo STAGING/restore aparte. Revalidar reglas/bridge/red/puertos/vacío tras restart/CLI y antes de importar. No persistencia/monitor/reaplicación automática ni protección frente a admin host prometidas;15casos reales siguen pendientes. [Carga atómica/control create de nft](https://netfilter.org/projects/nftables/manpage.html).

## Diseño previo — check antes de autorización/aplicación (histórico)

Este corte y la secuencia/matriz de diseño inferiores preceden al permiso de aplicación; el recibo y cuadro superiores gobiernan los resultados actuales. Las frases «no aplicado»/«autorización pendiente» de este archivo histórico no son instrucciones para repetirlo.

Usuario autorizó continuar con **diseño**, no aplicar reglas ni exportar. Lecturas sólo locales: listener22 de VM pertenece a sshd.pam (IPv4/IPv6), sin acceder a configuración/autenticación/claves SSH. `inspect-bridge-guard-design.mjs` fuera del checkout confirma redID01ed69b976c417a85de5100569b42f60eabdbbae0115aa1b517df6024cde0141/puente br-01ed69b976c4 real en kernel/gateway172.18.0.1, seis contenedores exclusivos internos/red anterior vacía/puertos host0/sin bind mounts ni privilegios extra. Namespaces de los seis distintos entre sí y del host. Sin consulta SQL nueva: conteos vacíos conservan la evidencia previa, no nuevos datos inspeccionados.

Herramientas instaladas: nftables1.1.6, iptables1.8.13(nf_tables), kernel6.18.37-0-virt. Hay cinco tablas existentes; la propuesta inet qrih_aud018_bridge_guard **no existe**. No migrar backend Docker a nftables: sería otro cambio de arquitectura y no es necesario para añadir una tabla separada al mecanismo ya disponible. Mantener Docker/iptables/NAT/DNS existentes. El changelog Supabase consultado distingue gateway Envoy de self-hosted Compose del stack CLI actual; no actualizar Kong/CLI/PG ni ejecutar detecciones/reindex remotos por este diseño.

### Opción mínima recomendada y alcance exacto

Crear **una tabla de filtrado independiente en el namespace de red de la VM**, con dos reglas que sólo coincidan con el puente dedicado. Es una modificación del firewall de la VM, aunque su alcance sea únicamente esta red; requiere aprobación expresa. No editar sshd ni el firewall del Mac, no cambiar política por defecto de tablas existentes, tablas Docker, FORWARD global, sysctl, puertos, membresía, imágenes, volúmenes o servicios ajenos.

```nft
table inet qrih_aud018_bridge_guard {
  chain deny_restore_to_vm {
    type filter hook input priority -10; policy accept;
    iifname "br-01ed69b976c4" counter drop comment "AUD018 restore bridge to VM denied"
  }
  chain deny_restore_other_networks {
    type filter hook forward priority -10; policy accept;
    iifname "br-01ed69b976c4" oifname != "br-01ed69b976c4" counter drop comment "AUD018 restore bridge egress denied"
  }
}
```

INPUT aborda tráfico destinado a servicios del host (incluido22/cualquier IP local de VM); una regla sólo en DOCKER-USER/FORWARD no cubre ese camino. La segunda regla añade bloqueo hacia interfaces ajenas, no sólo puertos conocidos. Familia inet cubre IPv4/IPv6; prioridad-10 precede al filtro habitual0 y no permite excepciones ESTABLISHED que conserven un acceso al gateway. Policy accept en estas cadenas significa no imponer nuevas denegaciones al resto; no anula un DROP existente. No ampliar a br-* ni dar permiso global para resolver errores. Estos son efectos **diseñados**, sujetos a pruebas después de aplicar. [Hooks Netfilter](https://wiki.nftables.org/wiki-nftables/index.php/Netfilter_hooks), [prioridad/veredictos](https://wiki.nftables.org/wiki-nftables/index.php/Configuring_chains), [Docker/iptables](https://docs.docker.com/engine/network/firewall-iptables/).

Alternativas descartadas para esta corrección mínima: desactivar SSH/moverlo globalmente (afecta administración), cambiar backend/recrear VM-red/instalar firewall (más alcance), sólo bloquear22 (otros listeners seguirían alcanzables), sólo OUTPUT dentro de seis contenedores (seis puntos de mantenimiento y cobertura limitada ante tráfico raw). Tabla propia limitada a puente evita modificar reglas administradas por Docker; no afirmar que impide todas las capacidades de un administrador VM/Mac, ataques de kernel o ARP entre pares controlados. [No editar reglas Docker](https://docs.docker.com/engine/network/packet-filtering-firewalls/), [límites de packet sockets](https://man7.org/linux/man-pages/man7/packet.7.html).

### Comprobación de diseño realizada — no implementación

Archivo fuera de Git `bridge-guard-20261007.proposed.nft`; SHA256 c1c28d66c3ac4f8a8f1330c09d0725a15f4833f0ab8f33db75c4223697427233. `node --check` de ambos helpers PASS. `check-bridge-guard-proposal.mjs` sólo permite **nft --check --file /dev/stdin**, sin modo apply/rollback: whitelist exacta del texto/bridge, comparación antes/después. Resultado PASS; tabla propuesta continúa ausente, ruleset normalizado sin cambios (digest bfe6193b4992f47bc4f87e5397bd76ca839bea795e8759a049dec41b964861e0) y membresía igual. Recibo privado600 `bridge-guard-design-check-20261007.json` en carpeta de herramientas. No repetirlo ni sobreescribir recibo por actualizar documentos. --check comprueba validez sin aplicar, no demuestra bloqueo ni compatibilidad real. [Carga atómica nft](https://wiki.nftables.org/wiki-nftables/index.php/Atomic_rule_replacement).

### Secuencia posterior propuesta — requiere autorización de aplicación

1. Preflight local: mismo socket/redID/bridge/interfaces y seis IDs/alias/volúmenes, interna exclusiva/puertos host0, sin bind mounts/privilegios extra; tabla propia ausente y nuevas consultas SQL READ ONLY/ROLLBACK confirman vacío. Guard rechaza desviaciones, sin corregirlas automáticamente.
2. Guardar fuera de Git snapshot privado de metadata/ruleset normalizado/control administrativo, sin Env/keys/logs SSH/filas. Revisar archivo exacto y --check antes de aplicar. No usar flush ruleset ni importar una copia global como rollback.
3. Aplicar únicamente tabla propia en un lote atómico. La transacción es atómica para estas reglas, no convierte el backup/Storage en un snapshot atómico ni cierra recuperación. No persistir en boot/servicios ni programar reaplicación.
4. Ejecutar lote inferior. Si falla, detener ensayo/revertir sólo tabla propia creada tras verificar propiedad/contenido exacto; no borrar tablas preexistentes, reiniciar VM ni reconectar red externa como atajo. Capturar fallo sin secretos y volver a documentar, sin datos reales.
5. Si pasa, cerrar sólo esta frontera de red en alcance probado. Revalidar después de restart/acción CLI y antes de importación, pues bridge/red/reglas pueden cambiar o desaparecer. Acceso administrativo Docker exec sigue necesario; no es aislamiento frente a administrador host.

La reversión propuesta retira exclusivamente inet qrih_aud018_bridge_guard, creada por este lote y verificada contra snapshot; preserva las cinco tablas anteriores y membresía interna. Volvería a permitir el gateway, no Internet por una reconexión. Autorización debe cubrir aplicación y esta reversión por fallo; no supone permiso de exportación/restauración. Sin tabla aplicada ahora, **no hay rollback que ejecutar**.

### Matriz posterior a aplicación — todos pendientes

| Caso | Resultado esperado / evidencia |
|---|---|
| Tabla y alcance | Sólo tabla propia con dos cadenas/dos reglas; cinco anteriores iguales salvo contadores, bridge exacto, sin defaults/backend/servicios modificados. |
| Seis → gateway22 | TCP sin login falla desde los seis; contador de regla INPUT aumenta. No basta un timeout sin contador/prueba válida. |
| Seis → otros servicios VM | Probes fijos gateway53/80/443/2375/3128/8080 y demás IP locales necesarias no accesibles; sin scan masivo, login ni payload de datos. |
| IPv4/IPv6/DNS externos | Sin default/rutas públicas; DNS externo vía Docker/directo/gateway y TCP443 fijos fallan, igual que verificación previa; no simular una ruta nueva para forzar pruebas. |
| Comunicación interna | DNS db positivo desde los seis, healthchecks esperados y Auth/REST/Storage/Mailpit200; Kong→Auth/REST/Storage y servicios→BD no bloqueados según checks acotados sin credenciales impresas. |
| Administración desde Mac | Nueva llamada rdctl y Docker exec funcionan; listener SSH conservado, sin cambiar configuración/autenticarse desde contenedor. |
| Sin impacto en otras redes | Metadata/ruleset previo y conexiones de administración conservados; reglas sólo iifname exacto. No abrir ni operar UniFi/DaVinci para probarlos. |
| Volúmenes/datos/puertos | Mismos IDs/imágenes/volúmenes/alias, interna exclusiva/anterior vacía, hostports0; SQL local READ ONLY vacío, ningún remoteSQL/import/SMTP/deploy. |
| Falla/reversión | Sólo tabla propia retirada cuando el contenido coincide; administración/red/volúmenes preservados, ensayo detenido. No inducir corte ni rollback destructivo sólo para demostrarlo. |
| Reinicio/acceso a app recuperada | No reiniciar por este permiso ni asumir persistencia. Antes de restore revalidar; acceso browser/Next al destino interno aún requiere diseño separado de transporte local acotado, sin abrir salida ni reutilizar STAGING/secretos productivos. |

**AUD-018 permanece ALTO / EN REVISIÓN — NO CORREGIDO; NO-GO externo intacto.** Esta matriz de red no sustituye los15casos de restauración real. Guía Supabase orientó separar comandos válidos/preparación de recuperación completa/Auth/Storage/configuración; ningún schema/RLS/migración/app/dato/SMTP modificado. Siguiente decisión: autorizar únicamente la tabla descrita y reversión por fallo, no exportar. Captura cifrada sólo STAGING/conexión/ventana/cuota y restore necesitan permisos separados.

## Reconexión previa — corte anterior al guard de gateway aplicado

El usuario autorizó explícitamente reconectar sólo los seis contenedores vacíos a la red interna existente, conservar red anterior/volúmenes/alias y verificar el resultado. **Ejecutado, sin exportación ni importación.** No se recrearon/reiniciaron contenedores ni eliminaron redes/volúmenes. Socket exclusivo Rancher unix:///Users/fabianlira/.rd/docker.sock; ningún runtime ajeno, UniFi/DaVinci, producción, Netlify o Supabase remoto modificado.

Herramientas locales fuera del checkout: `/Users/fabianlira/Documents/Codex/2026-10-03/referenced-chatgpt-conversation-this-is-an/work/aud018-tools-20261006.KqHlHu`. `reconnect-empty-internal.mjs` validó lista exacta, IDs/redes/bindings/volúmenes, destino vacío por SQL READ ONLY/ROLLBACK y guardó snapshot privado antes de cambiar conexiones. Conectó los seis con sus alias a la red interna y después desconectó la anterior. Se verificaron IDs de ambas redes, IDs/imágenes/volúmenes/bindings solicitados de contenedores, alias y membresía. Rechazo inicial de preflight por HostIp solicitado vacío no produjo mutación; se distinguió de IP efectiva loopback, sin alterar configuración. Cambio de conectividad breve sólo con destino vacío.

| Comprobación actual, 2026-10-07 | Resultado / límite |
|---|---|
| Contenedores exactos | supabase_{db,kong,auth,rest,inbucket,storage}_qrih-aud018-empty-20261006. Seis Running; cinco healthchecks healthy, REST sin check configurado. Sin bind mounts/privileged/capacidades extra/host network. Ningún Studio/Realtime/Edge/pooler añadido. |
| Red efectiva | qrih-aud018-empty-20261006, internal=true/IPv6=false/seis miembros exclusivos/subnet172.18.0.0/16/gateway172.18.0.1. Red anterior qrih-aud018-loopback-20261006 conservada con cero miembros; ambas IDs coinciden con snapshot. No red nueva ni cambio de red global. |
| Rutas en los seis namespaces | Lectura IPv4/IPv6 exit0, sin default route; sin ruta a1.1.1.1 ni2606:4700:4700::1111. IPv6 deshabilitado en la red, no prueba universal de todas las rutas/protocolos futuros. |
| DNS/TCP en los seis namespaces | DNS interno db mediante127.0.0.11 funciona. Consulta fija example.com por DNS Docker y conexión TCP sin payload1.1.1.1:443 no disponibles. Utilidades/ejecución comprobadas, errores resumidos sin datos privados. No payload de usuario/ref de proyecto en probes. |
| DNS UDP directo/gateway desde DB | example.com contra1.1.1.1 y172.18.0.1 no resuelve; pruebas acotadas, sin consultas de otros dominios ni acceso a datos reales. |
| Frontera host VM desde DB | TCP22 de172.18.0.1 accesible; TCP53/80/443/2375/3128/8080 no accesible en probes válidos. No login, credenciales, sesión SSH ni túnel intentados. **No es una prueba de escape/exfiltración ni vulnerabilidad QRIH; SSH/auth/firewall no auditados.** Resolver esta frontera antes de importar datos sensibles, sin modificar servicios globales por inferencia. |
| Operación interna | Docker exec desde DB: Authhealth9999/RESTroot3000/Storagestatus5000/Mailpitroot8025 responden HTTP200. Sólo salud/ruta raíz, no prueba funcional autenticada de restauración. |
| Datos vacíos antes/después | SQL local BEGIN READ ONLY/ROLLBACK: Authusers0/identities0/buckets0/objects0/publictables0, properties y qrih_private ausentes. No baseline/migración/dato QRIH importado. No SQL remoto ni credencial de exportación utilizada. |
| Puertos al Mac | NetworkSettings.Ports: **cero bindings publicados al host** tras conexión interna. HostConfig.PortBindings original conservado no significa escucha efectiva. Los antiguoslocalhost55421/55422/55424 no son acceso vigente; utilizar Docker exec/red interna. QRIHlocalhost3000/3107 contra STAGING remoto no cambia. No abrir otra red/proxy para recuperar puertos sin diseño/autorización. |
| Reinicio/CLI | HostConfig.NetworkMode aún referencia red anterior, sin reinicio realizado. No afirmar que conexiones persisten tras restart/acción CLI. Revalidar membresía/egress/puertos/vacío inmediatamente antes de una futura importación. No ejecutar start-empty.mjs (elige red anterior) ni repetir start/bootstrap CLI interno que falló. |
| VM/clave | Evidencia anterior: siete montajes/home compartido; /Users/Shared/QRIH_Backup_Keys fuera. Sin lectura de identidad privada ni nuevos montajes. Red interna no elimina acceso de administradores del Mac/VM ni configura una VM sin home compartido. |
| Drive/cuota | Lectura previa:11,24 de15 GB usados (~3,76 GB libres redondeados), cuenta conector concordante/carpeta privada. No reconsultada ni modificada por la reconexión. Tamaño del paquete/retención pendiente; no garantía de cuota suficiente. |

Verificador `verify-isolated-empty.mjs`: diagnósticos con Docker exec y rdctl/nsenter sólo en namespaces de red exactos, sin instalar paquetes ni contenedores privilegiados. `node --check` y ejecución PASS; reporte `network-move-MZ4n6t/verification.json`600 fuera de Git confirma packetScopePass=true/internalServicePass=true, seis internos/red anterior vacía/SQL vacío/puertos host0. Las pruebas son finitas; **la salida directa examinada queda bloqueada, pero no se certifica aislamiento universal ni el caso completo de recuperación**. El gateway conserva comunicación con el host en una red Docker interna por diseño. [Red interna Docker y excepción del gateway](https://docs.docker.com/reference/cli/docker/network/create/), [DNS Docker](https://docs.docker.com/engine/network/).

### Reversión preservada, no ejecutada

Snapshot `network-move-MZ4n6t/snapshot.json`600/directorio700 en la carpeta de herramientas: sólo metadata filtrada (IDs, alias, redes/IP previas, volúmenes/bindings), sin Env/credenciales/datos QRIH. Helper admite `--rollback` con esa ruta exacta, verifica whitelist/vacío y reconecta alias/IP anteriores antes de desconectar la interna; no borra/recrea/reinicia. Rollback automático estaba previsto para fallo durante cambio; no fue necesario ni se probó revertir un cambio exitoso. **No ejecutar reversión sin decisión explícita:** restituiría la red anterior con DNS externo disponible; es recuperación operativa, no corrección de privacidad. Con datos importados el guard de vacío lo rechazaría: no forzarlo.

Próximo paso: aplicar/verificar la propuesta superior sólo después de autorización exacta de tabla/reversión; diseño de acceso necesario al ensayo sin exponer puertos por inferencia. Después cuota contra tamaño/conexión SQL privada/destino/ventana y permiso específico de captura cifrada sólo STAGING. **AUD-018 ALTO/EN REVISIÓN—NO CORREGIDO y NO-GO intactos;15casos reales pendientes.** Las guías Supabase/PostgreSQL orientaron mínimo alcance y consulta local sólo lectura; no se cambiaron grants/RLS/configuración ni imágenes/CLI por novedades del changelog.

Control de entrega documental: SDK oficial Netlify sólo GET revalida stop_builds=true, sitio/cuenta/repo/develop/allowed_branches/private_logs esperados, Free/recargas-overages off y publicado f67fa46 intacto. Sin deploy solicitado ni mutación de Netlify. Versionar sólo cinco documentos en docs/aud-018-recovery-preparation; no incluir herramientas/snapshot/receipt/credenciales ni integrar main/develop por esta entrega.

### Diagnóstico previo que motivó la reconexión — histórico

Antes de esta autorización, qrih-aud018-loopback-20261006 era la única red de los seis, internal=false/masquerade=false, default route IPv4 y DNS Docker. DB resolvía example.com (no en hosts): gate entonces NO APROBADO pese al TCP443 negativo inicial. qrih-aud018-empty-20261006 ya existía vacía/internal=true. `inspect-empty-isolation.mjs` documentó ese estado; no es comprobación del estado actual porque apunta a la red anterior. No repetir el probe histórico ni interpretar los apartados inferiores de bootstrap/loopback como estado vigente.

## Custodia vigente — guardado y recuperación ficticia PASS reportados

Usuario respondió «listo» después de preparar Bitwarden Free: disponibilidad por reporte, no verificación de su cuenta/2FA/recuperación ni acceso a bóveda por el agente. Se preparó una clave age nueva **exclusivamente para respaldos de STAGING**, sin exportación ni permiso de captura/upload real. No reutilizar identidad del fixture Drive ni extender el alcance a original/producción.

Destino clave: /Users/Shared/QRIH_Backup_Keys/staging-20261007.agekey, directorio700/archivo600/propietario actual/sin ACL adicional reportada por ls. Directorio nuevo, sin symlink/reutilización/sobrescritura; valores de clave nunca impresos. Está fuera de Git, Documents/Drive y, según siete montajes efectivos consultados de Rancher, fuera de las carpetas expuestas a esa VM. No afirmar aislamiento permanente si cambian los montajes ni acceso imposible para administradores del Mac.

age1.3.2/ayuda comprobada: keygen -o privado; -y produce staging-20261007.recipient.txt sólo público; distinto del recipient ficticio anterior. Cifrado con recipient nuevo/descifrado con identidad nueva de contenido fijo ficticio PASS. Helper prepare-staging-key.mjs/fixture fuera del checkout; no ejecutar otra vez ni regenerar esta identidad como atajo. Clave/recipient no subidos a Drive/Bitwarden por el agente, sin cuenta/suscripción/credenciales remotas/correo/SQL/exportación/restore nuevos.

**Resultado personal reportado — 2026-10-07:** el usuario confirmó «clave guardada» en la nota segura «QRIH — STAGING — Clave de respaldos 2026-10-07» y luego «PASS» tras la prueba con copia recuperada desde Bitwarden. No mostró clave, contraseña, código ni captura. El agente no accedió a bóveda/portapapeles real ni observó esa ejecución; guardar como evidencia reportada, no auditoría del gestor/2FA/clave maestra/código de recuperación. No borrar la identidad original ni regenerarla, ni subirla a Drive/Git/chat.

Verificador local fuera del checkout: work/aud018-tools-20261006.KqHlHu/verify-recovered-staging-key.mjs. Entrada por pipe local del portapapeles (usuario), límite1024bytes/una identidad; age-keygen -y por stdin compara recipient con staging-20261007.recipient.txt público y age --decrypt -i - descifra únicamente new-key-synthetic-i6gAHz/synthetic.age contra contenido fijo ficticio. No lee staging-20261007.agekey original ni escribe la entrada a archivo, ni pasa secretos en argumentos/entorno ni imprime stderr/valores. Buffer borrado best-effort, no garantía de borrado completo de memoria/historial de portapapeles. Salida genérica PASS/NO VERIFICADO; ningún recibo sensible guardado.

Ayuda age1.3.2 consultada; node --check y self-test PASS comprobados por agente sólo con identidad ficticia anterior: caso válido y tres rechazos (vacío/recipient de otra clave/ciphertext truncado). Self-test no leyó portapapeles ni identidad staging original. El PASS real comunicado por usuario significa que el verificador aceptó recipient/descifrado de la copia suministrada; su procedencia Bitwarden depende del reporte. No repetir esta prueba por actualizar documentos ni confundirla con restauración de datos.

Guía Supabase mantuvo separación de preparación de claves/custodia/exportación sensible y verificación sin datos reales. Sigue pendiente acreditar aislamiento de salida del restore/cuota Drive/conexión SQL privada/autorización específica de captura staging/15casos reales. **NO-GO y AUD-018 abiertos**; los párrafos inferiores sin clave generada describen el corte anterior, no el estado actual de esta preparación.

## Segunda copia preparada — Google Drive / prueba ficticia PASS

Usuario eligió Drive, instaló la integración y posteriormente autorizó crear QRIH Backups/prueba cifrada ficticia. Búsqueda metadata exacta repetida antes de crear:0 carpetas propias/no trashed con ese nombre, sin explorar documentos ajenos. Carpeta creada en My Drive/root y readback confirmado: [QRIH Backups](https://drive.google.com/drive/folders/1r_wDsqI2qRVDvSOaxqCqYN9FL-IFgdzq). Metadata carpeta shared=false y único permiso reportado user/owner, sin anyone/domain; no compartir ni cambiar permisos.

Único archivo subido: [AUD018_TEST_ONLY.age](https://drive.google.com/file/d/1VECYj8sG5Q273_AE1qq-cTEVqatMIaD9/view?usp=drivesdk), application/octet-stream/253bytes; parent exacto carpeta anterior, shared=false/único owner según readback. Antes de upload, descifrado local corroboró contenido fijo «SYNTHETIC ONLY», sin QRIH/credenciales; sólo ciphertext, nunca identidad/archivo plano. Download raw/include_base64=false devolvió referencia autenticada; bytes materializados en destino local nuevo600/fuera de Git y comparados uno a uno con origen. SHA256 f0985d55010ac978e57924b302d6ebc8ed73dcf48a6cc10f1e59a999ad5f37ab coincidente y descifrado age con identidad ficticia local PASS. La identidad no salió del equipo ni sirve para backup real. Referencias temporales de descarga no se guardan en documentación/código/Git ni se reutilizan como enlaces de respaldo.

Carpeta/fixture se conservan: no borrados, ninguna copia real de staging/Auth/Storage/exportación SQL creada o subida. Transferencia/rescate de253bytes ficticios no prueba cuota para backup completo, gran volumen, fiabilidad futura ni15casos de recuperación. Para datos reales: confirmar espacio disponible sin pagos, custodia de clave real recuperable/separada, aislamiento restore y autorización específica de captura/subida staging; después ejecutar matriz íntegra. Paquete y manifest/PII/rutas cifrados, nombres genéricos; nunca SQL/ZIP/JSON/fotos en claro o identidad junto al paquete. ALTO/EN REVISIÓN—NO CORREGIDO/NO-GO conservados. Guía Drive aplicada a búsqueda acotada, verificación de permisos/parent/MIME, raw-file sin conversión y readback antes de entregar enlace; sin Docs/Sheets/Slides o nuevos módulos de producto.

## Resultado anterior — bootstrap del entorno vacío (reconexión superior gobierna)

Después de que el usuario abrió Rancher y reportó «There are no containers to show», rdctl fuera del sandbox corroboró VM1.24.0 operativa/Docker29.5.3. La lectura dentro del sandbox devolvió Broken: no era evidencia de VM averiada. Primer arranque dejó Kubernetes/telemetría/updater activados y PATH rcfiles; set autorizado corrigió esos cuatro ajustes. Lectura posterior: Moby/Kubernetes=false/admin=false/autostart=false/PATHmanual/telemetría=false/updater=false, RAM4GiB/CPU2. Contenedores Kubernetes iniciales detenidos conservados, sin borrar datos ajenos ni reset.

Primer intento CLI con red --internal: PostgreSQL17.11.0.002 inició, pero bootstrap falló ECONNREFUSED localhost55422; Docker no mostraba puerto publicado. CLI retiró sus contenedores nuevos durante rollback; no había datos QRIH. No repetir ese diseño como receta probada. Segundo intento con **otra red nueva** qrih-aud018-loopback-20261006, host_binding_ipv4=127.0.0.1/enable_ip_masquerade=false, arrancó exit0. No modificar redes preexistentes/UniFi/DaVinci ni atribuir el fallo al código QRIH.

| Comprobación ejecutada únicamente LOCAL | Resultado / límite |
|---|---|
| Servicios | Seis activos: db/kong/auth/rest/storage/mailpit (nombre CLI inbucket). Cinco healthchecks existentes healthy; REST comprobado por HTTP. Ningún Studio/Realtime/Edge/logs/pooler añadido. |
| Versiones | Imagen postgres17.11.0.002; SQL server_version17.11 y pg_dump17.11. Coincide con versión staging registrada; no prueba equivalencia de extensiones/Auth ni restauración. |
| Vacío por SQL READ ONLY/ROLLBACK | Auth0/identidades0/buckets0/objetos0/tablas public0; properties y qrih_private inexistentes. Ningún baseline/migración/dato QRIH importado, ni cuenta/correo remoto creado. |
| Red y exposición | Los seis en una única red dedicada; todos los bindings publicados loopback. lsof real: sólo127.0.0.1 en55421 API/55422 PG/55424 Mailpit. Sin escucha LAN de esos tres puertos. |
| Montajes/privilegios | Cero bind mounts en los seis contenedores y cero privileged. Home/Volumes siguen montados por defecto en la VM Rancher: no equivale a una VM sin acceso al equipo ni permite introducir allí secretos por inferencia. |
| Status/HTTP | CLI status PASS sin imprimir claves; Auth health/REST schema/Storage status/Mailpit UI:4 respuestas200. Sólo localhost; no alto/login/email/upload/consulta de datos remoto. |
| Salida de red | NAT deshabilitado en esa red; intento TCP sin payload a1.1.1.1:443 desde DB no estableció conexión y terminó143 con timeout5s. **No demuestra bloqueo universal/DNS/gateway/otras rutas o protocolos.** Aislamiento de salida estricto sigue gate antes de importar datos reales/hooks. |
| Secretos | Entorno de start filtrado, sin .env/link/caches del proyecto original o staging; claves generadas sólo locales, salida capturada en logs privados600 fuera del checkout. Ninguna clave real de backup creada; fixture age anterior no se reutiliza. |

Helpers de arranque/diagnóstico fuera del repo, en work/aud018-tools-20261006.KqHlHu; intentos empty-start-MDBlhD (fallido) y empty-start-ATr1p2 (PASS), logs privados/no adjuntar íntegros a Git/chat. Sin exportación/restore/SQL remoto/app code/dependencias/deploy. Servicios vacíos quedan arrancados, autostart=false; no eliminación de redes/volúmenes ni apagado de otros servicios. Documentación Supabase/PostgreSQL orientó consultas de lectura, aislamiento y separación entre esquema vacío y datos restaurados. **AUD-018 permanece abierto y sus15casos de recuperación real pendientes.**

## Preparación inicial comprobada posterior a AUD-036 — histórica

Rama docs/aud-018-recovery-preparation sobre ac26f64; sin integrar develop/main ni deploy. AUD-034/036 y callbacks locales conservan evidencia previa; no reejecutar flujos manuales por esta preparación. El usuario autorizó expresamente instalar Rancher Desktop/age y preparar un entorno local vacío, **no exportar datos**. Ningún dump/descarga Storage/restore/SQL remoto.

| Prerrequisito | Verificación actual / decisión |
|---|---|
| Equipo | Proceso x86_64, macOS13.7.8, 199GiB disponibles en volumen examinado; memoria≥8GiB/virtualización VMX corroboradas fuera del sandbox. Checks de hardware dentro del sandbox no disponibles: no interpretar como hardware insuficiente. Espacio disponible no mide tamaño futuro del stack/backup. |
| CLI oficial existente | Wrapper npm Supabase2.119.0 responde --help, db dump --help y start --help al pasar SUPABASE_TELEMETRY_DISABLED=1 y DO_NOT_TRACK=1 sólo en esos procesos. No modificación de preferencias personales ni actualización instalada. Bloqueo previo de ayuda resuelto; ayuda no es dump ni prueba de conectividad SQL. Aviso2.120 no autoriza actualizar por sí mismo. |
| Flags dump comprobados | --dry-run, --data-only, --use-copy, --role-only, --file, --db-url, --linked, --local, --project-ref, --password, --schema, --exclude. No usar --linked en la raíz unlinked, --debug ni imprimir dry-run con secretos. Contraseña no se introducirá en argumentos/chat. Mecanismo exacto privado de conexión aún pendiente, sin reset de BD. |
| Runtime local | Rancher Desktop1.24.0 x86_64 instalado/notarizado; motor/socket verificados fuera del sandbox después del arranque personal. Docker29.5.3 y seis servicios vacíos operativos según resultado superior. DaVinci/UniFi no reutilizados ni modificados; pg_dump134 histórico sin operación de datos. |
| Native Supabase | Docs actuales: runtime native experimental sólo Linux y macOS Apple silicon14+, no macOS Intel. Equipo observado no cumple plataforma/OS; no activar experimental ni forzar descargas como atajo. CLI start instalada expone contenedores, sin nuevos flags inventados. |
| Configuración Rancher | Moby, Kubernetes/admin-access/auto-start/telemetría/updater=false, PATH manual/RAM4GiB/CPU2 corroborados por lectura posterior a set. Lanzamiento anterior exit0 no los había aplicado todos; primer arranque personal y revalidación necesarios. Sin aceptación de términos/contraseña por agente ni helpers privilegiados. |
| Cifrado preparado | age1.3.2 darwin-amd64 portátil oficial (BSD-3-Clause), SHA256 de release coincidente. --version/ayudas y roundtrip ficticio PASS; dos copias alterada/truncada rechazadas, identidad ficticia600. Ningún dato real ni clave de backup creada. Checksum no equivale a firma independiente: Sigsum no verificado. Sin cifrado casero/OpenSSLenc. Custodia de clave real pendiente. |
| Destino vacío operativo | work/aud018-tools-20261006.KqHlHu/recovery-empty en workspace del chat, fuera del checkout QRIH. CLI2.119.0/project_id=qrih-aud018-empty-20261006/carpeta700/config600. PG17.11; API55421/BD55422/correo local55424, seeds/migrations automáticos apagados, sin app SQL/link remoto/.env copiados. Auto-expose=false/sólo public, servicios innecesarios apagados. Auth sólo localhost3107; sin SMTP/OAuth/S3 heredados. Status4HTTP/SQL vacío/loopback corroborados; salida universal/restore siguen sin acreditarse. |
| Custodia | Destino local propuesto /Users/fabianlira/Documents/QRIH_Backups no creado/aprobado; carpeta700/archivos600 previstos. Drive: carpeta privada creada/readback y transferencia253bytes ficticios/bytes-hash-descifrado PASS. Cuota para respaldo real/clave recuperable separada/exportación staging pendientes. No compra ni backup real; dos carpetas del mismo disco no bastan. |

La guía Supabase permitió desbloquear ayuda con opt-out documentado y descartó native incompatible antes de instalar. [CLI/telemetría](https://supabase.com/docs/guides/local-development/cli/getting-started), [runtimes](https://supabase.com/docs/guides/local-development/docker-and-native-runtimes), [config local](https://supabase.com/docs/guides/local-development/cli/config), [Rancher requisitos](https://docs.rancherdesktop.io/getting-started/installation/), [Rancher licencia](https://github.com/rancher-sandbox/rancher-desktop/blob/main/LICENSE), [age oficial](https://github.com/FiloSottile/age).

### Herramientas verificadas y siguiente gate local

Release Rancher v1.24.0 ZIP x86_64: 687024335 bytes / SHA256 5c8ab7faa2fff2fb473a8e973d464c84b496d63d4339522102503b58de42a4a9. age v1.3.2 darwin-amd64: 19376787 bytes / SHA256 1d1e4bc66e1427edad7739ae7616157de0e79db8b6d2a1497d7d9925fb06a539. Fuentes oficiales [Rancher release](https://github.com/rancher-sandbox/rancher-desktop/releases/tag/v1.24.0) y [age release](https://github.com/FiloSottile/age/releases/tag/v1.3.2). Binarios/descargas/fixtures quedan fuera del checkout, sin paquetes/lockfile nuevos. La identidad synthetic-only NO es una clave de respaldo y no debe reutilizarse.

El bloqueo inicial de arranque quedó superado tras apertura personal; no inferir qué términos aceptó. No ejecutar otro runtime de UniFi ni reset como atajo.

Settings filtrados corroborados; Docker siempre con socket Rancher explícito, --network-id/--workdir exactos y sin credenciales de registries importadas. --internal fue probado/falló bootstrap; alternativa localhost/sin NAT operativa según resultado superior. Start/status capturados sin imprimir claves locales, sin --debug, ambiente sin secretos heredados. No repetir redes/arranque sólo por actualizar documentación.

La CLI2.119.0 publica puertos sin IP explícita en su implementación; el hostname de API no garantiza loopback. La red dedicada propone controlar binding/egress, pero debe comprobarse mediante inspect filtrado y sockets reales antes de importar cualquier dato; no declarar aislamiento sólo por config. [Fuente CLI fijada](https://github.com/supabase/cli/blob/v2.119.0/apps/cli/src/command-internal/db-bootstrap/docker-create-args.ts), [red bridge/binding oficiales](https://docs.docker.com/engine/network/drivers/bridge/). Rancher monta por defecto el home en su VM: no importar credenciales reales ni conceder a contenedores bind mounts del home; revisar montajes efectivos antes de datos reales. El objetivo es ensayo local, no nueva arquitectura productiva.

## Autorizaciones separadas antes de ejecutar

1. **Autorizado y completado:** herramientas/entorno vacío/Drive ficticio/clave PASS reportado, reconexión interna y tabla propia/dos reglas aplicadas y verificadas según recibo superior. Gateway22 bloqueado6/7HTTP200/4TCP/admin/SQL vacío, tablas previas intactas. Acceso actual Docker exec/interno, puertos host0. Revalidar tras restart/CLI; transporte browser/Next y captura/importación de datos reales requieren alcance/permisos separados.
2. Comprobar cuota Drive y definir destino/ventana coherente/conexión SQL privada; después solicitar exportación exclusivamente mcyxunymhuxyiwklyfpy (BD/Auth/identidades/archivos/configuración necesaria) a paquete cifrado fuera de Git. Clave separada ya guardada/recuperada según reporte. Credencial SQL sólo en archivo privado/almacén autorizado; nunca chat. Service_role del app no es contraseña SQL ni respaldo íntegro de Auth. No extraer keys/contraseñas de otro proveedor ni cambiar credenciales para facilitar el dump.
3. Mostrar destino exacto local/vacío y plan de importación antes de restaurar. Verificar schemas/privilegios/roles administrados/versiones/egress bloqueado, no reiniciar ni restaurar staging/original. Validar quince casos pendientes; una exportación cifrada sin restore no cierra AUD-018.

Conexión SQL privada/destino/ventana coherente/cuota contra tamaño/autorización de captura y restore pendientes. Aislamiento de red actual verificado en alcance acotado, no universal ni persistente acreditado; revalidar antes de datos. Custodia/recuperación ficticia reportadas, no datos reales respaldados. No GO por herramientas/clave/probes. Sin nuevo proyecto cloud/plan/deploy/migración/Storage/Auth ni gasto.

## Alcance y evidencia comprobada

El usuario autorizó revisar el respaldo y diseñar recuperación aislada mientras Netlify recupera cuota; posteriormente autorizó Rancher Desktop/age y un entorno local vacío. No autoriza aún exportar datos sensibles, crear proyectos cloud, restaurar servicios activos ni modificar original/main/producción. Primero ensayar con staging; posteriormente se necesitará un respaldo independiente del entorno elegido para el piloto. Un respaldo de staging no protege el original.

Lectura agregada de staging `mcyxunymhuxyiwklyfpy`, mediante transacción READ ONLY y ROLLBACK:

| Elemento | Corte comprobado | Limitación |
|---|---|---|
| PostgreSQL | 17.11; release del proyecto 17.11.0.002 | Elegir cliente PG 17 compatible y stack local compatible con Auth/Storage; no bajar automáticamente de versión. |
| Base | 12,990,131 bytes; 15 tablas public; qrih_private existe | Tamaño físico, no tamaño de dump ni prueba de integridad/restauración. |
| Auth / perfiles | 4 usuarios, 4 identidades, 3 perfiles | No leer hashes, tokens, correos ni datos personales en la conversación. No crear el perfil faltante: conteos distintos no demuestran un defecto. |
| Propiedades / fotos | 1 propiedad, 7 property_images, 7 qrih_verified_uploads | Conteos, no comparación íntegra del grafo. |
| Storage | 7 objetos; 803,872 bytes reportados; 0 tamaños desconocidos | Metadatos, no descarga ni hash nuevo de los bytes. |
| Buckets | property-images privado/WebP/20 MiB; profile-images público/WebP/5 MiB | Conservar configuración y privacidad; no convertir ambos en públicos para recuperar. |
| ACL / historial | 14 políticas Storage; 8 registros de migración | Revisar definiciones/grants, no sólo cantidades; historia remota no coincide necesariamente con timestamps locales. |
| Auth / cifrado | 0 triggers Auth no internos que llaman fuera de auth/storage; 0 secretos Vault | No prueba ausencia de toda personalización o cifrado. Vault vacío no permite descartar requisitos de claves de Auth/MFA sin inventario. |

Extensiones instaladas observadas: pg_stat_statements 1.11, pgcrypto 1.3, plpgsql 1.0, supabase_vault 0.3.1, uuid-ossp 1.1. Sin referencias a encrypt/decrypt/pgp_sym, Vault, ltree o btree_gist en app/components/lib/baseline/migraciones revisados. Se consultó el changelog y la advertencia PG 17.11 sobre índices/cifrados; no se ejecutó reindex, cambio de extensión o de claves. Compatibilidad real del destino sigue pendiente.

`baseline-2026-10-03.sql` declara expresamente que no contiene filas/Auth/objetos/configuración. La secuencia profiles_public_id_seq reconstruida empieza en 100001: para recuperar datos existentes hay que conservar y verificar sus contadores reales, no reutilizar ese inicio. Las suites previas baseline+044–050 son pruebas de reconstrucción/fixtures, **no restauración de un respaldo completo**; no se repitieron ni reclasificaron aquí. No se encontró un respaldo completo verificable en los artefactos examinados; no se afirma que el usuario carezca de copias en otro lugar.

## Paquete que debemos obtener, fuera de Git

| Pieza | Contenido obligatorio | Validación de cobertura |
|---|---|---|
| Estructura y permisos | Esquemas de aplicación public y qrih_private, enums, secuencias, constraints/FKs, índices, funciones, triggers, RLS, grants/default privileges y roles propios | Comparar catálogo normalizado de origen/destino; revisar excepciones SECURITY DEFINER y falta de EXECUTE a anon. No sobrescribir roles administrados del proveedor. |
| Datos de aplicación | Todas las tablas de aplicación, incluyendo contactos/autorizaciones, demandas/postulaciones, avisos/auditoría/settings, qrih_verified_uploads y qrih_rate_windows | Comparación local privada por PK/campos y conteos, huérfanos/duplicados y contadores; no limitarse a properties. |
| Auth | Usuarios con UUID originales, identidades, hashes necesarios para login y dependencias de Auth según versión | Son datos altamente sensibles. Exportar cifrado sin mostrarlos; una lista por Auth Admin API no respalda contraseñas/identidades completas. Inventariar MFA/campos cifrados y claves requeridas. Recuperación de sesiones/tokens es decisión de seguridad separada, no prometer sesiones anteriores válidas. |
| Storage | Todos los buckets, configuración, políticas, inventario paginado completo, rutas, propietarios/procedencia, MIME, tamaños y bytes | Archivo por bucket+ruta; SHA-256 de todos los bytes; manifest privado sin URLs firmadas. Incluir profile-images aunque este corte no tenga archivos allí. Detectar huérfanos sin borrarlos. |
| Historial | Esquema/filas supabase_migrations y correspondencia con baseline+044–050, incluyendo versión remota de 050 | Preservar historia real; no ejecutar 001–043 encima del baseline ni reaplicar 044–050 sobre un esquema ya actualizado. |
| Operación | Versión/SHA/lockfile, configuración Auth/redirects/SMTP, esquemas expuestos, buckets, variables necesarias de Netlify y configuración de despliegue | Separar inventario no secreto de valores sensibles. Guardar estos últimos sólo en almacén seguro/cifrado; no copiar credenciales revocadas ni reutilizar llaves productivas en el destino. |

Supabase recomienda exportación y copia externa para Free; el respaldo de base **no contiene los bytes de Storage**. [Backups oficiales](https://supabase.com/docs/guides/platform/backups).

El dump de esquema de la CLI excluye esquemas administrados; no asumir que un único schema.sql contiene las políticas Storage o Auth personalizadas. Verificar el contenido real de cada exportación, capturar personalizaciones aparte y preservar grants: los permisos predeterminados del destino podrían volver a abrir tablas al restaurar. [Referencia CLI](https://supabase.com/docs/reference/cli/supabase-db-dump).

## Secuencia propuesta — no ejecutada

1. **Destino local vacío/red/guard ya preparados y verificados.** PG17/seis servicios internos/hostports0/Docker exec, sin SMTP real/webhooks/original. Revalidar red/rutas/DNS/gateway/tabla/puertos/volúmenes/vacío tras restart/CLI y antes de importar; no reaplicar/abrir otra red por inferencia. Transporte browser/Next se diseña con alcance separado. No nuevo cloud/plan/Netlify/setup; PGlite/health/SQL vacío no acreditan recuperación completa de Auth/Storage.
2. **Autorizar origen, custodia y ventana.** Primera exportación exclusivamente staging; UUID del origen fijo y destino local distinto. Elegir carpeta privada fuera del checkout y segunda copia independiente ya disponible a $0. Una carpeta adicional en el mismo disco no es protección contra pérdida del equipo. Acordar ventana sin escrituras/cargas para un corte coherente de BD y archivos; un dump SQL y varias descargas no son un snapshot atómico conjunto. No activar mantenimiento ni suspender cuentas automáticamente.
3. **Exportar con errores filtrados.** Usar mecanismo oficial de dump validado para la versión instalada, exportación de roles propios/esquema/datos/historia y suplemento de personalizaciones administradas. Verificar explícitamente cobertura Auth y qrih_private. No presentar cadenas con contraseña, usar --debug ni volcar excepciones/headers. Credencial mediante almacén o archivo de conexión privado 600 sólo después de autorización; sin secretos en argumentos de comandos copiados al chat. No resetear la contraseña de BD para facilitar este diseño.
4. **Copiar archivos y sellar paquete.** Sólo lectura mediante API Storage autorizada, paginación completa y rutas originales; ningún upload/remove en origen. Comparar inventario antes/después, descargar todo, calcular tamaños/hashes y cifrar con formato autenticado mantenido. Validar descifrado y segunda copia. Hashes solos no son cifrado; ZIP con contraseña no se acepta automáticamente. Manifest/rutas/hashes de contenido sensibles permanecen cifrados, reporte público sólo agregados. Si cambia el origen durante captura, no declarar corte coherente.
5. **Restaurar sólo destino local vacío.** Rechazar cualquier host remoto, mismo origen/destino o destino con datos. Arrancar schemas administrados compatibles, evitar defaults permisivos y restaurar roles propios/esquema/ACL/datos/historia con fallo inmediato y transacciones donde corresponda. Si se deshabilitan triggers durante carga, sólo en la sesión aislada, reactivarlos y validar FKs/efectos faltantes después: triggers deshabilitados no comprueban integridad. No enviar correos ni ejecutar integraciones restauradas. No alterar roles del origen.
6. **Restaurar Storage por API, reconciliar procedencia.** Mantener property-images privado desde su creación y profile-images según configuración autorizada. No insertar/manipular storage.objects mediante SQL como sustituto de subir bytes. Conservar backup de metadatos para reconciliar, pero evitar importarlos ciegamente antes del upload: podrían simular existencia sin bytes o causar conflictos. Los registros de aplicación, UUID/rutas y qrih_verified_uploads deben seguir coincidiendo; un upload privilegiado puede dejar owner_id nulo y requiere comprobar el fallback de procedencia existente de 047. No regenerar rutas/UUID de usuarios ni persistir firmas.
7. **Ejecutar matriz y registrar recuperación.** Una ejecución por lote, evidencia local con errores sin PII/credenciales. Medir duración real y pérdida máxima entre copias; RTO/RPO se proponen después de medir, no prometer cifras sin ensayo. Conservar backup cifrado y destruir únicamente el destino desechable mediante aprobación/target exacto, nunca original/staging activo. Después del ensayo staging, preparar backup del entorno del piloto con autorización específica antes del corte.

La guía oficial distingue datos, personalizaciones administradas e historial; compatibilidad y cifrado del destino se revisan antes de importar. [Restauración CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore). [Recuperación en stack local/self-hosted](https://supabase.com/docs/guides/self-hosting/restore-from-platform). El stack local se propone sólo para ensayo, no como nueva arquitectura de producción.

## Matriz de aceptación de recuperación

Todos los casos siguientes están **PENDIENTES DE EJECUCIÓN**. Las pruebas de seguridad anteriores no equivalen a ejecución después del restore.

| Caso | Criterio de aprobación |
|---|---|
| Paquete cifrado/copia independiente | Descifrado correcto; tamper/copia truncada rechazados; claves separadas y ninguna PII/clave en Git/log público. |
| Coherencia temporal | Ventana e inventarios documentados; BD/archivos sin cambios incompatibles entre capturas. |
| Esquema completo | Tablas/enums/FKs/índices/secuencias/qrih_private/funciones/triggers e historial corresponden al origen elegido. |
| Datos y relaciones | PK/UUID y campos iguales en comparación privada; todas las tablas cubiertas; cero huérfanos o duplicados nuevos. |
| Secuencias | Próxima inserción sintética local no colisiona con datos recuperados; ningún INSERT de prueba remoto. |
| Auth | Cuentas/identidades/UUID y roles de negocio conservados; login local controlado de cuenta autorizada funciona sin leer su contraseña en el chat. No alta remota adicional. |
| Sesiones/cifrados/MFA | Política de sesiones documentada; datos cifrados utilizables si existen; no reutilizar JWT/SMTP/secretos originales para aprobar el ensayo. |
| ACL/RLS | Anon sin tablas privadas/RPC reservadas; propietario/solicitante/admin según reglas actuales; esquema privado no expuesto. Sin abrir grants para resolver errores. |
| Storage completo | Todos los objetos descargados/restaurados: bytes, SHA-256, MIME y rutas iguales; buckets/privacidad/límites iguales. |
| Procedencia de fotos | storage_path/main_image_path→objeto válido y owner/procedencia correctos; qrih_verified_uploads conservado; máximo 7 y portada en galería. |
| No publicación | draft/pending/rejected/paused/expired y cuenta suspendida sin acceso público según reglas vigentes; pending_update conforme lógica existente, no nueva regla. |
| URL pública antigua / firmas | En bucket privado la antigua URL pública falla; firma autorizada funciona/vence; no firma almacenada en BD. |
| App local recuperada | Inventario/ficha/galería/PDF/edición/notificaciones/contactos y postulación compatible funcionan con datos recuperados y sin abrir contactos privados. |
| Aislamiento / $0 | Origen sin escrituras, no correo real ni webhook, no acceso remoto desde restore, sin gasto/deploy/cambio de plan. |
| RTO/RPO y repetibilidad | Tiempo medido; responsable/frecuencia/retención/custodia acordados; segundo intento aislado reproducible sin usar servicios activos. |

## Prerrequisitos pendientes — diagnóstico inicial (supersedido por preparación superior)

- `pg_dump`, `psql` y `docker` no están en PATH; Docker.app no se encontró en /Applications. No demuestra ausencia en otras ubicaciones. No se instaló ni arrancó software.
- CLI instalada: wrapper de `--version`/ayudas falló intentando escribir telemetría fuera de permisos. El binario Go subyacente devuelve 2.119.0, pero su ayuda de db sólo lista diff; no valida el flujo completo db dump del wrapper. Se detuvieron esos intentos; ninguna exportación. Preparar CLI/estado local seguro o cliente PG nativo antes de capturar; no conceder acceso amplio a la carpeta personal como atajo.
- La conexión SQL completa, custodia cifrada, segunda copia y política de sesiones aún no están preparadas/verificadas. No extraer credenciales del proveedor ni pedirlas por conversación.
- Autorización siguiente requerida: preparar entorno local gratuito y exportar **únicamente staging**, cifrado/fuera de Git, para restaurar en el destino local nuevo. La aprobación de este diseño no se interpreta como permiso para exportar/restaurar original.

**Dictamen conservado: NO-GO externo. AUD-018 no se cierra por este documento, los conteos o el baseline.** AUD-031 sigue pendiente de entrega por cuota Netlify; este trabajo no consume publicaciones ni cambia esa condición.
