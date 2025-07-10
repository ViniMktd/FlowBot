import { Router } from 'express';
import { MercadoPagoWebhooksController } from '../controllers/mercadopago-webhooks.controller';
import { MercadoPagoService } from '../services/mercadopago.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * Middleware para verificar assinatura do webhook do MercadoPago
 */
const verifyMercadoPagoWebhook = (req: any, res: any, next: any) => {
  const signature = req.get('x-signature');
  const body = JSON.stringify(req.body);

  if (!signature) {
    logger.warn('Webhook signature não fornecida');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Validar assinatura usando método estático
  const isValid = MercadoPagoService.validateWebhook(req.body, signature);

  if (!isValid) {
    logger.warn('Webhook signature inválida', { signature });
    return res.status(401).json({ error: 'Invalid signature' });
  }

  next();
};

/**
 * Middleware para log de webhooks recebidos
 */
const logWebhookReceived = (req: any, res: any, next: any) => {
  const userAgent = req.get('User-Agent');
  const contentType = req.get('Content-Type');
  
  logger.info('Webhook recebido do MercadoPago:', {
    userAgent,
    contentType,
    bodyType: req.body?.type,
    dataId: req.body?.data?.id,
    timestamp: new Date().toISOString(),
  });

  next();
};

// Aplicar middlewares globais para webhooks
router.use(logWebhookReceived);

// Em produção, sempre verificar assinatura
if (process.env.NODE_ENV === 'production') {
  router.use(verifyMercadoPagoWebhook);
}

/**
 * @route   POST /api/webhooks/mercadopago
 * @desc    Handle MercadoPago webhooks (payments, merchant_orders, etc.)
 * @access  Public (verified by webhook signature)
 */
router.post('/', MercadoPagoWebhooksController.handlePaymentWebhook);

/**
 * @route   GET /api/webhooks/mercadopago/health
 * @desc    Health check endpoint for webhook URL validation
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'MercadoPago Webhooks',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

/**
 * @route   POST /api/webhooks/mercadopago/test
 * @desc    Test endpoint for webhook testing
 * @access  Public (in development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', (req, res) => {
    logger.info('Webhook de teste do MercadoPago recebido:', req.body);
    res.status(200).json({
      success: true,
      message: 'Webhook de teste processado com sucesso',
      receivedData: req.body,
      timestamp: new Date().toISOString(),
    });
  });
}

export default router;