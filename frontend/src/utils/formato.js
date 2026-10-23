const moneda = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const fechaHora = new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeStyle: 'short' });

export function formatearMoneda(monto) {
  return moneda.format(Number(monto) || 0);
}

export function formatearFecha(iso) {
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? iso : fechaHora.format(fecha);
}

export function pluralizar(cantidad, singular, plural = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
