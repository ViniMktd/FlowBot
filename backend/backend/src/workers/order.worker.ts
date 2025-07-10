import { Job } from 'bull';
import { logger } from '../config/logger';

/**
 * Worker para processamento de pedidos em background
 */
export class OrderWorker {
  /**
   * Processar novo pedido recebido do Shopify
   */
  async processNewOrder(job: Job): Promise<void> {
    const { orderId, shopifyOrderData } = job.data;
    
    try {
      logger.info(`🔄 Iniciando processamento do pedido: ${orderId}`, {
        jobId: job.id,
        orderId,
        shopifyOrderId: shopifyOrderData?.id
      });

      // 1. Validar dados do pedido
      await this.validateOrderData(shopifyOrderData);

      // 2. Simular criação do pedido
      await this.simulateOrderCreation(orderId);

      // 3. Simular atribuição de fornecedor
      await this.simulateSupplierAssignment(orderId);

      // 4. Simular envio de confirmação
      await this.simulateOrderConfirmation(orderId);

      // 5. Atualizar progresso
      await job.progress(100);

      logger.info(`✅ Pedido processado com sucesso: ${orderId}`, {
        jobId: job.id,
        processingTime: Date.now() - (job.processedOn || Date.now())
      });

    } catch (error) {
      logger.error(`❌ Erro ao processar pedido: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Atribuir fornecedor ao pedido
   */
  async assignSupplier(job: Job): Promise<void> {
    const { orderId } = job.data;

    try {
      logger.info(`🏪 Atribuindo fornecedor ao pedido: ${orderId}`, {
        jobId: job.id
      });

      // Simular busca de fornecedores
      await this.delay(2000);

      logger.info(`✅ Fornecedor atribuído com sucesso`, {
        orderId
      });

    } catch (error) {
      logger.error(`❌ Erro ao atribuir fornecedor: ${orderId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async validateOrderData(shopifyData: any): Promise<void> {
    if (!shopifyData || !shopifyData.id) {
      throw new Error('Dados do pedido Shopify inválidos');
    }
    logger.info('✅ Dados do pedido validados');
  }

  private async simulateOrderCreation(orderId: string): Promise<void> {
    await this.delay(1500);
    logger.info(`🆕 Pedido criado no sistema: ${orderId}`);
  }

  private async simulateSupplierAssignment(orderId: string): Promise<void> {
    await this.delay(1000);
    logger.info(`🏪 Fornecedor atribuído ao pedido: ${orderId}`);
  }

  private async simulateOrderConfirmation(orderId: string): Promise<void> {
    await this.delay(800);
    logger.info(`📱 Confirmação enviada via WhatsApp: ${orderId}`);
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const orderWorker = new OrderWorker();
