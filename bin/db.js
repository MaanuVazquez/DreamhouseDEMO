'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pg = require('pg');

const db = new _pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:asdasd@localhost:5432/dreamhouse',
  ssl: process.env.DATABASE_URL !== undefined
});

db.connect();

exports.default = db;