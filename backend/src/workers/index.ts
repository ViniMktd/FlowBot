import { Job } from 'bull';
import { logger } from '../config/logger';
import {
    notificationQueue,
    orderProcessingQueue,
    supplierCommunicationQueue,
    trackingQueue,
    whatsappQueue
} from '../config/queues';

// Importar workers
import { notificationWorker } from './notification.worker';
import { orderWorker } from './order.worker';
import { supplierWorker } from './supplier.worker';
import { trackingWorker } from './tracking.worker';
import { whatsappWorker } from './whatsapp.worker';

/**
 * Registra todos os workers para processar as filas
 */
export function registerWorkers() {
  logger.info('🔄 Registrando workers...');

  // Worker de processamento de pedidos
  orderProcessingQueue.process('processNewOrder', 5, async (job: Job) => {
    return await orderWorker.processNewOrder(job);
  });

  orderProcessingQueue.process('assignSupplier', 10, async (job: Job) => {
    return await orderWorker.assignSupplier(job);
  });

  orderProcessingQueue.process('updateOrderStatus', 10, async (job: Job) => {
    return await orderWorker.updateOrderStatus(job);
  });

  orderProcessingQueue.process('syncInventory', 3, async (job: Job) => {
    return await orderWorker.syncInventory(job);
  });

  // Worker de comunicação com fornecedores
  supplierCommunicationQueue.process('sendOrderToSupplier', 5, async (job: Job) => {
    return await supplierWorker.sendOrderToSupplier(job);
  });

  supplierCommunicationQueue.process('processSupplierConfirmation', 10, async (job: Job) => {
    return await supplierWorker.processSupplierConfirmation(job);
  });

  supplierCommunicationQueue.process('syncSupplierInventory', 3, async (job: Job) => {
    return await supplierWorker.syncSupplierInventory(job);
  });

  supplierCommunicationQueue.process('processTrackingUpdate', 10, async (job: Job) => {
    return await supplierWorker.processTrackingUpdate(job);
  });

  supplierCommunicationQueue.process('processProductPhotos', 5, async (job: Job) => {
    return await supplierWorker.processProductPhotos(job);
  });

  supplierCommunicationQueue.process('monitorSupplierPerformance', 2, async (job: Job) => {
    return await supplierWorker.monitorSupplierPerformance(job);
  });

  supplierCommunicationQueue.process('processProductReturn', 5, async (job: Job) => {
    return await supplierWorker.processProductReturn(job);
  });

  // Worker de WhatsApp
  whatsappQueue.process('sendOrderConfirmation', 10, async (job: Job) => {
    return await whatsappWorker.sendOrderConfirmation(job);
  });

  whatsappQueue.process('sendShippingNotification', 10, async (job: Job) => {
    return await whatsappWorker.sendShippingNotification(job);
  });

  whatsappQueue.process('sendDeliveryNotification', 10, async (job: Job) => {
    return await whatsappWorker.sendDeliveryNotification(job);
  });

  whatsappQueue.process('sendCancellationNotification', 10, async (job: Job) => {
    return await whatsappWorker.sendCancellationNotification(job);
  });

  whatsappQueue.process('sendReviewReminder', 5, async (job: Job) => {
    return await whatsappWorker.sendReviewReminder(job);
  });

  whatsappQueue.process('sendCustomMessage', 10, async (job: Job) => {
    return await whatsappWorker.sendCustomMessage(job);
  });

  whatsappQueue.process('processIncomingMessage', 10, async (job: Job) => {
    return await whatsappWorker.processIncomingMessage(job);
  });

  // Worker de rastreamento
  trackingQueue.process('updateOrderTracking', 10, async (job: Job) => {
    return await trackingWorker.updateOrderTracking(job);
  });

  trackingQueue.process('syncWithCorreios', 5, async (job: Job) => {
    return await trackingWorker.syncWithCorreios(job);
  });

  trackingQueue.process('detectDelayedOrders', 2, async (job: Job) => {
    return await trackingWorker.detectDelayedOrders(job);
  });

  trackingQueue.process('generateTrackingReport', 2, async (job: Job) => {
    return await trackingWorker.generateTrackingReport(job);
  });

  trackingQueue.process('monitorDeliveryPerformance', 2, async (job: Job) => {
    return await trackingWorker.monitorDeliveryPerformance(job);
  });

  // Worker de notificações
  notificationQueue.process('sendPushNotification', 10, async (job: Job) => {
    return await notificationWorker.sendPushNotification(job);
  });

  notificationQueue.process('sendEmailNotification', 10, async (job: Job) => {
    return await notificationWorker.sendEmailNotification(job);
  });

  notificationQueue.process('sendSMSNotification', 10, async (job: Job) => {
    return await notificationWorker.sendSMSNotification(job);
  });

  notificationQueue.process('processScheduledNotification', 10, async (job: Job) => {
    return await notificationWorker.processScheduledNotification(job);
  });

  notificationQueue.process('processBatchNotification', 3, async (job: Job) => {
    return await notificationWorker.processBatchNotification(job);
  });

  notificationQueue.process('cleanupOldNotifications', 1, async (job: Job) => {
    return await notificationWorker.cleanupOldNotifications(job);
  });

  // Configurar listeners de eventos globais
  setupGlobalListeners();

  logger.info('✅ Workers registrados com sucesso!');
}

