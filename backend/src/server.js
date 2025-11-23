const express = require('express');
const cors = require('cors');
const path = require('path'); // 👈 added
const { PORT } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://product-inventory-nu.vercel.app' // 👈 no trailing slash
];

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like Postman / curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS, origin was:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Handle preflight for all routes using SAME options
app.options('*', cors(corsOptions));

// For JSON bodies
app.use(express.json());

// (Optional but nice) for urlencoded forms
app.use(express.urlencoded({ extended: true }));

// 👇 Serve uploaded files (images / pdfs) at /uploads/...
// upload.js stores in ../../uploads (project root /uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Inventory API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
