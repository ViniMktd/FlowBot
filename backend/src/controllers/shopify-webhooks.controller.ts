import { Request, Response } from 'express';
import { ShopifyRealService, ShopifyOrder } from '../services/shopify-real.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';
import { WhatsAppService } from '../services/whatsapp.service';
import { I18nService } from '../services/i18n.service';

/**
 * Controller para processar webhooks do Shopify
 */
export class ShopifyWebhooksController {
  private static shopifyService: ShopifyRealService;
  private static whatsappService: WhatsAppService;
  private static i18nService: I18nService;

  static init() {
    // Inicializar serviços (seria configurado via env vars)
    const shopifyConfig = {
      shop: process.env.SHOPIFY_SHOP || 'demo-shop',
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecret: process.env.SHOPIFY_API_SECRET || '',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
      apiVersion: '2024-01',
    };

    this.shopifyService = new ShopifyRealService(shopifyConfig);
    this.whatsappService = new WhatsAppService();
    this.i18nService = new I18nService();
  }

  /**
   * @desc    Handle order created webhook
   * @route   POST /api/webhooks/shopify/orders/create
   * @access  Public (verified by webhook signature)
   */
  static handleOrderCreated = asyncHandler(async (req: Request, res: Response) => {
    const shopifyOrder: ShopifyOrder = req.body;
    
    logger.info('Novo pedido recebido do Shopify:', {
      orderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
      customerEmail: shopifyOrder.customer.email,
      totalPrice: shopifyOrder.total_price,
    });

    try {
      // Sincronizar pedido para o banco de dados
      const localOrder = await this.shopifyService.syncOrderToDatabase(shopifyOrder);

      // Enviar notificação para o cliente via WhatsApp
      await this.sendOrderConfirmationToCustomer(shopifyOrder, localOrder);

      // Notificar fornecedor se já estiver atribuído
      // await this.notifySupplierAboutNewOrder(localOrder);

      // Emitir evento via WebSocket para dashboard em tempo real
      if (global.io) {
        global.io.to('dashboard').emit('new_order', {
          orderNumber: localOrder.numeroPedido,
          customerName: shopifyOrder.customer.first_name + ' ' + shopifyOrder.customer.last_name,
          totalPrice: shopifyOrder.total_price,
          timestamp: new Date().toISOString(),
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Pedido processado com sucesso',
        localOrderId: localOrder.id 
      });

    } catch (error) {
      logger.error('Erro ao processar pedido do Shopify:', error);
      
      // Mesmo com erro, responder 200 para evitar reenvio do webhook
      res.status(200).json({ 
        success: false, 
        message: 'Erro interno, será processado novamente' 
      });
    }
  });

  /**
   * @desc    Handle order updated webhook
   * @route   POST /api/webhooks/shopify/orders/updated
   * @access  Public (verified by webhook signature)
   */
  static handleOrderUpdated = asyncHandler(async (req: Request, res: Response) => {
    const shopifyOrder: ShopifyOrder = req.body;
    
    logger.info('Pedido atualizado no Shopify:', {
      orderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
      financialStatus: shopifyOrder.financial_status,
      fulfillmentStatus: shopifyOrder.fulfillment_status,
    });

    try {
      // Atualizar pedido no banco local
      await this.updateLocalOrder(shopifyOrder);

      // Notificar cliente sobre mudanças importantes
      await this.notifyCustomerAboutOrderUpdate(shopifyOrder);

      res.status(200).json({ success: true, message: 'Pedido atualizado com sucesso' });

    } catch (error) {
      logger.error('Erro ao atualizar pedido do Shopify:', error);
      res.status(200).json({ success: false, message: 'Erro interno' });
    }
  });

  /**
   * @desc    Handle order paid webhook
   * @route   POST /api/webhooks/shopify/orders/paid
   * @access  Public (verified by webhook signature)
   */
  static handleOrderPaid = asyncHandler(async (req: Request, res: Response) => {
    const shopifyOrder: ShopifyOrder = req.body;
    
    logger.info('Pagamento confirmado no Shopify:', {
      orderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
      totalPrice: shopifyOrder.total_price,
    });

    try {
      // Atualizar status para confirmado
      await this.updateLocalOrder(shopifyOrder);

      // Enviar confirmação de pagamento para o cliente
      await this.sendPaymentConfirmationToCustomer(shopifyOrder);

      // Iniciar processo de fulfillment
      await this.initiateOrderFulfillment(shopifyOrder);

      res.status(200).json({ success: true, message: 'Pagamento processado com sucesso' });

    } catch (error) {
      logger.error('Erro ao processar pagamento do Shopify:', error);
      res.status(200).json({ success: false, message: 'Erro interno' });
    }
  });

  /**
   * @desc    Handle order cancelled webhook
   * @route   POST /api/webhooks/shopify/orders/cancelled
   * @access  Public (verified by webhook signature)
   */
  static handleOrderCancelled = asyncHandler(async (req: Request, res: Response) => {
    const shopifyOrder: ShopifyOrder = req.body;
    
    logger.info('Pedido cancelado no Shopify:', {
      orderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
    });

    try {
      // Atualizar status para cancelado
      await this.updateLocalOrder(shopifyOrder);

      // Notificar cliente sobre cancelamento
      await this.sendCancellationNotificationToCustomer(shopifyOrder);

      res.status(200).json({ success: true, message: 'Cancelamento processado com sucesso' });

    } catch (error) {
      logger.error('Erro ao processar cancelamento do Shopify:', error);
      res.status(200).json({ success: false, message: 'Erro interno' });
    }
  });

  /**
   * @desc    Handle order fulfilled webhook
   * @route   POST /api/webhooks/shopify/orders/fulfilled
   * @access  Public (verified by webhook signature)
   */
  static handleOrderFulfilled = asyncHandler(async (req: Request, res: Response) => {
    const shopifyOrder: ShopifyOrder = req.body;
    
    logger.info('Pedido enviado no Shopify:', {
      orderId: shopifyOrder.id,
      orderName: shopifyOrder.name,
    });

    try {
      // Atualizar status para enviado
      await this.updateLocalOrder(shopifyOrder);

      // Enviar código de rastreamento para o cliente
      await this.sendTrackingInfoToCustomer(shopifyOrder);

      res.status(200).json({ success: true, message: 'Envio processado com sucesso' });

    } catch (error) {
      logger.error('Erro ao processar envio do Shopify:', error);
      res.status(200).json({ success: false, message: 'Erro interno' });
    }
  });

  /**
   * Enviar confirmação de pedido para o cliente
   */
  private static async sendOrderConfirmationToCustomer(shopifyOrder: ShopifyOrder, localOrder: any) {
    try {
      if (!shopifyOrder.customer.phone) {
        logger.warn('Cliente não possui telefone cadastrado para WhatsApp');
        return;
      }

      // Detectar idioma baseado no país de entrega
      const country = this.detectCountryCode(shopifyOrder.shipping_address.country);
      const language = this.detectLanguageFromCountry(country);

      // Buscar template de confirmação
      const template = await this.i18nService.translate(
        'whatsapp.order_confirmation',
        language,
        {
          customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
          orderNumber: localOrder.numeroPedido,
          totalAmount: shopifyOrder.total_price,
          currency: shopifyOrder.currency,
        }
      );

      // Enviar via WhatsApp
      await this.whatsappService.sendMessage(
        shopifyOrder.customer.phone,
        template,
        language
      );

      logger.info('Confirmação de pedido enviada via WhatsApp:', {
        phone: shopifyOrder.customer.phone,
        language,
        orderNumber: localOrder.numeroPedido,
      });

    } catch (error) {
      logger.error('Erro ao enviar confirmação de pedido:', error);
    }
  }

  /**
   * Enviar confirmação de pagamento para o cliente
   */
  private static async sendPaymentConfirmationToCustomer(shopifyOrder: ShopifyOrder) {
    try {
      if (!shopifyOrder.customer.phone) return;

      const country = this.detectCountryCode(shopifyOrder.shipping_address.country);
      const language = this.detectLanguageFromCountry(country);

      const template = await this.i18nService.translate(
        'whatsapp.payment_confirmation',
        language,
        {
          customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
          orderNumber: shopifyOrder.name,
          totalAmount: shopifyOrder.total_price,
          currency: shopifyOrder.currency,
        }
      );

      await this.whatsappService.sendMessage(
        shopifyOrder.customer.phone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao enviar confirmação de pagamento:', error);
    }
  }

  /**
   * Notificar cliente sobre atualização do pedido
   */
  private static async notifyCustomerAboutOrderUpdate(shopifyOrder: ShopifyOrder) {
    try {
      // Verificar se é uma mudança significativa
      const significantStatuses = ['paid', 'fulfilled', 'cancelled'];
      if (!significantStatuses.includes(shopifyOrder.financial_status) && 
          !significantStatuses.includes(shopifyOrder.fulfillment_status || '')) {
        return;
      }

      if (!shopifyOrder.customer.phone) return;

      const country = this.detectCountryCode(shopifyOrder.shipping_address.country);
      const language = this.detectLanguageFromCountry(country);

      const template = await this.i18nService.translate(
        'whatsapp.order_update',
        language,
        {
          customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
          orderNumber: shopifyOrder.name,
          status: shopifyOrder.financial_status,
        }
      );

      await this.whatsappService.sendMessage(
        shopifyOrder.customer.phone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao notificar cliente sobre atualização:', error);
    }
  }

  /**
   * Enviar notificação de cancelamento
   */
  private static async sendCancellationNotificationToCustomer(shopifyOrder: ShopifyOrder) {
    try {
      if (!shopifyOrder.customer.phone) return;

      const country = this.detectCountryCode(shopifyOrder.shipping_address.country);
      const language = this.detectLanguageFromCountry(country);

      const template = await this.i18nService.translate(
        'whatsapp.order_cancelled',
        language,
        {
          customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
          orderNumber: shopifyOrder.name,
        }
      );

      await this.whatsappService.sendMessage(
        shopifyOrder.customer.phone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao enviar notificação de cancelamento:', error);
    }
  }

  /**
   * Enviar informações de rastreamento
   */
  private static async sendTrackingInfoToCustomer(shopifyOrder: ShopifyOrder) {
    try {
      if (!shopifyOrder.customer.phone) return;

      const country = this.detectCountryCode(shopifyOrder.shipping_address.country);
      const language = this.detectLanguageFromCountry(country);

      // Extrair código de rastreamento (seria obtido do fulfillment)
      const trackingCode = 'BR123456789'; // Placeholder

      const template = await this.i18nService.translate(
        'whatsapp.order_shipped',
        language,
        {
          customerName: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
          orderNumber: shopifyOrder.name,
          trackingCode,
        }
      );

      await this.whatsappService.sendMessage(
        shopifyOrder.customer.phone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao enviar informações de rastreamento:', error);
    }
  }

  /**
   * Atualizar pedido no banco local
   */
  private static async updateLocalOrder(shopifyOrder: ShopifyOrder) {
    // Implementar atualização no banco de dados
    // Similar ao syncOrderToDatabase mas para atualização
  }

  /**
   * Iniciar processo de fulfillment
   */
  private static async initiateOrderFulfillment(shopifyOrder: ShopifyOrder) {
    // Implementar lógica para atribuir fornecedor e iniciar processo
  }

  /**
   * Detectar código do país
   */
  private static detectCountryCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      'Brazil': 'BR',
      'Brasil': 'BR',
      'United States': 'US',
      'China': 'CN',
      'Germany': 'DE',
    };
    return countryMap[countryName] || 'BR';
  }

  /**
   * Detectar idioma baseado no país
   */
  private static detectLanguageFromCountry(countryCode: string): string {
    const languageMap: Record<string, string> = {
      'BR': 'pt-BR',
      'US': 'en',
      'CN': 'zh-CN',
      'DE': 'de',
    };
    return languageMap[countryCode] || 'pt-BR';
  }
}

// Inicializar o controller
ShopifyWebhooksController.init();

export default ShopifyWebhooksController;