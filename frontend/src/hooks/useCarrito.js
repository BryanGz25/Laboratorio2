import { useMemo, useState } from 'react';

/** Estado del carrito de la nueva orden: líneas { producto, cantidad }. */
export function useCarrito() {
  const [lineas, setLineas] = useState([]);

  const agregar = (producto, cantidad = 1) => {
    setLineas((actuales) => {
      const existente = actuales.find((l) => l.producto.id === producto.id);
      if (existente) {
        return actuales.map((l) => (l.producto.id === producto.id ? { ...l, cantidad: l.cantidad + cantidad } : l));
      }
      return [...actuales, { producto, cantidad }];
    });
  };

  const cambiarCantidad = (productoId, cantidad) => {
    if (!Number.isInteger(cantidad) || cantidad < 1) return;
    setLineas((actuales) => actuales.map((l) => (l.producto.id === productoId ? { ...l, cantidad } : l)));
  };

  const quitar = (productoId) => setLineas((actuales) => actuales.filter((l) => l.producto.id !== productoId));

  const vaciar = () => setLineas([]);

  const subtotal = useMemo(
    () => lineas.reduce((suma, l) => suma + l.producto.precio * l.cantidad, 0),
    [lineas],
  );

  const contiene = (productoId) => lineas.some((l) => l.producto.id === productoId);

  return { lineas, agregar, cambiarCantidad, quitar, vaciar, subtotal, contiene };
}
