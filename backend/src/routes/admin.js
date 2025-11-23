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

/**
 * DELETE /api/admin/users/:id
 * Deletes a non-admin user by id.
 * - Only admins can call this (protected by middleware above).
 * - Refuses to delete admin accounts for safety.
 */
router.delete('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);

  if (Number.isNaN(userId)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  // 1) Check if user exists
  const findSql = 'SELECT id, email, role FROM users WHERE id = ?';
  db.get(findSql, [userId], (err, user) => {
    if (err) {
      console.error('Error finding user to delete:', err);
      return res.status(500).json({ message: 'DB error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 2) Do not allow deleting admins
    if (user.role === 'admin') {
      return res
        .status(400)
        .json({ message: 'Cannot delete admin accounts' });
    }

    // 3) Delete user
    const deleteSql = 'DELETE FROM users WHERE id = ?';
    db.run(deleteSql, [userId], function (deleteErr) {
      if (deleteErr) {
        console.error('Error deleting user:', deleteErr);
        return res.status(500).json({ message: 'Failed to delete user' });
      }

      return res.json({
        message: 'User deleted successfully',
        deletedId: userId,
      });
    });
  });
});

module.exports = router;
