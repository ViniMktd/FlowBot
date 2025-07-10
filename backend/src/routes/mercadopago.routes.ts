import { Router } from 'express';
import { MercadoPagoController } from '../controllers/mercadopago.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rate limiting para rotas de pagamento
const paymentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 50, // 50 requests por IP por janela
  message: 'Muitas tentativas de pagamento, tente novamente em 15 minutos'
});

router.use(paymentRateLimit);

/**
 * @route   GET /api/payments/methods
 * @desc    Get available payment methods
 * @access  Public
 */
router.get('/methods', MercadoPagoController.getPaymentMethods);

/**
 * @route   POST /api/payments/pix
 * @desc    Create PIX payment
 * @access  Private
 */
router.post(
  '/pix',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  MercadoPagoController.createPIXPayment
);

/**
 * @route   POST /api/payments/card
 * @desc    Create card payment
 * @access  Private
 */
router.post(
  '/card',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  MercadoPagoController.createCardPayment
);

/**
 * @route   POST /api/payments/checkout
 * @desc    Create checkout preference (Checkout Pro)
 * @access  Private
 */
router.post(
  '/checkout',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  MercadoPagoController.createCheckoutPreference
);

/**
 * @route   GET /api/payments/:paymentId
 * @desc    Get payment status
 * @access  Private
 */
router.get(
  '/:paymentId',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  MercadoPagoController.getPaymentStatus
);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payments by order ID
 * @access  Private
 */
router.get(
  '/order/:orderId',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  MercadoPagoController.getPaymentsByOrder
);

/**
 * @route   PUT /api/payments/:paymentId/cancel
 * @desc    Cancel payment
 * @access  Private (Manager, Admin)
 */
router.put(
  '/:paymentId/cancel',
  authorize(['MANAGER', 'ADMIN']),
  MercadoPagoController.cancelPayment
);

/**
 * @route   POST /api/payments/:paymentId/refund
 * @desc    Refund payment
 * @access  Private (Manager, Admin)
 */
router.post(
  '/:paymentId/refund',
  authorize(['MANAGER', 'ADMIN']),
  MercadoPagoController.refundPayment
);

export default router;