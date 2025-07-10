import { Router } from 'express';
import {
    simpleGetEstatisticas,
    simpleGetPedidoById,
    simpleHealthCheck,
    simpleListPedidos
} from '../controllers/simple-pedido.controller';

const router = Router();

/**
 * Rotas simplificadas para teste dos pedidos
 */

// Health check
router.get('/health', simpleHealthCheck);

// Estatísticas
router.get('/stats', simpleGetEstatisticas);

// Listar pedidos
router.get('/', simpleListPedidos);

// Buscar pedido por ID
router.get('/:id', simpleGetPedidoById);

export default router;
