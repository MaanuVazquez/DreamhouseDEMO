'use strict';

import { Client } from 'pg';

const db = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:asdasd@localhost:5432/dreamhouse',
  ssl: process.env.DATABASE_URL !== undefined
});

db.connect();

export default db;