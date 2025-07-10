import { Router } from 'express';
import { ShopifyWebhooksController } from '../controllers/shopify-webhooks.controller';
import { ShopifyRealService } from '../services/shopify-real.service';
import { logger } from '../config/logger';

const router = Router();

/**
 * Middleware para verificar assinatura do webhook do Shopify
 */
const verifyShopifyWebhook = (req: any, res: any, next: any) => {
  const signature = req.get('X-Shopify-Hmac-Sha256');
  const body = JSON.stringify(req.body);
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    logger.warn('Webhook signature ou secret não fornecido');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isValid = ShopifyRealService.verifyWebhook(body, signature, webhookSecret);

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
  const topic = req.get('X-Shopify-Topic');
  const shop = req.get('X-Shopify-Shop-Domain');
  
  logger.info('Webhook recebido do Shopify:', {
    topic,
    shop,
    timestamp: new Date().toISOString(),
  });

  next();
};

// Aplicar middlewares globais para webhooks
router.use(logWebhookReceived);
router.use(verifyShopifyWebhook);

/**
 * @route   POST /api/webhooks/shopify/orders/create
 * @desc    Handle new order created in Shopify
 * @access  Public (verified by webhook signature)
 */
router.post('/orders/create', ShopifyWebhooksController.handleOrderCreated);

/**
 * @route   POST /api/webhooks/shopify/orders/updated
 * @desc    Handle order updated in Shopify
 * @access  Public (verified by webhook signature)
 */
router.post('/orders/updated', ShopifyWebhooksController.handleOrderUpdated);

/**
 * @route   POST /api/webhooks/shopify/orders/paid
 * @desc    Handle order payment confirmed in Shopify
 * @access  Public (verified by webhook signature)
 */
router.post('/orders/paid', ShopifyWebhooksController.handleOrderPaid);

/**
 * @route   POST /api/webhooks/shopify/orders/cancelled
 * @desc    Handle order cancelled in Shopify
 * @access  Public (verified by webhook signature)
 */
router.post('/orders/cancelled', ShopifyWebhooksController.handleOrderCancelled);

/**
 * @route   POST /api/webhooks/shopify/orders/fulfilled
 * @desc    Handle order fulfilled in Shopify
 * @access  Public (verified by webhook signature)
 */
router.post('/orders/fulfilled', ShopifyWebhooksController.handleOrderFulfilled);

/**
 * @route   GET /api/webhooks/shopify/health
 * @desc    Health check endpoint for webhook URL validation
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Shopify Webhooks',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * @route   POST /api/webhooks/shopify/test
 * @desc    Test endpoint for webhook testing
 * @access  Public (in development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post('/test', (req, res) => {
    logger.info('Webhook de teste recebido:', req.body);
    res.status(200).json({
      success: true,
      message: 'Webhook de teste processado com sucesso',
      receivedData: req.body,
    });
  });
}

export default router;