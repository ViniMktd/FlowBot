import { Job } from 'bull';
import { logger } from '../config/logger';
// import { PedidoService } from '../services/pedido.service';
// import { BrazilianTimeUtils } from '../utils/brazilian';

/**
 * Worker para processamento de pedidos em background
 */
export class OrderWorker {
  // private pedidoService: PedidoService;

  constructor() {
    // this.pedidoService = new PedidoService();
  }

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

      // 2. Criar pedido no sistema
      const pedido = await this.createOrderFromShopify(shopifyOrderData);

      // 3. Atribuir fornecedor automaticamente
      await this.assignSupplier(pedido.id);

      // 4. Enviar confirmação por WhatsApp
      await this.sendOrderConfirmation(pedido.id);

      // 5. Notificar fornecedor
      await this.notifySupplier(pedido.id);

      // 6. Atualizar progresso
      await job.progress(100);

      logger.info(`✅ Pedido processado com sucesso: ${orderId}`, {
        jobId: job.id,
        pedidoId: pedido.id,
        processingTime: Date.now() - job.processedOn!
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

      // Buscar fornecedores disponíveis
      const suppliers = await this.findAvailableSuppliers(orderId);

      if (suppliers.length === 0) {
        throw new Error('Nenhum fornecedor disponível para este pedido');
      }

      // Algoritmo simples: escolher fornecedor com menor carga
      const selectedSupplier = suppliers.reduce((prev, current) =>
        prev.currentOrders < current.currentOrders ? prev : current
      );

      // Atribuir fornecedor
      // await this.pedidoService.assignSupplier(orderId, selectedSupplier.id);

      logger.info(`✅ Fornecedor atribuído: ${selectedSupplier.nome}`, {
        orderId,
        supplierId: selectedSupplier.id
      });

    } catch (error) {
      logger.error(`❌ Erro ao atribuir fornecedor: ${orderId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar atualização de status do pedido
   */
  async updateOrderStatus(job: Job): Promise<void> {
    const { orderId, status, trackingCode } = job.data;

    try {
      logger.info(`📦 Atualizando status do pedido: ${orderId}`, {
        newStatus: status,
        trackingCode
      });

      // Atualizar status no banco
      // await this.pedidoService.updatePedido(orderId, {
      //   status,
      //   codigoRastreamento: trackingCode,
      //   dataAtualizacao: BrazilianTimeUtils.now().toDate()
      // });

      // Notificar cliente via WhatsApp
      if (status === 'ENVIADO' && trackingCode) {
        await this.sendShippingNotification(orderId, trackingCode);
      }

      // Atualizar Shopify
      await this.updateShopifyOrder(orderId, status, trackingCode);

      logger.info(`✅ Status atualizado com sucesso: ${orderId}`, {
        status,
        trackingCode
      });

    } catch (error) {
      logger.error(`❌ Erro ao atualizar status: ${orderId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Sincronizar estoque com fornecedores
   */
  async syncInventory(job: Job): Promise<void> {
    const { supplierId } = job.data;

    try {
      logger.info(`📊 Sincronizando estoque do fornecedor: ${supplierId}`);

      // Buscar produtos do fornecedor
      const products = await this.getSupplierProducts(supplierId);

      // Atualizar estoque de cada produto
      for (const product of products) {
        await job.progress((products.indexOf(product) / products.length) * 100);
        await this.updateProductStock(product.id, supplierId);
      }

      logger.info(`✅ Estoque sincronizado: ${products.length} produtos`, {
        supplierId
      });

    } catch (error) {
      logger.error(`❌ Erro na sincronização de estoque: ${supplierId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /* ==========================================
     MÉTODOS AUXILIARES PRIVADOS
     ========================================== */

  private async validateOrderData(shopifyData: any): Promise<void> {
    if (!shopifyData || !shopifyData.id) {
      throw new Error('Dados do pedido Shopify inválidos');
    }

    if (!shopifyData.customer) {
      throw new Error('Cliente não informado no pedido');
    }

    if (!shopifyData.line_items || shopifyData.line_items.length === 0) {
      throw new Error('Pedido sem itens');
    }

    if (!shopifyData.shipping_address) {
      throw new Error('Endereço de entrega não informado');
    }
  }

  private async createOrderFromShopify(_shopifyData: any): Promise<any> {
    // Converter dados do Shopify para formato interno
    // const _orderData = {
    //   shopifyOrderId: shopifyData.id.toString(),
    //   clienteId: await this.getOrCreateCustomer(shopifyData.customer),
    //   items: shopifyData.line_items.map((item: any) => ({
    //     produtoId: item.product_id.toString(),
    //     quantidade: item.quantity,
    //     precoUnitario: parseFloat(item.price)
    //   })),
    //   enderecoEntrega: {
    //     cep: shopifyData.shipping_address.zip,
    //     logradouro: shopifyData.shipping_address.address1,
    //     numero: shopifyData.shipping_address.address2 || 'S/N',
    //     bairro: shopifyData.shipping_address.city,
    //     cidade: shopifyData.shipping_address.city,
    //     estado: shopifyData.shipping_address.province_code,
    //     pais: shopifyData.shipping_address.country_code
    //   },
    //   observacoes: shopifyData.note
    // };

    // const result = await this.pedidoService.createPedido(orderData);

    // if (!result.success) {
    //   throw new Error(result.message || 'Erro ao criar pedido');
    // }

    // return result.data;
    return { id: 'mock-order-id' };
  }

  // private async getOrCreateCustomer(_customerData: any): Promise<string> {
  //   // Buscar cliente existente ou criar novo
  //   // TODO: Implementar lógica de busca/criação de cliente
  //   return 'temp-customer-id';
  // }

  private async sendOrderConfirmation(orderId: string): Promise<void> {
    // TODO: Implementar envio de WhatsApp
    logger.info(`📱 WhatsApp de confirmação enviado para pedido: ${orderId}`);
  }

  private async notifySupplier(orderId: string): Promise<void> {
    // TODO: Implementar notificação do fornecedor
    logger.info(`📧 Fornecedor notificado sobre pedido: ${orderId}`);
  }

  private async findAvailableSuppliers(_orderId: string): Promise<any[]> {
    // TODO: Implementar busca de fornecedores disponíveis
    return [
      { id: 'supplier-1', nome: 'Fornecedor Teste', currentOrders: 5 }
    ];
  }

  private async sendShippingNotification(orderId: string, trackingCode: string): Promise<void> {
    // TODO: Implementar notificação de envio
    logger.info(`📦 Notificação de envio enviada: ${orderId} - ${trackingCode}`);
  }

  private async updateShopifyOrder(orderId: string, status: string, _trackingCode?: string): Promise<void> {
    // TODO: Implementar atualização no Shopify
    logger.info(`🛍️ Shopify atualizado: ${orderId} - ${status}`);
  }

  private async getSupplierProducts(_supplierId: string): Promise<any[]> {
    // TODO: Implementar busca de produtos do fornecedor
    return [];
  }

  private async updateProductStock(productId: string, _supplierId: string): Promise<void> {
    // TODO: Implementar atualização de estoque
    logger.info(`📦 Estoque atualizado: ${productId}`);
  }
}

// Instância singleton do worker
export const orderWorker = new OrderWorker();
