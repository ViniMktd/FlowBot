import { Router } from 'express';
import { OrderController } from '../controllers/order.controller';
import { authentication } from '../middleware/auth';

const router = Router();
const orderController = new OrderController();

/**
 * Rotas para gerenciamento de pedidos
 */

// Estatísticas (deve vir antes das rotas com :id)
router.get('/stats',
  authentication,
  orderController.getOrderStats.bind(orderController)
);

// CRUD básico
router.post('/',
  authentication,
  orderController.createOrder.bind(orderController)
);

router.get('/',
  authentication,
  orderController.getOrders.bind(orderController)
);

router.get('/:id',
  authentication,
  orderController.getOrderById.bind(orderController)
);

router.put('/:id',
  authentication,
  orderController.updateOrder.bind(orderController)
);

// Operações especiais
router.post('/:id/cancel',
  authentication,
  orderController.cancelOrder.bind(orderController)
);

router.post('/:id/tracking',
  authentication,
  orderController.setTrackingCode.bind(orderController)
);

router.post('/:id/resend-notification',
  authentication,
  orderController.resendNotification.bind(orderController)
);

export default router;