/**
 * Configurar listeners de eventos globais para todas as filas
 */
function setupGlobalListeners() {
  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    whatsappQueue,
    trackingQueue,
    notificationQueue
  ];

  queues.forEach(queue => {
    // Job iniciado
    queue.on('active', (job: Job) => {
      logger.info(`🔄 Job iniciado: ${job.id} (${job.name})`, {
        queue: queue.name,
        jobId: job.id,
        jobName: job.name,
        data: job.data
      });
    });

    // Job concluído
    queue.on('completed', (job: Job, result: any) => {
      logger.info(`✅ Job concluído: ${job.id} (${job.name})`, {
        queue: queue.name,
        jobId: job.id,
        jobName: job.name,
        result,
        duration: Date.now() - job.processedOn!
      });
    });

    // Job falhado
    queue.on('failed', (job: Job, err: Error) => {
      logger.error(`❌ Job falhado: ${job.id} (${job.name})`, {
        queue: queue.name,
        jobId: job.id,
        jobName: job.name,
        error: err.message,
        stack: err.stack,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts || 3
      });
    });

    // Job pausado
    queue.on('paused', () => {
      logger.warn(`⏸️ Fila pausada: ${queue.name}`);
    });

    // Job despausado
    queue.on('resumed', () => {
      logger.info(`▶️ Fila resumida: ${queue.name}`);
    });

    // Job removido
    queue.on('removed', (job: Job) => {
      logger.info(`🗑️ Job removido: ${job.id} (${job.name})`, {
        queue: queue.name,
        jobId: job.id,
        jobName: job.name
      });
    });

    // Job com progresso
    queue.on('progress', (job: Job, progress: number) => {
      logger.debug(`📊 Progresso do job: ${job.id} (${job.name}) - ${progress}%`, {
        queue: queue.name,
        jobId: job.id,
        jobName: job.name,
        progress
      });
    });

    // Job em espera
    queue.on('waiting', (jobId: string) => {
      logger.debug(`⏳ Job aguardando: ${jobId}`, {
        queue: queue.name,
        jobId
      });
    });

    // Job em espera (prioridade)
    queue.on('delayed', (jobId: string, delay: number) => {
      logger.debug(`⏰ Job atrasado: ${jobId} por ${delay}ms`, {
        queue: queue.name,
        jobId,
        delay
      });
    });

    // Erro na fila
    queue.on('error', (error: Error) => {
      logger.error(`🚨 Erro na fila: ${queue.name}`, {
        queue: queue.name,
        error: error.message,
        stack: error.stack
      });
    });
  });
}

/**
 * Função para graceful shutdown dos workers
 */
export async function shutdownWorkers() {
  logger.info('🛑 Iniciando shutdown dos workers...');

  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    whatsappQueue,
    trackingQueue,
    notificationQueue
  ];

  // Pausar todas as filas
  await Promise.all(queues.map(queue => queue.pause()));

  // Esperar jobs ativos terminarem
  await Promise.all(queues.map(queue => queue.whenCurrentJobsFinished()));

  // Fechar conexões
  await Promise.all(queues.map(queue => queue.close()));

  logger.info('✅ Workers desligados com sucesso!');
}

/**
 * Obter estatísticas das filas
 */
export async function getQueueStats() {
  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    whatsappQueue,
    trackingQueue,
    notificationQueue
  ];

  const stats = await Promise.all(
    queues.map(async queue => {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.isPaused()
      ]);

      return {
        name: queue.name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused
      };
    })
  );

  return stats;
}
