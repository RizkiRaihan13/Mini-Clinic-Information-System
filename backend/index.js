const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRouter = require('./routes/api');
const { sendError } = require('./middleware/responseHandler');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(helmet());
app.use(cors());
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

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Mini Clinic System API Server running on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(` API Base URL: http://localhost:${PORT}/api`);
  console.log(`====================================================`);
});
