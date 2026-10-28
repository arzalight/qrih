import type { Metric } from '@/lib/admin-metrics'
export function AdminStatistics({ metrics }: { metrics: Metric[] }) {
  return <section aria-label="Estadísticas administrativas">
    <h2>Estadísticas principales</h2>
    <p>Métricas generales actualizadas aproximadamente cada 5 minutos; pendientes de revisión en cada actualización del panel. Ventanas móviles de 30 × 24 horas, con límites UTC compartidos por muestra. Conteos independientes de los filtros de la tabla.</p>
    {[metrics.slice(0, 6), metrics.slice(6)].map((group, i) => <section key={i} aria-label={i ? 'Indicadores secundarios' : 'Indicadores principales'}>
      {i === 1 && <h2>Operación y seguimiento</h2>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
        {group.map(metric => <article key={metric.key} style={{ padding: 20, border: '1px solid var(--line)', borderRadius: 16, background: 'var(--surface)', boxShadow: '0 4px 14px rgba(0,0,0,0.045)' }}>
          <div style={{ fontSize: metric.value == null ? 20 : 32, fontWeight: 750 }}>{metric.value == null ? (metric.key === 'visits' ? 'No configurado' : 'Sin datos') : metric.value.toLocaleString('es-MX')}</div>
          <h3 style={{ fontSize: 13 }}>{metric.label}</h3>
          {metric.previous !== undefined && <p style={{ fontSize: 12 }}>30 días anteriores: {metric.previous == null ? 'Sin datos' : metric.previous.toLocaleString('es-MX')}
            {metric.value != null && metric.previous != null && ` · Diferencia: ${metric.value - metric.previous > 0 ? '+' : ''}${metric.value - metric.previous}`}</p>}
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>{metric.note}</p>
        </article>)}
      </div>
    </section>)}
    <p>Sin datos verificables: requerimientos activos, vinculaciones efectivas, usuarios activos, tiempo de aprobación y conversión comercial. Clics de Google: Search Console no configurado en esta aplicación.</p>
  </section>
}
