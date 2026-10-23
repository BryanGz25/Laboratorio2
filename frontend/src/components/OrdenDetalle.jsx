import { ErrorAlert, Loader } from './Feedback';
import { useFetch } from '../hooks/useFetch';
import { getOrden } from '../services/api';
import { formatearMoneda } from '../utils/formato';

/** Fila expandida con los items y el desglose de totales de una orden. */
export default function OrdenDetalle({ ordenId, columnas }) {
  const { data: orden, loading, error } = useFetch((signal) => getOrden(ordenId, signal), [ordenId]);

  return (
    <tr className="table__detail">
      <td colSpan={columnas}>
        {loading && <Loader texto="Cargando detalle…" />}
        <ErrorAlert error={error} />
        {orden && (
          <div className="grid grid--2">
            <table className="table">
              <thead>
                <tr><th>Producto</th><th className="num">Cant.</th><th className="num">Precio</th><th className="num">Importe</th></tr>
              </thead>
              <tbody>
                {orden.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.productoNombre}</td>
                    <td className="num">{item.cantidad}</td>
                    <td className="num">{formatearMoneda(item.precioUnitario)}</td>
                    <td className="num">{formatearMoneda(item.importe)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="totales">
              <div><span>Subtotal</span><span>{orden.subtotalFormateado}</span></div>
              <div>
                <span>Descuento {orden.cuponCodigo && `(${orden.cuponCodigo})`}</span>
                <span>−{orden.descuentoFormateado}</span>
              </div>
              <div><span>Envío {orden.clienteCiudad && `a ${orden.clienteCiudad}`}</span><span>{orden.envioFormateado}</span></div>
              <div className="totales__total"><span>Total</span><span>{orden.totalFormateado}</span></div>
            </div>
          </div>
        )}
      </td>
    </tr>
  );
}
