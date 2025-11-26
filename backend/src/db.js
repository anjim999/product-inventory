// backend/src/db.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

if (process.env.NODE_ENV === "test") {
  db = new sqlite3.Database(':memory:');
  console.log("🧪 Using in-memory database for Jest tests");
} else {
  const dbPath = path.join(__dirname, '..', 'inventory.db');
  db = new sqlite3.Database(dbPath);
  console.log("Using persistent database:", dbPath);
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      is_verified INTEGER DEFAULT 1,
      created_at TEXT,
      google_id TEXT,
      avatar TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      purpose TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      category TEXT NOT NULL,
      brand TEXT NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      image TEXT,
      description TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      UNIQUE(owner_id, name),
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      old_stock INTEGER,
      new_stock INTEGER,
      changed_by TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);
});

module.exports = db;
