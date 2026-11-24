import type { Metric } from '@/lib/admin-metrics'

function StatCard({ metric }: { metric: Metric }) {
  const unavailable = metric.value == null
  const highlightPending = metric.key === 'pending' && typeof metric.value === 'number' && metric.value > 0
  return (
    <article
      className={`admin-stat-card${unavailable ? ' admin-stat-card--muted' : ''}${highlightPending ? ' admin-stat-card--warning' : ''}`}
    >
      <div className="admin-stat-card__value">
        {unavailable
          ? (metric.key === 'visits' ? 'No configurado' : 'Sin datos')
          : metric.value!.toLocaleString('es-MX')}
      </div>
      <h3>{metric.label}</h3>
      {metric.previous !== undefined && !(unavailable && metric.previous == null) && (
        <p className="admin-stat-card__delta">
          30 días anteriores: {metric.previous == null ? 'Sin datos' : metric.previous.toLocaleString('es-MX')}
          {metric.value != null && metric.previous != null && ` · Diferencia: ${metric.value - metric.previous > 0 ? '+' : ''}${metric.value - metric.previous}`}
        </p>
      )}
    </article>
  )
}

export function AdminStatistics({ metrics }: { metrics: Metric[] }) {
  const primary = metrics.slice(0, 6)
  const secondary = metrics.slice(6)

  return (
    <section className="admin-stats" aria-label="Estadísticas administrativas">
      <div className="admin-stats__head">
        <h2>Estadísticas principales</h2>
      </div>

      <section aria-label="Indicadores principales">
        <div className="admin-stats__grid">
          {primary.map((metric) => (
            <StatCard key={metric.key} metric={metric} />
          ))}
        </div>
      </section>

      {secondary.length > 0 && (
        <details className="admin-stats__secondary">
          <summary>
            <span>Operación y seguimiento</span>
            <small>{secondary.length} indicadores adicionales</small>
          </summary>
          <section aria-label="Indicadores secundarios">
            <div className="admin-stats__grid admin-stats__grid--secondary">
              {secondary.map((metric) => (
                <StatCard key={metric.key} metric={metric} />
              ))}
            </div>
            <p className="admin-stats__footnote">
              Sin datos verificables: requerimientos activos, vinculaciones efectivas, usuarios activos, tiempo de aprobación y conversión comercial. Clics de Google: Search Console no configurado en esta aplicación.
            </p>
          </section>
        </details>
      )}
    </section>
  )
}
