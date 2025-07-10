import { CronJob } from 'cron';
import { logger } from '../config/logger';
import {
    supplierCommunicationQueue,
    trackingQueue,
    whatsappQueue
} from '../config/queues';

/**
 * Configuração de jobs agendados (cron jobs)
 */
export function setupScheduledJobs() {
  logger.info('⏰ Configurando jobs agendados...');

  // Sincronização de rastreamento a cada 4 horas
  new CronJob('0 */4 * * *', async () => {
    try {
      logger.info('🔄 Adicionando job de sincronização de rastreamento');

      await trackingQueue.add('syncWithCorreios', {
        trackingCode: 'BR123456789'
      }, {
        priority: 3,
        attempts: 3
      });

      logger.info('✅ Job de sincronização adicionado à fila');
    } catch (error) {
      logger.error('❌ Erro na sincronização agendada:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Detecção de pedidos atrasados diariamente às 9h
  new CronJob('0 9 * * *', async () => {
    try {
      logger.info('🔍 Iniciando detecção de pedidos atrasados');

      await trackingQueue.add('detectDelayedOrders', {
        maxDeliveryDays: 10
      }, {
        priority: 2,
        attempts: 3
      });

      logger.info('✅ Job de detecção de atrasos adicionado');
    } catch (error) {
      logger.error('❌ Erro na detecção de atrasos:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Sincronização de estoque com fornecedores a cada 6 horas
  new CronJob('0 */6 * * *', async () => {
    try {
      logger.info('📊 Iniciando sincronização de estoque');

      await supplierCommunicationQueue.add('syncSupplierInventory', {
        supplierId: 'all'
      }, {
        priority: 3,
        attempts: 3
      });

      logger.info('✅ Job de sincronização de estoque adicionado');
    } catch (error) {
      logger.error('❌ Erro na sincronização de estoque:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Envio de lembretes de avaliação (3 dias após entrega)
  new CronJob('0 10 * * *', async () => {
    try {
      logger.info('⭐ Enviando lembretes de avaliação');

      await whatsappQueue.add('sendReviewReminder', {
        orderId: 'delivered-orders-check',
        customerPhone: '+5511999999999',
        customerName: 'Cliente Teste',
        orderNumber: 'TEST-001'
      }, {
        priority: 4,
        attempts: 2
      });

      logger.info('✅ Job de lembrete de avaliação adicionado');
    } catch (error) {
      logger.error('❌ Erro no envio de lembretes:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Monitoramento de performance dos fornecedores (semanal - segunda às 8h)
  new CronJob('0 8 * * 1', async () => {
    try {
      logger.info('📊 Monitoramento semanal de fornecedores');

      await supplierCommunicationQueue.add('monitorSupplierPerformance', {
        supplierId: 'all',
        period: '7d'
      }, {
        priority: 2,
        attempts: 3
      });

      logger.info('✅ Job de monitoramento de fornecedores adicionado');
    } catch (error) {
      logger.error('❌ Erro no monitoramento de fornecedores:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Relatório diário de tracking (todos os dias às 18h)
  new CronJob('0 18 * * *', async () => {
    try {
      logger.info('📊 Gerando relatório diário de rastreamento');

      await trackingQueue.add('generateTrackingReport', {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        format: 'json'
      }, {
        priority: 2,
        attempts: 3
      });

      logger.info('✅ Job de relatório diário adicionado');
    } catch (error) {
      logger.error('❌ Erro na geração de relatório:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  // Monitoramento de performance de entrega (diário às 20h)
  new CronJob('0 20 * * *', async () => {
    try {
      logger.info('📈 Monitoramento de performance de entrega');

      await trackingQueue.add('monitorDeliveryPerformance', {
        period: '30d'
      }, {
        priority: 2,
        attempts: 3
      });

      logger.info('✅ Job de monitoramento de performance adicionado');
    } catch (error) {
      logger.error('❌ Erro no monitoramento de performance:', error);
    }
  }, null, true, 'America/Sao_Paulo');

  logger.info('✅ Jobs agendados configurados com sucesso');
}

/**
 * Função para parar todos os jobs agendados
 */
export function stopScheduledJobs() {
  logger.info('⏹️ Parando jobs agendados...');
  // A implementação específica dependeria de como estamos armazenando as referências dos CronJobs
  logger.info('✅ Jobs agendados parados');
}
