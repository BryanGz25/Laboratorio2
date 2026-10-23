// Borra y recrea todas las tablas con los datos de prueba de schema.sql.
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { db, SCHEMA_PATH } = require('../src/db');

db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
db.close();
console.log('Base de datos reiniciada con datos de prueba.');
