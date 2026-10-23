import { Fragment, useState } from 'react';
import { Badge, ErrorAlert, Loader, Vacio } from '../components/Feedback';
import OrdenDetalle from '../components/OrdenDetalle';
import { useFetch } from '../hooks/useFetch';
import { ESTADOS_ORDEN } from '../models/Orden';
import { cambiarEstadoOrden, cancelarOrden, getOrdenes } from '../services/api';

const COLUMNAS = 7;

export default function Ordenes() {
  const [estado, setEstado] = useState('');
  const { data: ordenes, loading, error, refetch } = useFetch(
    (signal) => getOrdenes({ estado }, signal),
    [estado],
  );
  const [expandida, setExpandida] = useState(null);
  const [procesando, setProcesando] = useState(null);
  const [aviso, setAviso] = useState(null); // { tipo: 'success' | 'error', error?, mensaje? }

  async function ejecutar(orden, accion) {
    setProcesando(orden.id);
    setAviso(null);
    try {
      const actualizada = await accion();
      setAviso({ tipo: 'success', mensaje: `Orden #${actualizada.id} ahora está "${actualizada.estado}".` });
    } catch (err) {
      // 409: la orden cambió de estado (p. ej. ya fue enviada) y el servidor rechazó la cancelación.
      setAviso({ tipo: 'error', error: err, titulo: err.status === 409 ? `No se pudo actualizar la orden #${orden.id}` : undefined });
    } finally {
      setProcesando(null);
      refetch();
    }
  }

  function handleCancelar(orden) {
    if (!window.confirm(`¿Cancelar la orden #${orden.id}? El stock de sus productos se repondrá.`)) return;
    ejecutar(orden, () => cancelarOrden(orden.id));
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Órdenes</h1>
          <p>Gestiona el flujo nueva → pagada → enviada → entregada.</p>
        </div>
        <div className="field">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" className="select" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos</option>
            {ESTADOS_ORDEN.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div className="stack">
        {aviso?.tipo === 'success' && <div className="alert alert--success" role="status"><div className="alert__body">{aviso.mensaje}</div></div>}
        {aviso?.tipo === 'error' && <ErrorAlert error={aviso.error} titulo={aviso.titulo} onCerrar={() => setAviso(null)} />}
        {error && <ErrorAlert error={error} onReintentar={refetch} />}

        <section className="card">
          {loading && !ordenes && <Loader texto="Cargando órdenes…" />}
          {ordenes && ordenes.length === 0 && <Vacio>No hay órdenes {estado && `en estado "${estado}"`}.</Vacio>}
          {ordenes && ordenes.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>#</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Cupón</th>
                    <th className="num">Total</th><th className="num">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {ordenes.map((orden) => (
                    <Fragment key={orden.id}>
                      <tr>
                        <td>{orden.id}</td>
                        <td>{orden.clienteNombre}</td>
                        <td>{orden.fechaFormateada}</td>
                        <td><Badge color={orden.badgeColor}>{orden.estado}</Badge></td>
                        <td>{orden.cuponCodigo ?? '—'}</td>
                        <td className="num">{orden.totalFormateado}</td>
                        <td>
                          <div className="table__actions">
                            <button type="button" className="btn btn--sm btn--ghost"
                              aria-expanded={expandida === orden.id}
                              onClick={() => setExpandida(expandida === orden.id ? null : orden.id)}>
                              {expandida === orden.id ? 'Ocultar' : 'Detalle'}
                            </button>
                            {orden.siguienteEstado && (
                              <button type="button" className="btn btn--sm" disabled={procesando === orden.id}
                                onClick={() => ejecutar(orden, () => cambiarEstadoOrden(orden.id, orden.siguienteEstado))}>
                                Marcar {orden.siguienteEstado}
                              </button>
                            )}
                            {orden.estado !== 'cancelada' && (
                              <button type="button" className="btn btn--sm btn--danger"
                                disabled={!orden.esCancelable || procesando === orden.id}
                                title={orden.esCancelable ? 'Cancelar y reponer stock' : 'Solo se cancelan órdenes nuevas o pagadas'}
                                onClick={() => handleCancelar(orden)}>
                                Cancelar orden
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandida === orden.id && <OrdenDetalle ordenId={orden.id} columnas={COLUMNAS} />}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
