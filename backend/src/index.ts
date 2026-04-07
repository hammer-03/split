import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import {
  authRoutes,
  groupRoutes,
  expenseRoutes,
  settlementRoutes,
  balanceRoutes,
  activityRoutes,
  userRoutes,
  aiRoutes,
  analyticsRoutes,
} from './routes/index.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow any Vercel preview domain, localhost, or the explicit FRONTEND_URL safely
    if (!origin || origin.includes('vercel.app') || origin.includes('localhost') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Connect to MongoDB and start server
async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined');
      process.exit(1);
    }

    // Census the URI for logging (removes password)
    const censoredUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB: ${censoredUri}`);

    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log('Successfully connected to MongoDB Atlas');

    // Keep-alive heartbeat for Atlas M0 Free Tier (prevents idle timeouts)
    setInterval(() => {
      if (mongoose.connection.readyState === 1) {
        mongoose.connection.db?.admin().ping().catch(err => console.error('Heartbeat failed:', err));
      }
    }, 120000); // Every 2 minutes

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to start server:', error.name, error.message);
      if (error.name === 'MongooseServerSelectionError') {
        console.error('DIAGNOSIS: The server could not reach MongoDB Atlas. This is usually due to an IP whitelist issue (0.0.0.0/0) or a wrong password in the URI.');
      }
    } else {
      console.error('Failed to start server:', error);
    }
    process.exit(1);
  }
}

start();
