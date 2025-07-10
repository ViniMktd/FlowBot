import { Router } from 'express';
import { logger } from '../config/logger';
import {
    notificationQueue,
    orderProcessingQueue,
    supplierCommunicationQueue,
    trackingQueue,
    whatsappQueue
} from '../config/queues';

const router = Router();

/**
 * Obter estatísticas básicas das filas
 */
router.get('/queues', async (_req, res) => {
  try {
    const queueStats = {
      orderProcessing: await getQueueBasicStats(orderProcessingQueue),
      supplierCommunication: await getQueueBasicStats(supplierCommunicationQueue),
      whatsapp: await getQueueBasicStats(whatsappQueue),
      tracking: await getQueueBasicStats(trackingQueue),
      notification: await getQueueBasicStats(notificationQueue)
    };

    res.json({
      success: true,
      data: {
        queues: queueStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas das filas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter estatísticas das filas'
    });
  }
});

/**
 * Adicionar job de teste para processamento de pedido
 */
router.post('/test/process-order', async (req, res) => {
  try {
    const { orderId = 'test-order-123', priority = 1 } = req.body;

    const job = await orderProcessingQueue.add('processNewOrder', {
      orderId,
      shopifyOrderData: {
        id: orderId,
        customer: {
          phone: '+5511999999999',
          name: 'Cliente Teste'
        },
        line_items: [
          {
            product_id: 'test-product-1',
            quantity: 2,
            price: '29.99'
          }
        ],
        shipping_address: {
          zip: '01234-567',
          address1: 'Rua Teste, 123',
          city: 'São Paulo',
          province_code: 'SP',
          country_code: 'BR'
        }
      }
    }, {
      priority,
      attempts: 3
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        orderId,
        status: 'Job adicionado à fila'
      }
    });

  } catch (error) {
    logger.error('Erro ao adicionar job de teste:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar job de teste'
    });
  }
});

/**
 * Adicionar job de teste para envio de WhatsApp
 */
router.post('/test/send-whatsapp', async (req, res) => {
  try {
    const {
      phone = '+5511999999999',
      customerName = 'Cliente Teste',
      orderNumber = 'TEST-001',
      type = 'sendOrderConfirmation'
    } = req.body;

    const job = await whatsappQueue.add(type, {
      orderId: 'test-order-123',
      customerPhone: phone,
      customerName,
      orderNumber
    }, {
      priority: 2,
      attempts: 3
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        phone,
        type,
        status: 'Job de WhatsApp adicionado à fila'
      }
    });

  } catch (error) {
    logger.error('Erro ao adicionar job de WhatsApp:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar job de WhatsApp'
    });
  }
});

/**
 * Adicionar job de teste para comunicação com fornecedor
 */
router.post('/test/supplier-communication', async (req, res) => {
  try {
    const {
      orderId = 'test-order-123',
      supplierId = 'supplier-001',
      type = 'sendOrderToSupplier'
    } = req.body;

    const job = await supplierCommunicationQueue.add(type, {
      orderId,
      supplierId,
      orderData: {
        orderNumber: 'TEST-001',
        items: [
          {
            product: 'Produto Teste',
            quantity: 2,
            price: 29.99
          }
        ],
        customer: {
          name: 'Cliente Teste',
          phone: '+5511999999999',
          address: 'Rua Teste, 123 - São Paulo/SP'
        }
      }
    }, {
      priority: 2,
      attempts: 3
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        orderId,
        supplierId,
        type,
        status: 'Job de comunicação com fornecedor adicionado à fila'
      }
    });

  } catch (error) {
    logger.error('Erro ao adicionar job de fornecedor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar job de fornecedor'
    });
  }
});

/**
 * Adicionar job de teste para rastreamento
 */
router.post('/test/tracking', async (req, res) => {
  try {
    const {
      orderId = 'test-order-123',
      trackingCode = 'BR123456789',
      type = 'updateOrderTracking'
    } = req.body;

    const job = await trackingQueue.add(type, {
      orderId,
      trackingCode,
      status: 'EM_TRANSITO',
      location: 'São Paulo/SP'
    }, {
      priority: 2,
      attempts: 3
    });

    res.json({
      success: true,
      data: {
        jobId: job.id,
        orderId,
        trackingCode,
        type,
        status: 'Job de rastreamento adicionado à fila'
      }
    });

  } catch (error) {
    logger.error('Erro ao adicionar job de rastreamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar job de rastreamento'
    });
  }
});

/**
 * Limpar todas as filas (apenas para desenvolvimento)
 */
router.post('/dev/clean-all', async (_req, res) => {
  try {
    await Promise.all([
      orderProcessingQueue.clean(0, 'completed'),
      orderProcessingQueue.clean(0, 'failed'),
      supplierCommunicationQueue.clean(0, 'completed'),
      supplierCommunicationQueue.clean(0, 'failed'),
      whatsappQueue.clean(0, 'completed'),
      whatsappQueue.clean(0, 'failed'),
      trackingQueue.clean(0, 'completed'),
      trackingQueue.clean(0, 'failed'),
      notificationQueue.clean(0, 'completed'),
      notificationQueue.clean(0, 'failed')
    ]);

    res.json({
      success: true,
      message: 'Todas as filas foram limpas'
    });

  } catch (error) {
    logger.error('Erro ao limpar filas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao limpar filas'
    });
  }
});

/* ==========================================
   FUNÇÕES AUXILIARES
   ========================================== */

async function getQueueBasicStats(queue: any) {
  try {
    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      name: queue.name,
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  } catch (error) {
    logger.error(`Erro ao obter stats da fila ${queue.name}:`, error);
    return {
      name: queue.name,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
      error: 'Erro ao obter estatísticas'
    };
  }
}

export default router;
