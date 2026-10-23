import { Orden } from '../models/Orden';
import { Producto } from '../models/Producto';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

/** Error de la API con el código HTTP y el mensaje `{ error }` que devuelve el backend. */
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }

  get esValidacion() {
    return this.status === 400;
  }

  get esNoEncontrado() {
    return this.status === 404;
  }

  get esConflicto() {
    return this.status === 409;
  }
}

async function request(ruta, { method = 'GET', body, signal } = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con la API. Verifica que el servidor Node.js esté corriendo.', 0);
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ApiError(datos?.error || `Error ${respuesta.status} en ${method} ${ruta}`, respuesta.status);
  }
  return datos;
}

export async function getProductos(signal) {
  const lista = await request('/api/productos', { signal });
  return lista.map(Producto.desdeApi);
}

export function getClientes(signal) {
  return request('/api/clientes', { signal });
}

export async function getOrdenes({ estado } = {}, signal) {
  const query = estado ? `?estado=${encodeURIComponent(estado)}` : '';
  const lista = await request(`/api/ordenes${query}`, { signal });
  return lista.map(Orden.desdeApi);
}

export async function getOrden(id, signal) {
  return Orden.desdeApi(await request(`/api/ordenes/${id}`, { signal }));
}

/** @param {{ cliente_id: number, items: {producto_id: number, cantidad: number}[], cupon_codigo?: string }} payload */
export async function crearOrden(payload) {
  return Orden.desdeApi(await request('/api/ordenes', { method: 'POST', body: payload }));
}

export async function cambiarEstadoOrden(id, estado) {
  return Orden.desdeApi(await request(`/api/ordenes/${id}/estado`, { method: 'PATCH', body: { estado } }));
}

export function cancelarOrden(id) {
  return cambiarEstadoOrden(id, 'cancelada');
}

export function getResumen(signal) {
  return request('/api/resumen', { signal });
}
