function numeroDeEntorno(nombre, porDefecto) {
  const valor = process.env[nombre];
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new Error(`Variable de entorno ${nombre} inválida: "${valor}"`);
  }
  return numero;
}

const config = {
  port: numeroDeEntorno('PORT', 3000),
  corsOrigin: (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  envio: {
    ciudadLocal: process.env.CIUDAD_LOCAL || 'San José',
    costoLocal: numeroDeEntorno('ENVIO_LOCAL', 5),
    costoOtrasCiudades: numeroDeEntorno('ENVIO_OTRAS_CIUDADES', 15),
    gratisDesde: numeroDeEntorno('ENVIO_GRATIS_DESDE', 100),
  },
};

module.exports = config;
