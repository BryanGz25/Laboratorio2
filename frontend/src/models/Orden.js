import { formatearFecha, formatearMoneda } from '../utils/formato';

export const ESTADOS_ORDEN = ['nueva', 'pagada', 'enviada', 'entregada', 'cancelada'];

const ESTADOS_CANCELABLES = ['nueva', 'pagada'];

const SIGUIENTE_ESTADO = {
  nueva: 'pagada',
  pagada: 'enviada',
  enviada: 'entregada',
};

const COLOR_POR_ESTADO = {
  nueva: 'info',
  pagada: 'accent',
  enviada: 'warning',
  entregada: 'success',
  cancelada: 'neutral',
};

/** Espejo (mirror) de la tabla `ordenes` con reglas de presentación. */
export class Orden {
  constructor(data) {
    this.id = data.id;
    this.clienteId = data.cliente_id;
    this.clienteNombre = data.cliente_nombre ?? `Cliente ${data.cliente_id}`;
    this.clienteCiudad = data.cliente_ciudad ?? null;
    this.cuponCodigo = data.cupon_codigo ?? null;
    this.estado = data.estado;
    this.fecha = data.fecha;
    this.subtotal = Number(data.subtotal);
    this.descuento = Number(data.descuento);
    this.envio = Number(data.envio);
    this.total = Number(data.total);
    this.items = (data.items ?? []).map((item) => ({
      id: item.id,
      productoId: item.producto_id,
      productoNombre: item.producto_nombre,
      cantidad: item.cantidad,
      precioUnitario: Number(item.precio_unitario),
      importe: Number(item.importe ?? item.cantidad * item.precio_unitario),
    }));
  }

  static desdeApi(data) {
    return new Orden(data);
  }

  /** Solo se puede cancelar si aún no ha salido de bodega. */
  get esCancelable() {
    return ESTADOS_CANCELABLES.includes(this.estado);
  }

  get siguienteEstado() {
    return SIGUIENTE_ESTADO[this.estado] ?? null;
  }

  get totalFormateado() {
    return formatearMoneda(this.total);
  }

  get subtotalFormateado() {
    return formatearMoneda(this.subtotal);
  }

  get descuentoFormateado() {
    return formatearMoneda(this.descuento);
  }

  get envioFormateado() {
    return this.envio === 0 ? 'Gratis' : formatearMoneda(this.envio);
  }

  get fechaFormateada() {
    return formatearFecha(this.fecha);
  }

  get badgeColor() {
    return COLOR_POR_ESTADO[this.estado] ?? 'neutral';
  }
}
