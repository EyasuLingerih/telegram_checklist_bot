require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const checklistRoutes = require('./routes/checklist');
const userRoutes = require('./routes/users');
const groupRoutes = require('./routes/groups');
const adminRoutes = require('./routes/admin');
const webhookRoutes = require('./routes/webhook');
const reminderService = require('./services/reminderService');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Make prisma available to routes
app.set('prisma', prisma);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/telegram', webhookRoutes);

// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Connected to database');

    // Initialize reminder scheduler
    await reminderService.initialize();
    console.log('Reminder scheduler initialized');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  reminderService.stopAll();
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app;
