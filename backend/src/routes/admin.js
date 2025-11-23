// backend/src/routes/admin.js
const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

// all /api/admin routes require auth + admin
router.use(auth);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * Returns all users with stats:
 * - id
 * - name
 * - email
 * - role
 * - created_at
 * - productCount (how many products they own)
 */
router.get('/users', (req, res) => {
  const sql = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.created_at,
      COUNT(p.id) AS productCount
    FROM users u
    LEFT JOIN products p
      ON p.owner_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('Admin users query error:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    res.json(rows);
  });
});

module.exports = router;
