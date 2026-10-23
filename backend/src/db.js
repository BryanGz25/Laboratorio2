const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.resolve(__dirname, '..', process.env.DB_PATH || 'tienda.db');
const SCHEMA_PATH = path.resolve(__dirname, '..', 'schema.sql');

const db = new Database(DB_PATH);

// SQLite deshabilita las llaves foráneas por defecto: se activan en cada conexión.
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Si la base está vacía (primer arranque), se crea con schema.sql + datos de prueba.
const tablaProductos = db
  .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'productos'")
  .get();
if (!tablaProductos) {
  db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
}

/**
 * Ejecuta `fn` dentro de una transacción explícita.
 * Si `fn` lanza un error se hace ROLLBACK y el error se propaga.
 */
function enTransaccion(fn) {
  db.exec('BEGIN TRANSACTION');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    if (db.inTransaction) db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { db, enTransaccion, SCHEMA_PATH };
