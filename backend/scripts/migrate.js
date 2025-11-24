// backend/scripts/migrate.js
const path = require('path');
const db = require('../src/db');
const ADMIN_EMAIL = 'veeranjaneyulumandagiri@gmail.com';

console.log("Running DB migrations...\n");

db.serialize(() => {

  db.run(
    "ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'",
    (err) => {
      if (err) {
        console.log("users.role - maybe already exists:", err.message);
      } else {
        console.log("Added column users.role");
      }
    }
  );

  db.run(
    "ALTER TABLE products ADD COLUMN description TEXT",
    (err) => {
      if (err) {
        console.log("products.description - maybe already exists:", err.message);
      } else {
        console.log("Added column products.description");
      }
    }
  );

  db.run(
    "ALTER TABLE products ADD COLUMN is_deleted INTEGER DEFAULT 0",
    (err) => {
      if (err) {
        console.log("products.is_deleted - maybe already exists:", err.message);
      } else {
        console.log("Added column products.is_deleted");
      }
    }
  );

  db.run(
    "UPDATE users SET role = 'admin' WHERE email = ?",
    [ADMIN_EMAIL],
    (err) => {
      if (err) {
        console.log("Set admin role error:", err.message);
      } else {
        console.log(`Set admin role for ${ADMIN_EMAIL}`);
      }
    }
  );

  db.run(
    "UPDATE users SET role = 'user' WHERE role IS NULL",
    (err) => {
      if (err) {
        console.log("Update user role default error:", err.message);
      } else {
        console.log("Set role = user for all NULL roles");
      }
    }
  );

});
