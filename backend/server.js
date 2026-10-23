const path = require('path');

// Cargar variables de entorno ANTES de importar módulos que las usan (db, config).
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');

const config = require('./src/config');
const productosRoutes = require('./src/routes/productos');
const ordenesRoutes = require('./src/routes/ordenes');
const cuponesRoutes = require('./src/routes/cupones');
const clientesRoutes = require('./src/routes/clientes');
const metricsRoutes = require('./src/routes/metrics');
const { rutaNoEncontrada, errorHandler } = require('./src/middlewares/errorHandler');

const app = express();

// CORS: si CORS_ORIGIN está vacío se permiten todos los orígenes (solo para desarrollo).
app.use(cors({
  origin: config.corsOrigin.length ? config.corsOrigin : true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.status(200).json({ estado: 'ok' }));

app.use('/api/productos', productosRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/cupones', cuponesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api', metricsRoutes); // GET /api/resumen

app.use(rutaNoEncontrada);
app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

module.exports = app;
