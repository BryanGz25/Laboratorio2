import { formatearMoneda } from '../utils/formato';
import { Vacio } from './Feedback';

export default function Carrito({ lineas, onCambiarCantidad, onQuitar }) {
  if (lineas.length === 0) return <Vacio>Agrega productos para armar la orden.</Vacio>;

  return (
    <ul className="cart">
      {lineas.map(({ producto, cantidad }) => (
        <li key={producto.id} className="cart__line">
          <div>
            <div className="cart__name">{producto.nombre}</div>
            <div className="cart__meta">{producto.precioFormateado} c/u · stock {producto.stock}</div>
            {cantidad > producto.stock && (
              <div className="cart__warn">Supera el stock disponible; la API rechazará la orden.</div>
            )}
          </div>
          <input
            className="input input--qty"
            type="number"
            min="1"
            value={cantidad}
            aria-label={`Cantidad de ${producto.nombre}`}
            onChange={(e) => onCambiarCantidad(producto.id, Number(e.target.value))}
          />
          <span className="cart__amount">{formatearMoneda(producto.precio * cantidad)}</span>
          <button type="button" className="btn btn--sm btn--ghost" onClick={() => onQuitar(producto.id)}
            aria-label={`Quitar ${producto.nombre}`}>
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
