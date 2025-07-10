import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';

// Import configurations
import { logger } from './config/simple-logger';

// Import routes
import simplePedidosRoutes from './routes/simple-pedidos';
// import simpleAuthRoutes from './routes/simple-auth';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Basic middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// JSON parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0',
    timezone: 'America/Sao_Paulo'
  });
});

// API Routes
app.use('/api/pedidos', simplePedidosRoutes);
// app.use('/api/auth', simpleAuthRoutes);

// Test route
app.get('/api/test', (_req, res) => {
  res.json({
    success: true,
    message: 'FlowBot Backend está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Teste do sistema de orders real
app.get('/api/orders', async (_req, res) => {
  try {
    // Importar o PrismaClient diretamente
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const orders = await prisma.order.findMany({
      take: 10,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        supplier: {
          select: {
            id: true,
            companyName: true,
            tradeName: true
          }
        },
        orderItems: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const formattedOrders = orders.map((order: any) => ({
      id: order.id,
      shopifyOrderId: order.shopifyOrderId.toString(),
      shopifyOrderNumber: order.shopifyOrderNumber,
      status: order.status,
      totalAmount: order.totalAmount,
      currency: order.currency,
      shippingAmount: order.shippingAmount,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      customer: order.customer,
      supplier: order.supplier,
      items: order.orderItems
    }));

    res.json({
      success: true,
      data: {
        data: formattedOrders,
        pagination: {
          page: 1,
          limit: 10,
          total: formattedOrders.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      }
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado'
  });
});

// Error handler
app.use((error: any, _req: any, res: any, _next: any) => {
  logger.error('Erro na aplicação:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Start server
async function startServer() {
  try {
    logger.info('🚀 Iniciando FlowBot Backend...');

    const PORT = process.env['PORT'] || 3001;

    server.listen(PORT, () => {
      logger.info(`🚀 Servidor FlowBot rodando na porta ${PORT}`);
      logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
      logger.info(`🛒 API Pedidos: http://localhost:${PORT}/api/pedidos`);
      logger.info(`🇧🇷 Timezone: America/Sao_Paulo`);
      logger.info('✅ Sistema pronto para uso!');
    });

  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGTERM', () => {
  logger.info('📛 SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    logger.info('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('📛 SIGINT recebido, encerrando servidor...');
  server.close(() => {
    logger.info('✅ Servidor encerrado graciosamente');
    process.exit(0);
  });
});

// Start the server
startServer().catch((error) => {
  logger.error('❌ Falha crítica na inicialização:', error);
  process.exit(1);
});
