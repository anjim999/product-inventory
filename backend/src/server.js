const express = require('express');
const cors = require('cors');
const { PORT, CLIENT_ORIGIN } = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
require('./db'); // initialize tables

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Inventory API running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
