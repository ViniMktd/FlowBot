import { Router } from 'express';
import {
    cancelPedido,
    createPedido,
    getEstatisticas,
    getPedidoById,
    getPedidoByShopifyId,
    healthCheck,
    listPedidos,
    updatePedido
} from '../controllers/pedido.controller';

const router = Router();

/**
 * Rotas para gerenciamento de pedidos
 */

// Health check do serviço de pedidos
router.get('/health', healthCheck);

// Estatísticas de pedidos
router.get('/stats', getEstatisticas);

// Buscar pedido por ID do Shopify
router.get('/shopify/:shopifyOrderId', getPedidoByShopifyId);

// Listar pedidos com filtros e paginação
router.get('/', listPedidos);

// Buscar pedido por ID
router.get('/:id', getPedidoById);

// Criar novo pedido
router.post('/', createPedido);

// Atualizar pedido
router.put('/:id', updatePedido);

// Cancelar pedido
router.post('/:id/cancel', cancelPedido);

export default router;
