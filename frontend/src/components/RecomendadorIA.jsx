import { useRef, useState } from 'react';
import { pedirRecomendaciones } from '../services/ia';
import { formatearMoneda } from '../utils/formato';

function nuevoIdSesion() {
  return globalThis.crypto?.randomUUID?.() ?? `sesion-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function Esqueleto() {
  return (
    <div className="stack" aria-hidden="true">
      <div className="skeleton" style={{ width: '90%' }} />
      <div className="skeleton" style={{ width: '75%' }} />
      <div className="skeleton" style={{ width: '82%' }} />
      <div className="skeleton" style={{ width: '60%', height: 48 }} />
    </div>
  );
}

/**
 * Envía el carrito al agente de IA de n8n y muestra la descripción comercial
 * y dos productos complementarios del catálogo real.
 * @param {{ lineas: {producto: import('../models/Producto').Producto, cantidad: number}[],
 *           onAgregar: (productoId: number) => void, contiene: (productoId: number) => boolean }} props
 */
export default function RecomendadorIA({ lineas, onAgregar, contiene }) {
  const sesionRef = useRef(nuevoIdSesion());
  const [estado, setEstado] = useState('inactivo'); // inactivo | cargando | listo | error
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [copiado, setCopiado] = useState(false);

  async function generar() {
    setEstado('cargando');
    setError(null);
    setCopiado(false);
    try {
      const data = await pedirRecomendaciones({
        sessionId: sesionRef.current,
        items: lineas.map(({ producto, cantidad }) => producto.aResumenIA(cantidad)),
      });
      setResultado(data);
      setEstado('listo');
    } catch (err) {
      setError(err);
      setEstado('error');
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resultado.descripcion_comercial);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="ai" aria-labelledby="titulo-ia">
      <div className="ai__inner">
        <div className="ai__header">
          <span className="ai__icon" aria-hidden="true">✦</span>
          <div style={{ flex: 1 }}>
            <h2 id="titulo-ia">Asistente comercial IA</h2>
            <p className="ai__subtitle">Un orquestador coordina a un agente redactor y a un agente recomendador.</p>
          </div>
        </div>

        <button type="button" className="btn btn--primary btn--block"
          disabled={lineas.length === 0 || estado === 'cargando'} onClick={generar}>
          {estado === 'cargando' ? 'El orquestador está coordinando a los agentes…' : resultado ? 'Generar de nuevo' : 'Generar recomendaciones'}
        </button>
        {lineas.length === 0 && <p className="ai__subtitle">Agrega al menos un producto al carrito.</p>}

        {estado === 'cargando' && <Esqueleto />}

        {estado === 'error' && (
          <div className="alert alert--danger" role="alert">
            <div className="alert__body"><div className="alert__title">El agente no respondió</div><p>{error.message}</p></div>
          </div>
        )}

        {estado === 'listo' && resultado && (
          <>
            <div className="ai__desc">
              <div className="ai__desc-head">
                <span>Descripción comercial</span>
                <button type="button" className="btn btn--sm btn--ghost" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
              </div>
              {resultado.descripcion_comercial}
            </div>

            <div className="ai__recs">
              <h3>También le puede interesar</h3>
              {resultado.recomendaciones.length === 0 && (
                <p className="ai__subtitle">El agente no encontró productos complementarios con stock.</p>
              )}
              {resultado.recomendaciones.map((rec) => (
                <article key={rec.producto_id} className="ai__rec">
                  <div className="ai__rec-top">
                    <strong>{rec.nombre}</strong>
                    <span>{formatearMoneda(rec.precio)}</span>
                  </div>
                  <p className="ai__rec-motivo">{rec.motivo}</p>
                  <button type="button" className="btn btn--sm" disabled={contiene(rec.producto_id)}
                    onClick={() => onAgregar(rec.producto_id)}>
                    {contiene(rec.producto_id) ? 'En el carrito' : '+ Agregar al carrito'}
                  </button>
                </article>
              ))}
            </div>
            <p className="ai__disclaimer">Contenido generado por un asistente automatizado. Revísalo antes de publicarlo.</p>
          </>
        )}
      </div>
    </section>
  );
}
