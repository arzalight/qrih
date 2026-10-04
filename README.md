# QRO INDUSTRIAL HUB — QRIH

## Estado vigente y entrega segura

Proyecto actual Next.js + Supabase, con funcionalidades congeladas y **NO-GO para Soft Launch**. Staging aislado: https://qrih-staging.netlify.app, Free. Estado: [PROJECT_STATUS.md](PROJECT_STATUS.md), hallazgos: [QRIH_AUDIT.md](QRIH_AUDIT.md), control Git: [docs/PRE_GITHUB_REVIEW.md](docs/PRE_GITHUB_REVIEW.md).

No ejecutar la migración inicial ni el historial completo sobre un proyecto existente. Staging usa el baseline verificado + 044–049, según [supabase/staging/README.md](supabase/staging/README.md). No hay migraciones automáticas en deploy. Credenciales reales nunca en Git; `.env.example` contiene sólo ejemplos. Para instalar: `npm ci`; pruebas locales: `npm run lint`, `npm run typecheck`, `npm test`. Despliegue Next: `netlify.toml`, no el prototipo estático.

El contenido inferior conserva el arranque histórico y el prototipo; **no es una instrucción de despliegue vigente**, ni autoriza nuevas funcionalidades. `main` queda reservado para producción después del GO; staging debe seguir `develop`.

## Next.js + Supabase (implementación actual)

El proyecto fue convertido a Next.js. Para ponerlo en funcionamiento con datos reales:

1. Cree un proyecto en Supabase.
2. En el SQL Editor ejecute [la migración inicial](supabase/migrations/001_qrih_schema.sql).
3. Copie `.env.example` como `.env.local` y agregue la URL y anon key del proyecto.
4. Active Email/Password en Supabase Auth y configure la URL de redirección de su dominio.
5. Ejecute `npm run dev` y visite `http://localhost:3000`.

Sin `.env.local`, las páginas públicas se muestran con inventario de demostración; los formularios explican que deben configurarse las credenciales. Las rutas de publicación, demanda y login ya contienen las llamadas a Supabase.

MVP navegable para el portal de inmuebles industriales de Querétaro.

## Ejecutar

Abra `index.html` en un navegador, o sirva esta carpeta con cualquier servidor estático. No requiere instalación ni compilación.

## Flujos incluidos

- Inicio, buscador, inventario y filtros por operación, zona y superficie.
- Fichas individuales con privacidad de dirección, comisión compartida, contacto, reporte y ficha imprimible/guardable como PDF.
- Formulario **Busco una bodega** que registra demanda.
- Publicación de propiedades con declaraciones obligatorias y estado `Pendiente`.
- Panel del asesor, niveles y estados de publicaciones.
- Panel de administración para aprobar/rechazar con motivo, gestionar destacadas y Pool Home.
- Persistencia del demo mediante `localStorage`, conservando cambios y registros entre recargas en el mismo navegador.

## Arquitectura propuesta para producción

La interfaz separa los modelos de dominio (`properties`, `demands`, `contacts`, `reports`, usuarios/planes) de sus vistas. Al conectarla a backend, estos objetos se convierten directamente en las entidades API/BD definidas para Fase 1: `Users`, `Roles`, `Plans`, `Properties`, `PropertyImages`, `PropertyFeatures`, `PropertyContacts`, `DemandRequests`, `Notifications`, `HomePool`, `FeaturedProperties` y `AuditLogs`.

Para producción, sustituir la capa `localStorage` de `app.js` por una API autenticada, almacenamiento de objetos para imágenes y un trabajo programado que procese las verificaciones de días 40/45/50. Esta separación permite incorporar matching, suscripciones, CRM y analítica sin cambiar la interfaz pública ni el modelo principal de propiedad.
