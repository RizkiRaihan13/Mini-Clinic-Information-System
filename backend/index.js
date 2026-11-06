const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { sendError } = require('./middleware/responseHandler');
const { autoAdvanceCalledQueues } = require('./controllers/queueController');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(helmet());
// CORS_ORIGIN: daftar origin dipisah koma (contoh: https://app.vercel.app). Kosong = izinkan semua.
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : undefined));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  sendError(res, 'Endpoint not found', { url: `${req.method} ${req.originalUrl}` }, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  sendError(res, 'Internal Server Error', { server: err.message }, 500);
});

// Di Vercel (serverless) tidak ada server yang hidup terus; auto-advance antrean
// sudah juga dipanggil saat getQueues, jadi scheduler & listen hanya untuk lokal/server biasa.
if (!process.env.VERCEL) {
  // Scheduler: Dipanggil > 1 menit -> otomatis Dalam Pemeriksaan
  setInterval(() => {
    autoAdvanceCalledQueues();
  }, 10000);

  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` Mini Clinic System API Server running on port ${PORT}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
    console.log(` API Base URL: http://localhost:${PORT}/api`);
    console.log(`====================================================`);
  });
}

module.exports = app;
