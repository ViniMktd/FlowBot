import { Router } from 'express';
import { ShopifyConfigController } from '../controllers/shopify-config.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rate limiting para rotas de configuração do Shopify
const shopifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP por janela
  message: 'Muitas requisições ao Shopify, tente novamente em 15 minutos'
});

router.use(shopifyRateLimit);

/**
 * @route   GET /api/shopify/status
 * @desc    Get current Shopify configuration status
 * @access  Private (Manager, Admin)
 */
router.get(
  '/status',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.getStatus
);

/**
 * @route   GET /api/shopify/test-connection
 * @desc    Test connection with Shopify API
 * @access  Private (Admin)
 */
router.get(
  '/test-connection',
  authorize(['ADMIN']),
  ShopifyConfigController.testConnection
);

/**
 * @route   POST /api/shopify/setup-webhooks
 * @desc    Setup required webhooks in Shopify
 * @access  Private (Admin)
 */
router.post(
  '/setup-webhooks',
  authorize(['ADMIN']),
  ShopifyConfigController.setupWebhooks
);

/**
 * @route   GET /api/shopify/orders
 * @desc    Get orders from Shopify
 * @access  Private (Manager, Admin)
 */
router.get(
  '/orders',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.getOrders
);

/**
 * @route   GET /api/shopify/orders/:orderId
 * @desc    Get specific order from Shopify
 * @access  Private (Manager, Admin)
 */
router.get(
  '/orders/:orderId',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.getOrder
);

/**
 * @route   POST /api/shopify/orders/:orderId/sync
 * @desc    Sync specific order from Shopify to local database
 * @access  Private (Manager, Admin)
 */
router.post(
  '/orders/:orderId/sync',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.syncOrder
);

/**
 * @route   POST /api/shopify/orders/:orderId/fulfill
 * @desc    Create fulfillment for order in Shopify
 * @access  Private (Manager, Admin)
 */
router.post(
  '/orders/:orderId/fulfill',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.fulfillOrder
);

/**
 * @route   GET /api/shopify/products
 * @desc    Get products from Shopify
 * @access  Private (Manager, Admin)
 */
router.get(
  '/products',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.getProducts
);

/**
 * @route   GET /api/shopify/customers
 * @desc    Get customers from Shopify
 * @access  Private (Manager, Admin)
 */
router.get(
  '/customers',
  authorize(['MANAGER', 'ADMIN']),
  ShopifyConfigController.getCustomers
);

export default router;