import { useState } from 'react';
import { Link } from 'react-router-dom';
import Carrito from '../components/Carrito';
import { ErrorAlert, Loader } from '../components/Feedback';
import RecomendadorIA from '../components/RecomendadorIA';
import { useCarrito } from '../hooks/useCarrito';
import { useFetch } from '../hooks/useFetch';
import { crearOrden, getClientes, getProductos } from '../services/api';
import { formatearMoneda } from '../utils/formato';

export default function NuevaOrden() {
  const clientes = useFetch(getClientes);
  const productos = useFetch(getProductos);
  const carrito = useCarrito();

  const [clienteId, setClienteId] = useState('');
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [cupon, setCupon] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  const [ordenCreada, setOrdenCreada] = useState(null);

  const catalogo = productos.data ?? [];
  const buscarProducto = (id) => catalogo.find((p) => p.id === Number(id));

  function agregarSeleccion(e) {
    e.preventDefault();
    const producto = buscarProducto(productoId);
    if (!producto || !Number.isInteger(cantidad) || cantidad < 1) return;
    carrito.agregar(producto, cantidad);
    setProductoId('');
    setCantidad(1);
  }

  function agregarRecomendado(id) {
    const producto = buscarProducto(id);
    if (producto) carrito.agregar(producto, 1);
  }

  async function procesarCompra(e) {
    e.preventDefault();
    setErrorEnvio(null);
    setOrdenCreada(null);
    setEnviando(true);
    try {
      const orden = await crearOrden({
        cliente_id: Number(clienteId),
        items: carrito.lineas.map((l) => ({ producto_id: l.producto.id, cantidad: l.cantidad })),
        ...(cupon.trim() && { cupon_codigo: cupon.trim() }),
      });
      setOrdenCreada(orden);
      carrito.vaciar();
      setCupon('');
      productos.refetch(); // el stock cambió
    } catch (err) {
      setErrorEnvio(err);
    } finally {
      setEnviando(false);
    }
  }

  const puedeEnviar = clienteId && carrito.lineas.length > 0 && !enviando;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Nueva orden</h1>
          <p>El servidor valida stock y cupón y calcula el descuento y el envío.</p>
        </div>
      </div>

      {(clientes.error || productos.error) && (
        <ErrorAlert error={clientes.error || productos.error}
          onReintentar={() => { clientes.refetch(); productos.refetch(); }} />
      )}
      {(clientes.loading || productos.loading) && !productos.data && <Loader />}

      <div className="grid grid--orden">
        <div className="stack">
          {ordenCreada && (
            <div className="alert alert--success" role="status">
              <div className="alert__body">
                <div className="alert__title">Orden #{ordenCreada.id} creada · {ordenCreada.totalFormateado}</div>
                <p>
                  Subtotal {ordenCreada.subtotalFormateado} − descuento {ordenCreada.descuentoFormateado} + envío {ordenCreada.envioFormateado}.{' '}
                  <Link to="/ordenes">Ver órdenes</Link>
                </p>
              </div>
            </div>
          )}
          <ErrorAlert error={errorEnvio} onCerrar={() => setErrorEnvio(null)} />

          <form className="card stack" onSubmit={procesarCompra} noValidate>
            <div className="field">
              <label htmlFor="cliente">Cliente</label>
              <select id="cliente" className="select" required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                <option value="">Selecciona un cliente…</option>
                {(clientes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.ciudad}</option>)}
              </select>
            </div>

            <fieldset className="toolbar" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="visually-hidden">Agregar producto</legend>
              <div className="field field--grow">
                <label htmlFor="producto">Producto</label>
                <select id="producto" className="select" value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                  <option value="">Selecciona un producto…</option>
                  {catalogo.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.estaAgotado}>
                      {p.nombre} · {p.precioFormateado} · {p.estaAgotado ? 'agotado' : `stock ${p.stock}`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="cantidad">Cantidad</label>
                <input id="cantidad" className="input input--qty" type="number" min="1" value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))} />
              </div>
              <button type="button" className="btn" onClick={agregarSeleccion} disabled={!productoId}>Agregar</button>
            </fieldset>

            <Carrito lineas={carrito.lineas} onCambiarCantidad={carrito.cambiarCantidad} onQuitar={carrito.quitar} />

            <div className="field">
              <label htmlFor="cupon">Código de cupón (opcional)</label>
              <input id="cupon" className="input input--mono" placeholder="BIENVENIDA10" value={cupon}
                onChange={(e) => setCupon(e.target.value)} autoComplete="off" />
            </div>

            <div className="totales">
              <div><span>Subtotal estimado</span><span>{formatearMoneda(carrito.subtotal)}</span></div>
              <p className="card__hint">El descuento y el envío ($5 en San José, $15 resto del país, gratis sobre $100) los aplica el servidor.</p>
            </div>

            <button type="submit" className="btn btn--primary" disabled={!puedeEnviar}>
              {enviando ? 'Procesando…' : 'Procesar compra'}
            </button>
          </form>
        </div>

        <RecomendadorIA key={ordenCreada?.id ?? 'carrito'} lineas={carrito.lineas} onAgregar={agregarRecomendado} contiene={carrito.contiene} />
      </div>
    </>
  );
}
