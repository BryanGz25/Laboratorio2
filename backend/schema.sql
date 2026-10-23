-- =============================================================
-- Tienda Online con Inventario, Cupones y Envíos — San José, Costa Rica (SQLite)
-- Ejecutar: npm run db:reset   (borra y recrea todo con datos de prueba)
-- =============================================================

PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS orden_items;
DROP TABLE IF EXISTS ordenes;
DROP TABLE IF EXISTS cupones;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS productos;

-- -------------------------------------------------------------
-- Tablas
-- -------------------------------------------------------------
CREATE TABLE productos (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre      TEXT    NOT NULL,
    descripcion TEXT,
    precio      REAL    NOT NULL CHECK (precio > 0),
    stock       INTEGER NOT NULL CHECK (stock >= 0),
    categoria   TEXT    NOT NULL
);

CREATE TABLE clientes (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email  TEXT NOT NULL UNIQUE,
    ciudad TEXT NOT NULL
);

CREATE TABLE cupones (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo        TEXT    NOT NULL UNIQUE,
    porcentaje    REAL    NOT NULL CHECK (porcentaje > 0 AND porcentaje <= 100),
    vigente_hasta TEXT    NOT NULL,                     -- formato YYYY-MM-DD (inclusive)
    usos_maximos  INTEGER NOT NULL CHECK (usos_maximos > 0),
    usos_actuales INTEGER NOT NULL DEFAULT 0 CHECK (usos_actuales >= 0 AND usos_actuales <= usos_maximos)
);

CREATE TABLE ordenes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL REFERENCES clientes (id),
    cupon_id   INTEGER REFERENCES cupones (id),
    estado     TEXT    NOT NULL DEFAULT 'nueva'
               CHECK (estado IN ('nueva', 'pagada', 'enviada', 'entregada', 'cancelada')),
    fecha      TEXT    NOT NULL,                        -- ISO 8601
    subtotal   REAL    NOT NULL,
    descuento  REAL    NOT NULL DEFAULT 0,
    envio      REAL    NOT NULL DEFAULT 0,
    total      REAL    NOT NULL
);

CREATE TABLE orden_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    orden_id        INTEGER NOT NULL REFERENCES ordenes (id) ON DELETE CASCADE,
    producto_id     INTEGER NOT NULL REFERENCES productos (id),
    cantidad        INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario REAL    NOT NULL
);

-- Índices sobre llaves foráneas y filtros frecuentes
CREATE INDEX idx_ordenes_cliente     ON ordenes (cliente_id);
CREATE INDEX idx_ordenes_cupon       ON ordenes (cupon_id);
CREATE INDEX idx_ordenes_estado      ON ordenes (estado);
CREATE INDEX idx_orden_items_orden   ON orden_items (orden_id);
CREATE INDEX idx_orden_items_producto ON orden_items (producto_id);
CREATE INDEX idx_productos_categoria ON productos (categoria);

-- -------------------------------------------------------------
-- Datos de prueba (seed)
-- El stock ya refleja las unidades vendidas en las órdenes de abajo.
-- -------------------------------------------------------------
INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES
    ('Laptop 14 pulgadas',   'Laptop 16 GB RAM, 512 GB SSD',      650.00, 10, 'Electrónica'),
    ('Audífonos Bluetooth',  'Cancelación de ruido, 30 h batería', 45.00,  28, 'Electrónica'),
    ('Camiseta de algodón',  'Talla M, 100% algodón',              12.50,  48, 'Ropa'),
    ('Cafetera de goteo',    'Capacidad 12 tazas',                 60.00,  14, 'Hogar'),
    ('Lámpara LED de escritorio', 'Luz regulable, puerto USB',     25.00,  39, 'Hogar'),
    ('Mouse inalámbrico',    'Receptor USB, 1600 DPI',             18.00,  35, 'Electrónica');

INSERT INTO clientes (nombre, email, ciudad) VALUES
    ('Ana López',     'ana.lopez@example.com',     'San José'),
    ('Carlos Méndez', 'carlos.mendez@example.com', 'Cartago'),
    ('María Rivera',  'maria.rivera@example.com',  'San José');

INSERT INTO cupones (codigo, porcentaje, vigente_hasta, usos_maximos, usos_actuales) VALUES
    ('BIENVENIDA10', 10, '2026-12-31', 100, 1),  -- vigente, con usos disponibles
    ('VERANO20',     20, '2025-08-31',  50, 0),  -- vencido
    ('FLASH50',      50, '2026-12-31',   1, 1);  -- agotado

-- Orden 1: Ana (San José, local), cupón BIENVENIDA10. Subtotal 115 - 11.50 = 103.50 > 100 => envío gratis
INSERT INTO ordenes (cliente_id, cupon_id, estado, fecha, subtotal, descuento, envio, total)
VALUES (1, 1, 'entregada', '2026-10-01T15:00:00.000Z', 115.00, 11.50, 0, 103.50);
INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
    (1, 2, 2, 45.00),
    (1, 3, 2, 12.50);

-- Orden 2: Carlos (Cartago, fuera de San José), sin cupón. Subtotal 25 + envío 15 = 40
INSERT INTO ordenes (cliente_id, cupon_id, estado, fecha, subtotal, descuento, envio, total)
VALUES (2, NULL, 'pagada', '2026-10-10T18:30:00.000Z', 25.00, 0, 15.00, 40.00);
INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
    (2, 5, 1, 25.00);

-- Orden 3: María (San José, local), cupón FLASH50. Subtotal 60 - 30 = 30 + envío 5 = 35
INSERT INTO ordenes (cliente_id, cupon_id, estado, fecha, subtotal, descuento, envio, total)
VALUES (3, 3, 'nueva', '2026-10-20T20:15:00.000Z', 60.00, 30.00, 5.00, 35.00);
INSERT INTO orden_items (orden_id, producto_id, cantidad, precio_unitario) VALUES
    (3, 4, 1, 60.00);
