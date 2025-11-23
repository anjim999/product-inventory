const express = require('express');
const { body, validationResult } = require('express-validator');
const csvParser = require('csv-parser');
const fs = require('fs');
const db = require('../db');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Protect all routes below with JWT auth
router.use(auth);

/**
 * GET /api/products
 * Query: page, limit, search, category, sortBy, sortOrder
 * Returns only products of the logged-in user (owner_id = req.user.userId)
 */
router.get('/', (req, res) => {
  const userId = req.user.userId;

  const {
    page = 1,
    limit = 10,
    search = '',
    category = '',
    sortBy = 'name',
    sortOrder = 'asc',
  } = req.query;

  const allowedSort = ['name', 'stock', 'category', 'brand'];
  const orderCol = allowedSort.includes(sortBy) ? sortBy : 'name';
  const orderDir = sortOrder.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const offset = (Number(page) - 1) * Number(limit);
  const params = [userId];
  let where = 'WHERE owner_id = ?';

  if (search) {
    where += ' AND LOWER(name) LIKE ?';
    params.push(`%${search.toLowerCase()}%`);
  }
  if (category) {
    where += ' AND category = ?';
    params.push(category);
  }

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
        totalPages: Math.ceil(total / limit),
      });
    });
  });
});

/**
 * GET /api/products/search?name=abc
 * Also per-user
 */
router.get('/search', (req, res) => {
  const { name = '' } = req.query;
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM products WHERE owner_id = ? AND LOWER(name) LIKE ?',
    [userId, `%${name.toLowerCase()}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }
  );
});

/**
 * GET /api/products/:id/history
 * (History is global per product, but product belongs to one user)
 */
router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  db.all(
    'SELECT * FROM inventory_logs WHERE product_id = ? ORDER BY timestamp DESC',
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'DB error' });
      res.json(rows);
    }
  );
});

/**
 * PUT /api/products/:id
 * Update a product that belongs to the current user
 * (Still uses image from body as string)
 */
router.put(
  '/:id',
  body('name').notEmpty(),
  body('unit').notEmpty(),
  body('category').notEmpty(),
  body('brand').notEmpty(),
  body('stock').isInt({ min: 0 }),
  body('status').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { id } = req.params;
    const userId = req.user.userId;
    const { name, unit, category, brand, stock, status, image } = req.body;

    // Fetch product belonging to this user
    db.get(
      'SELECT * FROM products WHERE id = ? AND owner_id = ?',
      [id, userId],
      (err, existing) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (!existing)
          return res.status(404).json({ message: 'Product not found' });

        // Unique name per owner
        db.get(
          'SELECT id FROM products WHERE LOWER(name) = ? AND owner_id = ? AND id != ?',
          [name.toLowerCase(), userId, id],
          (err2, conflict) => {
            if (err2) return res.status(500).json({ message: 'DB error' });
            if (conflict) {
              return res
                .status(400)
                .json({ message: 'Product name must be unique' });
            }

            const now = new Date().toISOString();

            // Inventory history if stock changed
            if (Number(existing.stock) !== Number(stock)) {
              db.run(
                `INSERT INTO inventory_logs
                 (product_id, old_stock, new_stock, changed_by, timestamp)
                 VALUES (?, ?, ?, ?, ?)`,
                [id, existing.stock, stock, req.user?.email || 'admin', now]
              );
            }

            db.run(
              `UPDATE products
               SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?, updated_at = ?
               WHERE id = ? AND owner_id = ?`,
              [
                name,
                unit,
                category,
                brand,
                stock,
                status,
                image || existing.image,
                now,
                id,
                userId,
              ],
              function (err3) {
                if (err3) return res.status(500).json({ message: 'DB error' });

                db.get(
                  'SELECT * FROM products WHERE id = ? AND owner_id = ?',
                  [id, userId],
                  (err4, updated) => {
                    if (err4)
                      return res.status(500).json({ message: 'DB error' });
                    res.json(updated);
                  }
                );
              }
            );
          }
        );
      }
    );
  }
);

/**
 * POST /api/products/import
 * multipart/form-data: file (csv)
 * Imports CSV only into current user's products
 */
router.post('/import', upload.single('file'), (req, res) => {
  const userId = req.user.userId;

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
            const category = productRow.category || '';
            const brand = productRow.brand || '';
            const stock = parseInt(productRow.stock || '0', 10);
            const status =
              productRow.status || (stock > 0 ? 'In Stock' : 'Out of Stock');
            const image = productRow.image || '';

            if (!name) {
              skipped++;
              return resolve();
            }

            db.get(
              'SELECT id FROM products WHERE LOWER(name) = ? AND owner_id = ?',
              [name.toLowerCase(), userId],
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
                   (owner_id, name, unit, category, brand, stock, status, image, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    userId,
                    name,
                    unit,
                    category,
                    brand,
                    stock,
                    status,
                    image,
                    now,
                    now,
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
 * Exports only current user's products
 */
router.get('/export', (req, res) => {
  const userId = req.user.userId;

  db.all('SELECT * FROM products WHERE owner_id = ?', [userId], (err, rows) => {
    if (err) return res.status(500).json({ message: 'DB error' });

    const header = 'name,unit,category,brand,stock,status,image\n';
    const lines = rows.map((p) =>
      [
        p.name,
        p.unit,
        p.category,
        p.brand,
        p.stock,
        p.status,
        p.image || '',
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
 * DELETE /api/products/:id
 * Deletes only if product belongs to current user
 */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  db.run(
    'DELETE FROM products WHERE id = ? AND owner_id = ?',
    [id, userId],
    function (err) {
      if (err) return res.status(500).json({ message: 'DB error' });
      if (this.changes === 0)
        return res.status(404).json({ message: 'Not found' });
      res.json({ message: 'Deleted' });
    }
  );
});

/**
 * POST /api/products
 * Add New Product for the current user
 * Accepts multipart/form-data (optional image/pdf file as "image")
 */
router.post(
  '/',
  upload.single('image'),
  body('name').notEmpty(),
  body('unit').notEmpty(),
  body('category').notEmpty(),
  body('brand').notEmpty(),
  body('stock').isInt({ min: 0 }),
  body('status').notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.userId;
    const { name, unit, category, brand, stock, status } = req.body;
    const file = req.file;

    // Store relative path or filename
    const imagePath = file ? `/uploads/${file.filename}` : '';

    const now = new Date().toISOString();

    db.get(
      'SELECT id FROM products WHERE LOWER(name) = ? AND owner_id = ?',
      [name.toLowerCase(), userId],
      (err, existing) => {
        if (err) return res.status(500).json({ message: 'DB error' });
        if (existing) {
          return res
            .status(400)
            .json({ message: 'Name must be unique for this user' });
        }

        db.run(
          `INSERT INTO products
           (owner_id, name, unit, category, brand, stock, status, image, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, name, unit, category, brand, stock, status, imagePath, now, now],
          function (err2) {
            if (err2) return res.status(500).json({ message: 'DB error' });

            db.get(
              'SELECT * FROM products WHERE id = ? AND owner_id = ?',
              [this.lastID, userId],
              (err3, row) => {
                if (err3) return res.status(500).json({ message: 'DB error' });
                res.status(201).json(row);
              }
            );
          }
        );
      }
    );
  }
);

module.exports = router;
