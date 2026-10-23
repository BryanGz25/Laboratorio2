import { Link } from 'react-router-dom';
import { ErrorAlert, Loader, Vacio } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { getResumen } from '../services/api';
import { formatearMoneda, pluralizar } from '../utils/formato';

function Kpi({ label, value, note }) {
  return (
    <div className="card">
      <div className="kpi__label">{label}</div>
      <div className="kpi__value">{value}</div>
      {note && <div className="kpi__note">{note}</div>}
    </div>
  );
}

function VentasPorCategoria({ categorias }) {
  if (categorias.length === 0) return <Vacio>Aún no hay ventas registradas.</Vacio>;
  const maximo = Math.max(...categorias.map((c) => c.total));
  return (
    <ul className="bars">
      {categorias.map((c) => (
        <li
          key={c.categoria}
          className="bar__row"
          title={`${c.categoria}: ${formatearMoneda(c.total)} · ${pluralizar(c.unidades, 'unidad', 'unidades')}`}
        >
          <span className="bar__label">{c.categoria}</span>
          <span className="bar__track" aria-hidden="true">
            <span className="bar__fill" style={{ width: `${(c.total / maximo) * 100}%`, display: 'block' }} />
          </span>
          <span className="bar__value">{formatearMoneda(c.total)}</span>
        </li>
      ))}
    </ul>
  );
}

function TopProductos({ productos }) {
  if (productos.length === 0) return <Vacio>Sin productos vendidos todavía.</Vacio>;
  return (
    <ol className="ranking">
      {productos.map((p, i) => (
        <li key={p.id}>
          <span className="ranking__pos">{i + 1}</span>
          <div className="ranking__info">
            <div>{p.nombre}</div>
            <div className="ranking__meta">{p.categoria}</div>
          </div>
          <strong>{pluralizar(p.cantidad_vendida, 'unidad', 'unidades')}</strong>
        </li>
      ))}
    </ol>
  );
}

export default function Dashboard() {
  const { data: resumen, loading, error, refetch } = useFetch(getResumen);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Métricas de órdenes pagadas, enviadas y entregadas.</p>
        </div>
        <Link to="/nueva-orden" className="btn btn--primary">+ Nueva orden</Link>
      </div>

      {error && <ErrorAlert error={error} onReintentar={refetch} />}
      {loading && !resumen && <Loader texto="Cargando métricas…" />}

      {resumen && (
        <div className="stack">
          <div className="grid grid--kpi">
            <Kpi label="Total de ventas" value={formatearMoneda(resumen.total_ventas)} note="Incluye descuentos y envío" />
            <Kpi label="Órdenes vendidas" value={resumen.ordenes_vendidas} note="Pagadas, enviadas o entregadas" />
            <Kpi label="Valor promedio por orden" value={formatearMoneda(resumen.valor_promedio_orden)} />
            <Kpi label="Categorías con ventas" value={resumen.ventas_por_categoria.length} />
          </div>

          <div className="grid grid--2">
            <section className="card" aria-labelledby="titulo-categorias">
              <div className="card__title">
                <h2 id="titulo-categorias">Ventas por categoría</h2>
                <span className="card__hint">Importe bruto de productos</span>
              </div>
              <VentasPorCategoria categorias={resumen.ventas_por_categoria} />
            </section>

            <section className="card" aria-labelledby="titulo-top">
              <div className="card__title">
                <h2 id="titulo-top">Top 3 productos</h2>
                <span className="card__hint">Por unidades vendidas</span>
              </div>
              <TopProductos productos={resumen.top_3_productos} />
            </section>
          </div>
        </div>
      )}
    </>
  );
}
