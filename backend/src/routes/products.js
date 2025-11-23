const express = require('express');
const { body, validationResult } = require('express-validator');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protect all routes below with JWT auth
router.use(auth);

// Low stock threshold
const LOW_STOCK_THRESHOLD = 5;

/**
 * Helper: build WHERE + params based on user role & filters
 */
function buildProductWhere({ user, search, category, lowStockOnly }) {
  const params = [];
  let where = 'WHERE is_deleted = 0';

  // non-admin → only show own products
  if (!user || user.role !== 'admin') {
    where += ' AND owner_id = ?';
    params.push(user.userId);
  }

  const searchTrim = (search || '').trim();
  if (searchTrim) {
    where += ' AND LOWER(name) LIKE ?';
    params.push(`%${searchTrim.toLowerCase()}%`);
  }

  const catTrim = (category || '').trim();
  if (catTrim) {
    // normalize both sides (TRIM + LOWER)
    where += ' AND TRIM(LOWER(category)) = TRIM(LOWER(?))';
    params.push(catTrim);
  }

  // low stock = stock > 0 AND stock <= threshold
  if (lowStockOnly === 'true' || lowStockOnly === true) {
    where += ' AND stock > 0 AND stock <= ?';
    params.push(LOW_STOCK_THRESHOLD);
  }

  return { where, params };
}

/**
 * GET /api/products
 * Query: page, limit, search, category, sortBy, sortOrder, lowStockOnly
 */
router.get('/', (req, res) => {
  const user = req.user;

  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    sortBy = 'name',
    sortOrder = 'asc',
    lowStockOnly = 'false'
  } = req.query;

  const allowedSort = ['name', 'stock', 'category', 'brand'];
  const orderCol = allowedSort.includes(sortBy) ? sortBy : 'name';
  const orderDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const offset = (Number(page) - 1) * Number(limit);

  const { where, params } = buildProductWhere({
    user,
    search,
    category,
    lowStockOnly
  });

  const countSql = `SELECT COUNT(*) as total FROM products ${where}`;
  db.get(countSql, params, (err, row) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    const total = row.total;

    const sql = `
      SELECT * FROM products
      ${where}
      ORDER BY ${orderCol} ${orderDir}
      LIMIT ? OFFSET ?
    `;

    db.all(sql, [...params, Number(limit), offset], (err2, products) => {
      if (err2) return res.status(500).json({ message: 'DB error' });

      res.json({
        data: products,
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      });
    });
  });
});

/**
 * GET /api/products/summary
 */
router.get('/summary', (req, res) => {
  const user = req.user;

  const params = [LOW_STOCK_THRESHOLD];
  let where = 'WHERE is_deleted = 0';

  if (!user || user.role !== 'admin') {
    where += ' AND owner_id = ?';
    params.push(user.userId);
  }

  const sql = `
    SELECT
      COUNT(*) AS totalProducts,
      SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS outOfStockCount,
      SUM(CASE WHEN stock > 0 AND stock <= ? THEN 1 ELSE 0 END) AS lowStockCount,
      COUNT(DISTINCT TRIM(LOWER(category))) AS categoryCount
    FROM products
    ${where}
  `;

  db.get(sql, params, (err, row) => {
    if (err) {
      console.error('Summary query error:', err);
      return res.status(500).json({ message: 'DB error' });
    }
    res.json(row);
  });
});

/**
 * GET /api/products/search?name=abc
 */
router.get('/search', (req, res) => {
  const { name = '' } = req.query;
  const user = req.user;

  let where = 'WHERE is_deleted = 0 AND LOWER(name) LIKE ?';
  const params = [`%${name.toLowerCase()}%`];

  if (user.role !== 'admin') {
    where += ' AND owner_id = ?';
    params.push(user.userId);
  }

  db.all(`SELECT * FROM products ${where}`, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.json(rows);
  });
});

