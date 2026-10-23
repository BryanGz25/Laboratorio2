const { db } = require('../db');

function listar() {
  return db.prepare('SELECT * FROM clientes ORDER BY nombre').all();
}

module.exports = { listar };
