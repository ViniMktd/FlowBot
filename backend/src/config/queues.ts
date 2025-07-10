import Bull from 'bull';
import { logger } from './logger';

// Configurações das filas
const QUEUE_CONFIG = {
  redis: {
    host: process.env['REDIS_HOST'] || 'localhost',
    port: parseInt(process.env['REDIS_PORT'] || '6379'),
    password: process.env['REDIS_PASSWORD'] || undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};

// Definição das filas
export const orderProcessingQueue = new Bull('order-processing', QUEUE_CONFIG);
export const supplierCommunicationQueue = new Bull('supplier-communication', QUEUE_CONFIG);
export const notificationQueue = new Bull('notification', QUEUE_CONFIG);
export const whatsappQueue = new Bull('whatsapp', QUEUE_CONFIG);
export const emailQueue = new Bull('email', QUEUE_CONFIG);
export const trackingQueue = new Bull('tracking', QUEUE_CONFIG);

// Tipos de jobs
export enum JobType {
  // Processamento de pedidos
  PROCESS_ORDER = 'process-order',
  ROUTE_ORDER = 'route-order',
  UPDATE_ORDER_STATUS = 'update-order-status',
  CANCEL_ORDER = 'cancel-order',
  
  // Comunicação com fornecedores
  SEND_ORDER_TO_SUPPLIER = 'send-order-to-supplier',
  REQUEST_TRACKING = 'request-tracking',
  UPLOAD_PRODUCT_PHOTOS = 'upload-product-photos',
  CONFIRM_SUPPLIER_RECEIPT = 'confirm-supplier-receipt',
  
  // Notificações
  SEND_WHATSAPP_MESSAGE = 'send-whatsapp-message',
  SEND_EMAIL = 'send-email',
  NOTIFY_CUSTOMER = 'notify-customer',
  NOTIFY_SUPPLIER = 'notify-supplier',
  
  // Tracking
  UPDATE_TRACKING_STATUS = 'update-tracking-status',
  FETCH_TRACKING_UPDATES = 'fetch-tracking-updates',
}

// Interfaces para dados dos jobs
export interface OrderProcessingJobData {
  orderId: string;
  shopifyOrderId: string;
  customerId: string;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

export interface SupplierCommunicationJobData {
  orderId: string;
  supplierId: string;
  action: 'send_order' | 'request_tracking' | 'upload_photos' | 'confirm_receipt';
  data: Record<string, any>;
  retryCount?: number;
}

export interface NotificationJobData {
  type: 'whatsapp' | 'email' | 'sms';
  recipient: string;
  message: string;
  templateId?: string;
  variables?: Record<string, any>;
  orderId?: string;
}

export interface TrackingJobData {
  orderId: string;
  trackingCode: string;
  carrier: string;
  lastStatus?: string;
}

// Configuração de prioridades
export const JobPriority = {
  CRITICAL: 10,
  HIGH: 5,
  NORMAL: 0,
  LOW: -5,
};

// Configurações específicas por tipo de job
export const jobConfigs = {
  [JobType.PROCESS_ORDER]: {
    priority: JobPriority.HIGH,
    delay: 0,
    attempts: 5,
  },
  [JobType.SEND_ORDER_TO_SUPPLIER]: {
    priority: JobPriority.HIGH,
    delay: 1000, // 1 segundo
    attempts: 3,
  },
  [JobType.SEND_WHATSAPP_MESSAGE]: {
    priority: JobPriority.NORMAL,
    delay: 5000, // 5 segundos
    attempts: 2,
  },
  [JobType.UPDATE_TRACKING_STATUS]: {
    priority: JobPriority.NORMAL,
    delay: 0,
    attempts: 3,
  },
};

// Função para adicionar job à fila
export const addJob = async (
  queue: Bull.Queue,
  type: JobType,
  data: any,
  options?: Bull.JobOptions
) => {
  const config = (jobConfigs as any)[type] || {};
  const jobOptions = {
    ...config,
    ...options,
  };

  try {
    const job = await queue.add(type, data, jobOptions);
    logger.info('Job adicionado à fila', {
      jobId: job.id,
      type,
      queue: queue.name,
      data: JSON.stringify(data),
      options: jobOptions,
    });
    return job;
  } catch (error) {
    logger.error('Erro ao adicionar job à fila', {
      type,
      queue: queue.name,
      error: error instanceof Error ? error.message : String(error),
      data: JSON.stringify(data),
    });
    throw error;
  }
};

// Monitoramento das filas
export const setupQueueMonitoring = () => {
  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    notificationQueue,
    whatsappQueue,
    emailQueue,
    trackingQueue,
  ];

  queues.forEach(queue => {
    queue.on('completed', (job, result) => {
      logger.info('Job completado', {
        jobId: job.id,
        type: job.name,
        queue: queue.name,
        duration: Date.now() - job.timestamp,
        result: typeof result === 'string' ? result : JSON.stringify(result),
      });
    });

    queue.on('failed', (job, err) => {
      logger.error('Job falhou', {
        jobId: job.id,
        type: job.name,
        queue: queue.name,
        error: err.message,
        attemptsMade: job.attemptsMade,
        data: JSON.stringify(job.data),
      });
    });

    queue.on('stalled', (job) => {
      logger.warn('Job travado', {
        jobId: job.id,
        type: job.name,
        queue: queue.name,
      });
    });

    queue.on('progress', (job, progress) => {
      logger.debug('Progresso do job', {
        jobId: job.id,
        type: job.name,
        queue: queue.name,
        progress,
      });
    });
  });
};

// Função para limpar filas antigas
export const cleanOldJobs = async () => {
  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    notificationQueue,
    whatsappQueue,
    emailQueue,
    trackingQueue,
  ];

  for (const queue of queues) {
    try {
      await queue.clean(24 * 60 * 60 * 1000, 'completed'); // 24 horas
      await queue.clean(7 * 24 * 60 * 60 * 1000, 'failed'); // 7 dias
      logger.info('Limpeza de jobs antiga realizada', { queue: queue.name });
    } catch (error) {
      logger.error('Erro na limpeza de jobs', {
        queue: queue.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

// Função para obter estatísticas das filas
export const getQueueStats = async () => {
  const queues = [
    { name: 'order-processing', queue: orderProcessingQueue },
    { name: 'supplier-communication', queue: supplierCommunicationQueue },
    { name: 'notification', queue: notificationQueue },
    { name: 'whatsapp', queue: whatsappQueue },
    { name: 'email', queue: emailQueue },
    { name: 'tracking', queue: trackingQueue },
  ];

  const stats = [];

  for (const { name, queue } of queues) {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
      ]);

      stats.push({
        name,
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas da fila', {
        queue: name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return stats;
};

// Inicialização das filas
export const initializeQueues = async () => {
  logger.info('Inicializando sistema de filas...');
  
  try {
    // Configurar monitoramento
    setupQueueMonitoring();
    
    // Agendar limpeza de jobs antigos (a cada 6 horas)
    setInterval(cleanOldJobs, 6 * 60 * 60 * 1000);
    
    logger.info('Sistema de filas inicializado com sucesso');
    
    return {
      orderProcessingQueue,
      supplierCommunicationQueue,
      notificationQueue,
      whatsappQueue,
      emailQueue,
      trackingQueue,
    };
  } catch (error) {
    logger.error('Erro ao inicializar sistema de filas', error);
    throw error;
  }
};

// Graceful shutdown
export const closeQueues = async () => {
  logger.info('Fechando filas...');
  
  const queues = [
    orderProcessingQueue,
    supplierCommunicationQueue,
    notificationQueue,
    whatsappQueue,
    emailQueue,
    trackingQueue,
  ];

  await Promise.all(queues.map(queue => queue.close()));
  logger.info('Filas fechadas com sucesso');
};
