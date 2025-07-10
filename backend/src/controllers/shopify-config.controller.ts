import { Request, Response } from 'express';
import { ShopifyRealService } from '../services/shopify-real.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

/**
 * Controller para gerenciar configurações do Shopify
 */
export class ShopifyConfigController {
  private static getShopifyService(): ShopifyRealService {
    const config = {
      shop: process.env.SHOPIFY_SHOP || '',
      apiKey: process.env.SHOPIFY_API_KEY || '',
      apiSecret: process.env.SHOPIFY_API_SECRET || '',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
      webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
      apiVersion: '2024-01',
    };

    if (!config.shop || !config.accessToken) {
      throw new ApiError(500, 'Configuração do Shopify não encontrada');
    }

    return new ShopifyRealService(config);
  }

  /**
   * @desc    Test Shopify connection
   * @route   GET /api/shopify/test-connection
   * @access  Private (Admin)
   */
  static testConnection = asyncHandler(async (req: Request, res: Response) => {
    try {
      const shopifyService = this.getShopifyService();
      const shopInfo = await shopifyService.getShopInfo();

      logger.info('Conexão com Shopify testada com sucesso:', {
        shop: shopInfo.shop.name,
        domain: shopInfo.shop.domain,
      });

      res.status(200).json({
        success: true,
        message: 'Conexão com Shopify estabelecida com sucesso',
        data: {
          shopName: shopInfo.shop.name,
          domain: shopInfo.shop.domain,
          email: shopInfo.shop.email,
          currency: shopInfo.shop.currency,
          timezone: shopInfo.shop.timezone,
          country: shopInfo.shop.country_name,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao testar conexão com Shopify:', error);
      throw new ApiError(500, `Erro na conexão com Shopify: ${error.message}`);
    }
  });

  /**
   * @desc    Setup Shopify webhooks
   * @route   POST /api/shopify/setup-webhooks
   * @access  Private (Admin)
   */
  static setupWebhooks = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { baseUrl } = req.body;
      
      if (!baseUrl) {
        throw new ApiError(400, 'Base URL é obrigatória para configurar webhooks');
      }

      const shopifyService = this.getShopifyService();
      
      // Listar webhooks existentes
      const existingWebhooks = await shopifyService.getWebhooks();
      logger.info(`Webhooks existentes: ${existingWebhooks.webhooks.length}`);

      // Configurar novos webhooks
      const newWebhooks = await shopifyService.setupWebhooks(baseUrl);

      res.status(200).json({
        success: true,
        message: 'Webhooks configurados com sucesso',
        data: {
          existing: existingWebhooks.webhooks.length,
          created: newWebhooks.length,
          webhooks: newWebhooks,
        },
      });
    } catch (error: any) {
      logger.error('Erro ao configurar webhooks:', error);
      throw new ApiError(500, `Erro ao configurar webhooks: ${error.message}`);
    }
  });

  /**
   * @desc    Get Shopify orders
   * @route   GET /api/shopify/orders
   * @access  Private (Manager, Admin)
   */
  static getOrders = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { 
        limit = 50, 
        status = 'any',
        financial_status,
        fulfillment_status,
        created_at_min,
        created_at_max
      } = req.query;

      const shopifyService = this.getShopifyService();
      
      const orders = await shopifyService.getOrders({
        limit: Number(limit),
        status: status as any,
        financial_status: financial_status as any,
        fulfillment_status: fulfillment_status as any,
        created_at_min: created_at_min as string,
        created_at_max: created_at_max as string,
      });

