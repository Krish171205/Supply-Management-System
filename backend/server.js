require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const ingredientRoutes = require('./routes/ingredients');
const suppliersRoutes = require('./routes/suppliers');
const catalogRoutes = require('./routes/catalog');
const inquiryRoutes = require('./routes/inquiries');
const quoteRoutes = require('./routes/quotes');

// Validate critical environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME', 'DB_DIALECT'];
const missingEnvVars = requiredEnvVars.filter(key => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please configure .env file with all required variables');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Body parser with error handling
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Malformed JSON error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/quotes', quoteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'API is running', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('✓ New client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('✗ Client disconnected:', socket.id);
  });
});

// Sync database and start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(() => {
  server.listen(PORT, () => {
    console.log(`\n✓ Server is running on port ${PORT}`);
    console.log(`✓ Database: ${process.env.DB_NAME} (${process.env.DB_DIALECT})`);
    console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
  });
}).catch(err => {
  console.error('❌ Database sync error:', err.message);
  process.exit(1);
});

module.exports = { app, server, io };
