import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createServer } from 'http';
import morgan from 'morgan';
import 'reflect-metadata';
import { Server as SocketIOServer } from 'socket.io';

// Import configurations
import { logger } from '@/config/logger';
// import { connectDatabase } from '@/config/database';
// import { connectRedis } from '@/config/redis';
// import { setupQueues } from '@/config/queues';

// Import workers
import { registerWorkers, shutdownWorkers } from '@/workers';

// Import routes
import analyticsRoutes from '@/routes/analytics.routes';
import authRoutes from '@/routes/auth';
import customerRoutes from '@/routes/customers';
import dashboardRoutes from '@/routes/dashboard.routes';
import mercadoPagoWebhooksRoutes from '@/routes/mercadopago-webhooks.routes';
import mercadoPagoRoutes from '@/routes/mercadopago.routes';
import orderRoutes from '@/routes/orders';
import queueRoutes from '@/routes/queues';
import shippingRoutes from '@/routes/shipping.routes';
import shopifyConfigRoutes from '@/routes/shopify-config.routes';
import shopifyWebhooksRoutes from '@/routes/shopify-webhooks.routes';
import simplePedidosRoutes from '@/routes/simple-pedidos';
import supplierRoutes from '@/routes/suppliers';
import whatsappRoutes from '@/routes/whatsapp';

// Import middleware
import { errorHandler } from '@/middleware/errorHandler';
import { notFound } from '@/middleware/notFound';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env['FRONTEND_URL'] || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Muitas tentativas de acesso. Tente novamente em alguns minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration for Brazilian environment
app.use(cors({  origin: process.env['NODE_ENV'] === 'production'
    ? process.env['FRONTEND_URL']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// General middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env['NODE_ENV'] !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim())
    }
  }));
}

// Apply rate limiting to API routes
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'],
    version: process.env['npm_package_version'] || '1.0.0',
    timezone: 'America/Sao_Paulo'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/pedidos', simplePedidosRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);

// Shopify routes
app.use('/api/shopify', shopifyConfigRoutes);

// Payment routes
app.use('/api/payments', mercadoPagoRoutes);

// Shipping routes
app.use('/api/shipping', shippingRoutes);

// Webhook routes (no authentication required)
app.use('/api/webhooks/shopify', shopifyWebhooksRoutes);
app.use('/api/webhooks/mercadopago', mercadoPagoWebhooksRoutes);

// Socket.IO setup for real-time updates
io.on('connection', (socket) => {
  logger.info(`Nova conexão Socket.IO: ${socket.id}`);

  socket.on('join_dashboard', () => {
    socket.join('dashboard');
    logger.info(`Socket ${socket.id} entrou no dashboard`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket ${socket.id} desconectado`);
  });
});

// Make io available globally for other modules
declare global {
  var io: SocketIOServer;
}
global.io = io;

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  logger.info(`Recebido ${signal}. Iniciando desligamento gracioso...`);

  // Shutdown workers first
  try {
    await shutdownWorkers();
  } catch (error) {
    logger.error('Erro ao desligar workers:', error);
  }

  server.close(() => {
    logger.info('Servidor HTTP fechado.');

    // Close database connections, queues, etc.
    process.exit(0);
  });

  // Force close after 30s
  setTimeout(() => {
    logger.error('Forçando fechamento do servidor após timeout.');
    process.exit(1);
  }, 30000);
}

// Initialize the application
async function startServer() {
  try {
    // Initialize database
    // await connectDatabase();
    logger.info('✅ Banco de dados PostgreSQL conectado (simulado)');

    // Initialize Redis
    // await connectRedis();
    logger.info('✅ Redis conectado (simulado)');

    // Setup background job queues
    // await setupQueues();
    logger.info('✅ Filas de processamento configuradas (simulado)');

    // Register workers
    registerWorkers();
    logger.info('✅ Workers registrados e ativos');

    const PORT = process.env['PORT'] || 3001;

    server.listen(PORT, () => {
      logger.info(`🚀 Servidor FlowBot rodando na porta ${PORT}`);
      logger.info(`📊 Dashboard: http://localhost:${PORT}/health`);
      logger.info(`🌍 Ambiente: ${process.env['NODE_ENV']}`);
      logger.info(`🇧🇷 Timezone: America/Sao_Paulo`);
    });

  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Start the server only if this file is run directly
if (require.main === module) {
  startServer();
}

export { app, io, server };

