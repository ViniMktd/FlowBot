import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { rateLimit } from '../middleware/rateLimit';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authenticate);

// Rate limiting para rotas de dashboard
const dashboardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // 300 requests por IP por janela (mais permissivo para dashboard)
  message: 'Muitas requisições ao dashboard, tente novamente em 15 minutos'
});

router.use(dashboardRateLimit);

/**
 * @route   GET /api/dashboard
 * @desc    Get complete dashboard data
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  DashboardController.getDashboardData
);

/**
 * @route   GET /api/dashboard/quick-stats
 * @desc    Get quick stats for widgets
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/quick-stats',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  DashboardController.getQuickStats
);

/**
 * @route   GET /api/dashboard/activity-feed
 * @desc    Get activity feed for dashboard
 * @access  Private (User, Manager, Admin)
 */
router.get(
  '/activity-feed',
  authorize(['USER', 'MANAGER', 'ADMIN']),
  DashboardController.getActivityFeed
);

/**
 * @route   GET /api/dashboard/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get(
  '/health',
  authorize(['ADMIN']),
  DashboardController.getSystemHealth
);

export default router;