      res.status(200).json({
        success: true,
        data: orders,
        count: orders.orders.length,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar pedidos do Shopify:', error);
      throw new ApiError(500, `Erro ao buscar pedidos: ${error.message}`);
    }
  });

  /**
   * @desc    Get specific Shopify order
   * @route   GET /api/shopify/orders/:orderId
   * @access  Private (Manager, Admin)
   */
  static getOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      
      if (!orderId || isNaN(Number(orderId))) {
        throw new ApiError(400, 'ID do pedido inválido');
      }

      const shopifyService = this.getShopifyService();
      const order = await shopifyService.getOrder(Number(orderId));

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar pedido do Shopify:', error);
      throw new ApiError(500, `Erro ao buscar pedido: ${error.message}`);
    }
  });

  /**
   * @desc    Sync Shopify order to local database
   * @route   POST /api/shopify/orders/:orderId/sync
   * @access  Private (Manager, Admin)
   */
  static syncOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      
      if (!orderId || isNaN(Number(orderId))) {
        throw new ApiError(400, 'ID do pedido inválido');
      }

      const shopifyService = this.getShopifyService();
      
      // Buscar pedido no Shopify
      const shopifyOrderResponse = await shopifyService.getOrder(Number(orderId));
      const shopifyOrder = shopifyOrderResponse.order;

      // Sincronizar para o banco local
      const localOrder = await shopifyService.syncOrderToDatabase(shopifyOrder);

      logger.info('Pedido sincronizado manualmente:', {
        shopifyOrderId: shopifyOrder.id,
        localOrderId: localOrder.id,
        orderName: shopifyOrder.name,
      });

      res.status(200).json({
        success: true,
        message: 'Pedido sincronizado com sucesso',
        data: {
          shopifyOrder: {
            id: shopifyOrder.id,
            name: shopifyOrder.name,
            total_price: shopifyOrder.total_price,
            financial_status: shopifyOrder.financial_status,
            fulfillment_status: shopifyOrder.fulfillment_status,
          },
          localOrder: {
            id: localOrder.id,
            numeroPedido: localOrder.numeroPedido,
            status: localOrder.status,
            valorTotal: localOrder.valorTotal,
          },
        },
      });
    } catch (error: any) {
      logger.error('Erro ao sincronizar pedido:', error);
      throw new ApiError(500, `Erro ao sincronizar pedido: ${error.message}`);
    }
  });

  /**
   * @desc    Update fulfillment status in Shopify
   * @route   POST /api/shopify/orders/:orderId/fulfill
   * @access  Private (Manager, Admin)
   */
  static fulfillOrder = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { orderId } = req.params;
      const { 
        tracking_number, 
        tracking_company, 
        tracking_urls,
        notify_customer = true,
        line_items 
      } = req.body;
      
      if (!orderId || isNaN(Number(orderId))) {
        throw new ApiError(400, 'ID do pedido inválido');
      }

      const shopifyService = this.getShopifyService();
      
      const fulfillmentData = {
        order_id: Number(orderId),
        status: 'success' as const,
        tracking_number,
        tracking_company,
        tracking_urls,
        notify_customer,
        line_items: line_items || [],
      };

      const fulfillment = await shopifyService.createFulfillment(fulfillmentData);

      logger.info('Fulfillment criado no Shopify:', {
        orderId,
        fulfillmentId: fulfillment.fulfillment.id,
        trackingNumber: tracking_number,
      });

      res.status(200).json({
        success: true,
        message: 'Fulfillment criado com sucesso',
        data: fulfillment,
      });
    } catch (error: any) {
      logger.error('Erro ao criar fulfillment:', error);
      throw new ApiError(500, `Erro ao criar fulfillment: ${error.message}`);
    }
  });

  /**
   * @desc    Get Shopify products
   * @route   GET /api/shopify/products
   * @access  Private (Manager, Admin)
   */
  static getProducts = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { 
        limit = 50, 
        status = 'active',
        vendor,
        product_type
      } = req.query;

      const shopifyService = this.getShopifyService();
      
      const products = await shopifyService.getProducts({
        limit: Number(limit),
        status: status as any,
        vendor: vendor as string,
        product_type: product_type as string,
      });

      res.status(200).json({
        success: true,
        data: products,
        count: products.products.length,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar produtos do Shopify:', error);
      throw new ApiError(500, `Erro ao buscar produtos: ${error.message}`);
    }
  });

  /**
   * @desc    Get Shopify customers
   * @route   GET /api/shopify/customers
   * @access  Private (Manager, Admin)
   */
  static getCustomers = asyncHandler(async (req: Request, res: Response) => {
    try {
      const { 
        limit = 50,
        created_at_min,
        created_at_max
      } = req.query;

      const shopifyService = this.getShopifyService();
      
      const customers = await shopifyService.getCustomers({
        limit: Number(limit),
        created_at_min: created_at_min as string,
        created_at_max: created_at_max as string,
      });

      res.status(200).json({
        success: true,
        data: customers,
        count: customers.customers.length,
      });
    } catch (error: any) {
      logger.error('Erro ao buscar clientes do Shopify:', error);
      throw new ApiError(500, `Erro ao buscar clientes: ${error.message}`);
    }
  });

  /**
   * @desc    Get current Shopify configuration status
   * @route   GET /api/shopify/status
   * @access  Private (Manager, Admin)
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    try {
      const hasConfig = !!(
        process.env.SHOPIFY_SHOP && 
        process.env.SHOPIFY_ACCESS_TOKEN
      );

      if (!hasConfig) {
        return res.status(200).json({
          success: true,
          data: {
            configured: false,
            message: 'Shopify não configurado',
          },
        });
      }

      const shopifyService = this.getShopifyService();
      
      // Test connection
      const shopInfo = await shopifyService.getShopInfo();
      
      // Get webhooks
      const webhooks = await shopifyService.getWebhooks();

      res.status(200).json({
        success: true,
        data: {
          configured: true,
          connected: true,
          shop: {
            name: shopInfo.shop.name,
            domain: shopInfo.shop.domain,
            currency: shopInfo.shop.currency,
            timezone: shopInfo.shop.timezone,
          },
          webhooks: {
            count: webhooks.webhooks.length,
            topics: webhooks.webhooks.map((w: any) => w.topic),
          },
          lastChecked: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Erro ao verificar status do Shopify:', error);
      
      res.status(200).json({
        success: true,
        data: {
          configured: true,
          connected: false,
          error: error.message,
          lastChecked: new Date().toISOString(),
        },
      });
    }
  });
}

export default ShopifyConfigController;