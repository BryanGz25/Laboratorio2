const TITULO_POR_STATUS = {
  0: 'Sin conexión',
  400: 'Datos inválidos',
  404: 'No encontrado',
  409: 'No se pudo completar la operación',
};

export function Loader({ texto = 'Cargando…' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" aria-hidden="true" />
      {texto}
    </div>
  );
}

/** Muestra el mensaje `{ error }` de la API con un título según el código HTTP. */
export function ErrorAlert({ error, titulo, onReintentar, onCerrar }) {
  if (!error) return null;
  const status = error.status;
  const tituloFinal = titulo ?? TITULO_POR_STATUS[status] ?? 'Ocurrió un error';
  const tono = status === 409 ? 'warning' : 'danger';

  return (
    <div className={`alert alert--${tono}`} role="alert">
      <div className="alert__body">
        <div className="alert__title">
          {tituloFinal}
          {status > 0 && <span className="card__hint"> · HTTP {status}</span>}
        </div>
        <p>{error.message}</p>
      </div>
      {onReintentar && <button type="button" className="btn btn--sm" onClick={onReintentar}>Reintentar</button>}
      {onCerrar && (
        <button type="button" className="btn btn--sm btn--ghost" onClick={onCerrar} aria-label="Cerrar aviso">✕</button>
      )}
    </div>
  );
}

export function Badge({ color = 'neutral', children }) {
  return <span className={`badge badge--${color}`}>{children}</span>;
}

export function Vacio({ children }) {
  return <div className="empty">{children}</div>;
}
