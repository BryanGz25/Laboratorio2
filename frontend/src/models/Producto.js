import { formatearMoneda, pluralizar } from '../utils/formato';

export const UMBRAL_POCAS_UNIDADES = 5;

/** Espejo (mirror) de la tabla `productos` con valores calculados para la UI. */
export class Producto {
  constructor({ id, nombre, descripcion, precio, stock, categoria }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion ?? '';
    this.precio = Number(precio);
    this.stock = Number(stock);
    this.categoria = categoria;
  }

  static desdeApi(data) {
    return new Producto(data);
  }

  get precioFormateado() {
    return formatearMoneda(this.precio);
  }

  get stockFormateado() {
    return pluralizar(this.stock, 'unidad', 'unidades');
  }

  get estaAgotado() {
    return this.stock === 0;
  }

  get pocasUnidades() {
    return this.stock > 0 && this.stock <= UMBRAL_POCAS_UNIDADES;
  }

  /** Etiqueta y color del badge de inventario. */
  get disponibilidad() {
    if (this.estaAgotado) return { etiqueta: 'Agotado', color: 'danger' };
    if (this.pocasUnidades) return { etiqueta: 'Pocas unidades', color: 'warning' };
    return { etiqueta: 'Disponible', color: 'success' };
  }

  /** Datos mínimos que se envían al agente de IA. */
  aResumenIA(cantidad = 1) {
    return {
      producto_id: this.id,
      nombre: this.nombre,
      categoria: this.categoria,
      precio: this.precio,
      cantidad,
    };
  }
}
