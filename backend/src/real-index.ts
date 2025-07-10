import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { logger } from './config/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';

// Importar rotas
import customersRoutes from './routes/customers';
import ordersRealRoutes from './routes/orders-real';
import suppliersRoutes from './routes/suppliers';
import whatsappRoutes from './routes/whatsapp';

const app = express();

// Configurações de segurança
app.use(helmet());
app.use(cors({
  origin: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutos
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'),
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  }
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((_req, _res, next) => {
  logger.info(`${_req.method} ${_req.path}`, {
    method: _req.method,
    url: _req.url,
    ip: _req.ip,
    userAgent: _req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env['NODE_ENV'] || 'development',
    version: '1.0.0',
    timezone: 'America/Sao_Paulo'
  });
});

// Rotas da API
app.use('/api/orders', ordersRealRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Middleware de tratamento de erros
app.use(notFound);
app.use(errorHandler);

// Função para iniciar o servidor
const startServer = async () => {
  const port = process.env['PORT'] || 3001;

  try {
    app.listen(port, () => {
      logger.info(`🚀 Servidor FlowBot rodando na porta ${port}`);
      logger.info(`📊 Health Check: http://localhost:${port}/health`);
      logger.info(`🛒 API Orders: http://localhost:${port}/api/orders`);
      logger.info(`👥 API Customers: http://localhost:${port}/api/customers`);
      logger.info(`🏪 API Suppliers: http://localhost:${port}/api/suppliers`);
      logger.info(`📱 API WhatsApp: http://localhost:${port}/api/whatsapp`);
      logger.info(`🇧🇷 Timezone: America/Sao_Paulo`);
      logger.info(`✅ Sistema pronto para uso!`);
    });
  } catch (error) {
    logger.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor se este arquivo for executado diretamente
if (require.main === module) {
  logger.info('🚀 Iniciando FlowBot Backend...');
  startServer();
}

export default app;