/**
 * GET /api/products/:id/history
 */
router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY timestamp DESC',
    [id],
    (err, rows) => {
      if (err) {
        console.error('History DB error', err);
        return res.status(500).json({ message: 'DB error' });
      }
      res.json(rows);
    }
  );
});

/**
 * PUT /api/products/:id
 */
router.put(
  '/:id',
  upload.single('image'),
  body('name').notEmpty(),
  body('unit').notEmpty(),
  body('category').notEmpty(),
  body('brand').notEmpty(),
  body('stock').isInt({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const user = req.user;

    const rawCategory = req.body.category || '';
    const category = rawCategory.trim();
    const { name, unit, brand, stock, description = '' } = req.body;

    const stockNum = Number(stock) || 0;
    const status = stockNum === 0 ? 'Out of Stock' : 'In Stock';

    const file = req.file;

    const params = [id];
    let where = 'WHERE id = ? AND is_deleted = 0';
    if (user.role !== 'admin') {
      where += ' AND owner_id = ?';
      params.push(user.userId);
    }

    db.get(`SELECT * FROM products ${where}`, params, (err, existing) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (!existing) return res.status(404).json({ message: 'Product not found' });

      const params2 = [name.toLowerCase()];
      let where2 = 'WHERE LOWER(name) = ? AND is_deleted = 0';

      if (user.role !== 'admin') {
        where2 += ' AND owner_id = ?';
        params2.push(user.userId);
      }

      where2 += ' AND id != ?';
      params2.push(id);

      db.get(`SELECT id FROM products ${where2}`, params2, (err2, conflict) => {
        if (err2) return res.status(500).json({ message: 'DB error' });
        if (conflict) {
          return res
            .status(400)
            .json({ message: 'Product name must be unique' });
        }

        const now = new Date().toISOString();

        if (Number(existing.stock) !== stockNum) {
          db.run(
            `INSERT INTO inventory_logs
             (product_id, old_stock, new_stock, changed_by, timestamp)
             VALUES (?, ?, ?, ?, ?)`,
            [
              id,
              existing.stock,
              stockNum,
              user?.email || 'admin',
              now
            ]
          );
        }

        const imagePath = file
          ? `/uploads/${file.filename}`
          : existing.image;

        db.run(
          `UPDATE products
           SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?,
               image = ?, description = ?, updated_at = ?
           WHERE id = ?`,
          [
            name,
            unit,
            category,
            brand,
            stockNum,
            status,
            imagePath,
            description,
            now,
            id
          ],
          function (err3) {
            if (err3) return res.status(500).json({ message: 'DB error' });

            db.get(
              'SELECT * FROM products WHERE id = ?',
              [id],
              (err4, updated) => {
                if (err4)
                  return res.status(500).json({ message: 'DB error' });
                res.json(updated);
              }
            );
          }
        );
      });
    });
  }
);

/**
 * POST /api/products/import (CSV)
 */
