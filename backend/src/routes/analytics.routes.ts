import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rate limiting para rotas de analytics (mais permissivo que outras rotas)
const analyticsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // 200 requests por IP por janela
  message: 'Muitas requisições de analytics, tente novamente em 15 minutos'
});

router.use(analyticsRateLimit);

/**
 * @route   GET /api/analytics/overview
 * @desc    Get dashboard overview statistics
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/overview',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  AnalyticsController.getOverviewStats
);

/**
 * @route   GET /api/analytics/recent-orders
 * @desc    Get recent orders for dashboard
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/recent-orders',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  AnalyticsController.getRecentOrders
);

/**
 * @route   GET /api/analytics/order-trends
 * @desc    Get order trends for charts
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/order-trends',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  AnalyticsController.getOrderTrends
);

/**
 * @route   GET /api/analytics/supplier-performance
 * @desc    Get supplier performance metrics
 * @access  Private (Manager, Admin)
 */
router.get(
  '/supplier-performance',
  authorize(['MANAGER', 'ADMIN']),
  AnalyticsController.getSupplierPerformance
);

/**
 * @route   GET /api/analytics/customer-insights
 * @desc    Get customer insights and analytics
 * @access  Private (Manager, Admin)
 */
router.get(
  '/customer-insights',
  authorize(['MANAGER', 'ADMIN']),
  AnalyticsController.getCustomerInsights
);

/**
 * @route   GET /api/analytics/geographic-distribution
 * @desc    Get geographic distribution of orders and customers
 * @access  Private (Manager, Admin)
 */
router.get(
  '/geographic-distribution',
  authorize(['MANAGER', 'ADMIN']),
  AnalyticsController.getGeographicDistribution
);

/**
 * @route   GET /api/analytics/conversion-metrics
 * @desc    Get conversion and performance metrics
 * @access  Private (Manager, Admin)
 */
router.get(
  '/conversion-metrics',
  authorize(['MANAGER', 'ADMIN']),
  AnalyticsController.getConversionMetrics
);

/**
 * @route   GET /api/analytics/alerts
 * @desc    Get alerts and notifications for dashboard
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/alerts',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  AnalyticsController.getAlerts
);

export default router;