import { useMemo, useState } from 'react';
import { Badge, ErrorAlert, Loader, Vacio } from '../components/Feedback';
import { useFetch } from '../hooks/useFetch';
import { getProductos } from '../services/api';

const ORDENAMIENTOS = {
  'nombre-asc': { label: 'Nombre (A-Z)', comparar: (a, b) => a.nombre.localeCompare(b.nombre) },
  'precio-asc': { label: 'Precio: menor a mayor', comparar: (a, b) => a.precio - b.precio },
  'precio-desc': { label: 'Precio: mayor a menor', comparar: (a, b) => b.precio - a.precio },
  'stock-asc': { label: 'Stock: menor a mayor', comparar: (a, b) => a.stock - b.stock },
  'stock-desc': { label: 'Stock: mayor a menor', comparar: (a, b) => b.stock - a.stock },
};

function normalizar(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function ProductoCard({ producto }) {
  const { etiqueta, color } = producto.disponibilidad;
  return (
    <article className="card product">
      <div className="product__top">
        <span className="product__cat">{producto.categoria}</span>
        <Badge color={color}>{etiqueta}</Badge>
      </div>
      <h3>{producto.nombre}</h3>
      <p className="product__desc">{producto.descripcion || 'Sin descripción.'}</p>
      <div className="product__bottom">
        <span className="product__price">{producto.precioFormateado}</span>
        <span className="product__stock">{producto.stockFormateado}</span>
      </div>
    </article>
  );
}

export default function Productos() {
  const { data: productos, loading, error, refetch } = useFetch(getProductos);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [orden, setOrden] = useState('nombre-asc');

  const categorias = useMemo(
    () => [...new Set((productos ?? []).map((p) => p.categoria))].sort(),
    [productos],
  );

  const visibles = useMemo(() => {
    const termino = normalizar(busqueda.trim());
    return (productos ?? [])
      .filter((p) => !categoria || p.categoria === categoria)
      .filter((p) => !termino || normalizar(`${p.nombre} ${p.descripcion}`).includes(termino))
      .sort(ORDENAMIENTOS[orden].comparar);
  }, [productos, busqueda, categoria, orden]);

  const hayFiltros = busqueda || categoria;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Productos</h1>
          <p>Catálogo e inventario disponible.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="field field--grow">
          <label htmlFor="buscar">Buscar</label>
          <input id="buscar" className="input" type="search" placeholder="Nombre o descripción…"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="categoria">Categoría</label>
          <select id="categoria" className="select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="orden">Ordenar por</label>
          <select id="orden" className="select" value={orden} onChange={(e) => setOrden(e.target.value)}>
            {Object.entries(ORDENAMIENTOS).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
        </div>
        {hayFiltros && (
          <button type="button" className="btn btn--ghost" onClick={() => { setBusqueda(''); setCategoria(''); }}>
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <ErrorAlert error={error} onReintentar={refetch} />}
      {loading && !productos && <Loader texto="Cargando productos…" />}

      {productos && (
        <>
          <p className="card__hint" style={{ marginBottom: 'var(--space-3)' }} aria-live="polite">
            Mostrando {visibles.length} de {productos.length} productos
          </p>
          {visibles.length === 0
            ? <Vacio>Ningún producto coincide con los filtros.</Vacio>
            : <div className="grid grid--cards">{visibles.map((p) => <ProductoCard key={p.id} producto={p} />)}</div>}
        </>
      )}
    </>
  );
}