router.post('/import', upload.single('file'), (req, res) => {
  const user = req.user;

  if (!req.file) return res.status(400).json({ message: 'CSV file required' });

  const filePath = req.file.path;
  const results = [];
  let added = 0;
  let skipped = 0;
  const duplicates = [];

  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on('data', (row) => results.push(row))
    .on('end', () => {
      const tasks = results.map(
        (productRow) =>
          new Promise((resolve) => {
            const name = (productRow.name || '').trim();
            const unit = productRow.unit || '';
            const category = (productRow.category || '').trim();
            const brand = productRow.brand || '';
            const stock = parseInt(productRow.stock || '0', 10);
            const status = stock === 0 ? 'Out of Stock' : 'In Stock';
            const image = productRow.image || '';
            const description = productRow.description || '';

            if (!name) {
              skipped++;
              return resolve();
            }

            const where =
              'WHERE LOWER(name) = ? AND owner_id = ? AND is_deleted = 0';

            db.get(
              `SELECT id FROM products ${where}`,
              [name.toLowerCase(), user.userId],
              (err, existing) => {
                if (err) {
                  skipped++;
                  return resolve();
                }
                if (existing) {
                  skipped++;
                  duplicates.push({ name, existingId: existing.id });
                  return resolve();
                }

                const now = new Date().toISOString();
                db.run(
                  `INSERT INTO products
                   (owner_id, name, unit, category, brand, stock, status, image, description, is_deleted, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
                  [
                    user.userId,
                    name,
                    unit,
                    category,
                    brand,
                    stock,
                    status,
                    image,
                    description,
                    now,
                    now
                  ],
                  (err2) => {
                    if (err2) {
                      skipped++;
                      return resolve();
                    }
                    added++;
                    resolve();
                  }
                );
              }
            );
          })
      );

      Promise.all(tasks).then(() => {
        fs.unlinkSync(filePath);
        res.json({ added, skipped, duplicates });
      });
    });
});

/**
 * GET /api/products/export
 */
router.get('/export', (req, res) => {
  const user = req.user;

  let where = 'WHERE is_deleted = 0';
  const params = [];

  if (user.role !== 'admin') {
    where += ' AND owner_id = ?';
    params.push(user.userId);
  }

  db.all(`SELECT * FROM products ${where}`, params, (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    const header =
      'name,unit,category,brand,stock,status,image,description\n';
    const lines = rows.map((p) =>
      [
        p.name,
        p.unit,
        p.category,
        p.brand,
        p.stock,
        p.status,
        p.image || '',
        p.description || ''
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );

    const csv = header + lines.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="products.csv"'
    );
    res.send(csv);
  });
});

/**
 * DELETE /api/products/:id (Hard delete)
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const user = req.user;

  let sql = 'DELETE FROM products WHERE id = ?';
  const params = [id];

  if (user.role !== 'admin') {
    sql += ' AND owner_id = ?';
    params.push(user.userId);
  }

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ message: 'DB error' });
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json({ message: 'Deleted' });
  });
});

/**
 * POST /api/products (Add new)
 */
router.post(
  '/',
  upload.single('image'),
  body('name').notEmpty(),
  body('unit').notEmpty(),
  body('category').notEmpty(),
  body('brand').notEmpty(),
  body('stock').isInt({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const user = req.user;

    const rawCategory = req.body.category || '';
    const category = rawCategory.trim();
    const { name, unit, brand, stock, description = '' } = req.body;

    const file = req.file;

    const stockNum = Number(stock) || 0;
    const status = stockNum === 0 ? 'Out of Stock' : 'In Stock';

    const imagePath = file ? `/uploads/${file.filename}` : '';
    const now = new Date().toISOString();

    const where =
      user.role === 'admin'
        ? 'WHERE LOWER(name) = ? AND is_deleted = 0'
        : 'WHERE LOWER(name) = ? AND owner_id = ? AND is_deleted = 0';

    const params =
      user.role === 'admin'
        ? [name.toLowerCase()]
        : [name.toLowerCase(), user.userId];

    db.get(`SELECT id FROM products ${where}`, params, (err, existing) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (existing) {
        return res
          .status(400)
          .json({ message: 'Name must be unique for this user' });
      }

      db.run(
        `INSERT INTO products
         (owner_id, name, unit, category, brand, stock, status, image, description, is_deleted, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
        [
          user.userId,
          name,
          unit,
          category,
          brand,
          stockNum,
          status,
          imagePath,
          description,
          now,
          now
        ],
        function (err2) {
          if (err2) return res.status(500).json({ message: 'DB error' });

          db.get(
            'SELECT * FROM products WHERE id = ?',
            [this.lastID],
            (err3, row) => {
              if (err3) return res.status(500).json({ message: 'DB error' });
              res.status(201).json(row);
            }
          );
        }
      );
    });
  }
);

module.exports = router;
