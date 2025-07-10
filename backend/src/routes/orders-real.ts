import { Router } from 'express';
import { OrderRealController } from '../controllers/order-real.controller';

const router = Router();
const orderController = new OrderRealController();

// Listar todos os pedidos
router.get('/', orderController.list);

// Buscar pedido por ID
router.get('/:id', orderController.findById);

// Criar novo pedido
router.post('/', orderController.create);

// Atualizar pedido
router.put('/:id', orderController.update);

// Cancelar pedido
router.post('/:id/cancel', orderController.cancel);

// Buscar pedidos por cliente
router.get('/customer/:customerId', orderController.findByCustomer);

export default router;
