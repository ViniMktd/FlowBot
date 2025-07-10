import { Router } from 'express';
import { ShippingController } from '../controllers/shipping.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Rate limiting para rotas de frete
const shippingRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP por janela
  message: 'Muitas consultas de frete, tente novamente em 15 minutos'
});

router.use(shippingRateLimit);

/**
 * @route   POST /api/shipping/calculate
 * @desc    Calculate shipping costs for multiple services
 * @access  Public
 */
router.post('/calculate', ShippingController.calculateShipping);

/**
 * @route   GET /api/shipping/postal-code/:postalCode
 * @desc    Get postal code information
 * @access  Public
 */
router.get('/postal-code/:postalCode', ShippingController.getPostalCodeInfo);

/**
 * @route   GET /api/shipping/services
 * @desc    Get available shipping services
 * @access  Public
 */
router.get('/services', ShippingController.getShippingServices);

/**
 * @route   POST /api/shipping/validate-dimensions
 * @desc    Validate package dimensions and weight
 * @access  Public
 */
router.post('/validate-dimensions', ShippingController.validateDimensions);

// Rotas autenticadas
router.use(authenticate);

/**
 * @route   GET /api/shipping/track/:trackingCode
 * @desc    Track package by tracking code
 * @access  Private
 */
router.get('/track/:trackingCode', ShippingController.trackPackage);

/**
 * @route   POST /api/shipping/order/:orderId
 * @desc    Calculate shipping for specific order
 * @access  Private
 */
router.post(
  '/order/:orderId',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  ShippingController.calculateOrderShipping
);

/**
 * @route   POST /api/shipping/order/:orderId/dispatch
 * @desc    Dispatch order (automatically creates Shopify fulfillment + sends WhatsApp)
 * @access  Private (Supplier, Manager, Admin)
 */
router.post(
  '/order/:orderId/dispatch',
  authorize(['USER', 'MANAGER', 'ADMIN']), // USER = Supplier role
  ShippingController.dispatchOrder
);

/**
 * @route   POST /api/shipping/order/:orderId/tracking
 * @desc    Add tracking code to order
 * @access  Private (Manager, Admin)
 */
router.post(
  '/order/:orderId/tracking',
  authorize(['MANAGER', 'ADMIN']),
  ShippingController.createOrderTracking
);

export default router;