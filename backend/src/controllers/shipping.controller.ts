import { Request, Response } from 'express';
import { CorreiosService, ShippingCalculationData } from '../services/correios.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

/**
 * Controller para gerenciar cálculos de frete e rastreamento
 */
export class ShippingController {
  private static correiosService: CorreiosService;

  static init() {
    this.correiosService = new CorreiosService();
    logger.info('✅ Correios service inicializado');
  }

  /**
   * @desc    Calculate shipping for multiple services
   * @route   POST /api/shipping/calculate
   * @access  Public
   */
  static calculateShipping = asyncHandler(async (req: Request, res: Response) => {
    const {
      originPostalCode,
      destinationPostalCode,
      weight,
      length,
      width,
      height,
      value,
      services,
    } = req.body;

    // Validar dados obrigatórios
    if (!originPostalCode || !destinationPostalCode || !weight || !length || !width || !height) {
      throw new ApiError(400, 'Dados obrigatórios: originPostalCode, destinationPostalCode, weight, length, width, height');
    }

    // Validar CEPs
    if (!this.correiosService.validatePostalCode(originPostalCode)) {
      throw new ApiError(400, 'CEP de origem inválido');
    }

    if (!this.correiosService.validatePostalCode(destinationPostalCode)) {
      throw new ApiError(400, 'CEP de destino inválido');
    }

    // Validar dimensões
    const dimensionValidation = CorreiosService.validateDimensions(
      Number(length),
      Number(width),
      Number(height),
      Number(weight)
    );

    if (!dimensionValidation.valid) {
      throw new ApiError(400, `Dimensões inválidas: ${dimensionValidation.errors.join(', ')}`);
    }

    try {
      const calculationData: ShippingCalculationData = {
        originPostalCode: originPostalCode.replace(/\D/g, ''),
        destinationPostalCode: destinationPostalCode.replace(/\D/g, ''),
        weight: Number(weight),
        length: Number(length),
        width: Number(width),
        height: Number(height),
        value: value ? Number(value) : undefined,
        services: services || undefined,
      };

      const results = await this.correiosService.calculateShipping(calculationData);

      // Filtrar resultados com erro se requested
      const successResults = results.filter(result => !result.error);
      const errorResults = results.filter(result => result.error);

      logger.info('Cálculo de frete realizado:', {
        origin: originPostalCode,
        destination: destinationPostalCode,
        successCount: successResults.length,
        errorCount: errorResults.length,
      });

      res.status(200).json({
        success: true,
        data: {
          origin: {
            postalCode: CorreiosService.formatPostalCode(originPostalCode),
          },
          destination: {
            postalCode: CorreiosService.formatPostalCode(destinationPostalCode),
          },
          package: {
            weight,
            dimensions: { length, width, height },
            value: value || null,
          },
          services: successResults,
          errors: errorResults.length > 0 ? errorResults : undefined,
        },
        calculatedAt: new Date().toISOString(),
      });

    } catch (error: any) {
      logger.error('Erro ao calcular frete:', error);
      throw new ApiError(500, `Erro ao calcular frete: ${error.message}`);
    }
  });

  /**
   * @desc    Get postal code information
   * @route   GET /api/shipping/postal-code/:postalCode
   * @access  Public
   */
  static getPostalCodeInfo = asyncHandler(async (req: Request, res: Response) => {
    const { postalCode } = req.params;

    if (!postalCode) {
      throw new ApiError(400, 'CEP é obrigatório');
    }

    try {
      const info = await this.correiosService.getPostalCodeInfo(postalCode);

      res.status(200).json({
        success: true,
        data: {
          ...info,
          formattedPostalCode: CorreiosService.formatPostalCode(info.postalCode),
        },
      });

    } catch (error: any) {
      logger.error('Erro ao consultar CEP:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, `Erro ao consultar CEP: ${error.message}`);
    }
  });

  /**
   * @desc    Track package
   * @route   GET /api/shipping/track/:trackingCode
   * @access  Private
   */
  static trackPackage = asyncHandler(async (req: Request, res: Response) => {
    const { trackingCode } = req.params;

    if (!trackingCode) {
      throw new ApiError(400, 'Código de rastreamento é obrigatório');
    }

    try {
      const trackingResult = await this.correiosService.trackPackage(trackingCode);

      res.status(200).json({
        success: true,
        data: trackingResult,
        trackedAt: new Date().toISOString(),
      });

    } catch (error: any) {
      logger.error('Erro ao rastrear encomenda:', error);
      throw new ApiError(500, `Erro ao rastrear encomenda: ${error.message}`);
    }
  });

  /**
   * @desc    Get available shipping services
   * @route   GET /api/shipping/services
   * @access  Public
   */
  static getShippingServices = asyncHandler(async (req: Request, res: Response) => {
    const services = CorreiosService.getAvailableServices();

    res.status(200).json({
      success: true,
      data: services,
    });
  });

  /**
   * @desc    Validate shipping dimensions
   * @route   POST /api/shipping/validate-dimensions
   * @access  Public
   */
  static validateDimensions = asyncHandler(async (req: Request, res: Response) => {
    const { length, width, height, weight } = req.body;

    if (!length || !width || !height || !weight) {
      throw new ApiError(400, 'Dados obrigatórios: length, width, height, weight');
    }

    const validation = CorreiosService.validateDimensions(
      Number(length),
      Number(width),
      Number(height),
      Number(weight)
    );

    const minimumDimensions = CorreiosService.calculateMinimumDimensions(
      Number(length),
      Number(width),
      Number(height)
    );

    res.status(200).json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        provided: {
          length: Number(length),
          width: Number(width),
          height: Number(height),
          weight: Number(weight),
        },
        minimumRequired: minimumDimensions,
        limits: {
          maxLength: 105,
          maxWidth: 105,
          maxHeight: 105,
          maxWeight: 30,
          maxSum: 200,
        },
      },
    });
  });

  /**
   * @desc    Calculate shipping for order (internal use)
   * @route   POST /api/shipping/order/:orderId
   * @access  Private
   */
  static calculateOrderShipping = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { destinationPostalCode, services } = req.body;

    if (!orderId || !destinationPostalCode) {
      throw new ApiError(400, 'Order ID e CEP de destino são obrigatórios');
    }

    try {
      // TODO: Buscar dados do pedido no banco de dados
      /*
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: {
          itens: {
            include: {
              produto: true,
            },
          },
          fornecedor: true,
        },
      });

      if (!order) {
        throw new ApiError(404, 'Pedido não encontrado');
      }
      */

      // Simulação para demonstração
      const simulatedOrder = {
        id: orderId,
        fornecedor: {
          cep: '01001-000', // CEP do fornecedor
        },
        itens: [
          {
            produto: {
              peso: 0.5,
              comprimento: 20,
              largura: 15,
              altura: 10,
            },
            quantidade: 2,
          },
        ],
        valorTotal: 150.00,
      };

      // Calcular peso e dimensões totais
      const totalWeight = simulatedOrder.itens.reduce(
        (sum, item) => sum + (item.produto.peso * item.quantidade),
        0
      );

      // Para simplificar, usar as dimensões do maior produto
      const maxProduct = simulatedOrder.itens[0].produto;

      const calculationData: ShippingCalculationData = {
        originPostalCode: simulatedOrder.fornecedor.cep.replace(/\D/g, ''),
        destinationPostalCode: destinationPostalCode.replace(/\D/g, ''),
        weight: totalWeight,
        length: maxProduct.comprimento,
        width: maxProduct.largura,
        height: maxProduct.altura,
        value: simulatedOrder.valorTotal,
        services,
      };

      const results = await this.correiosService.calculateShipping(calculationData);

      logger.info('Frete calculado para pedido:', {
        orderId,
        totalWeight,
        servicesCount: results.length,
      });

      res.status(200).json({
        success: true,
        data: {
          orderId,
          origin: {
            postalCode: CorreiosService.formatPostalCode(calculationData.originPostalCode),
          },
          destination: {
            postalCode: CorreiosService.formatPostalCode(destinationPostalCode),
          },
          package: {
            weight: totalWeight,
            value: simulatedOrder.valorTotal,
            items: simulatedOrder.itens.length,
          },
          services: results.filter(r => !r.error),
          errors: results.filter(r => r.error),
        },
        calculatedAt: new Date().toISOString(),
      });

    } catch (error: any) {
      logger.error('Erro ao calcular frete do pedido:', error);
      throw new ApiError(500, `Erro ao calcular frete do pedido: ${error.message}`);
    }
  });

  /**
   * @desc    Dispatch order (Supplier marks as shipped)
   * @route   POST /api/shipping/order/:orderId/dispatch
   * @access  Private (Supplier, Manager, Admin)
   */
  static dispatchOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { trackingCode, carrier, estimatedDelivery, notes } = req.body;

    if (!orderId || !trackingCode || !carrier) {
      throw new ApiError(400, 'Order ID, código de rastreamento e transportadora são obrigatórios');
    }

    try {
      // TODO: Buscar pedido no banco de dados
      /*
      const order = await prisma.order.findUnique({
        where: { id: Number(orderId) },
        include: {
          cliente: true,
          shopifyData: true,
        },
      });

      if (!order) {
        throw new ApiError(404, 'Pedido não encontrado');
      }

      if (order.status !== 'CONFIRMADO') {
        throw new ApiError(400, 'Pedido não está em status válido para despacho');
      }
      */

      // Simulação para demonstração
      const simulatedOrder = {
        id: orderId,
        numeroPedido: 'FLW-001',
        status: 'CONFIRMADO',
        valorTotal: 150.00,
        shopifyOrderId: '12345678901234',
        cliente: {
          nome: 'Cliente Demo',
          email: 'cliente@demo.com',
          telefone: '+5511999999999',
          country: 'BR',
        },
      };

      logger.info('Iniciando despacho de pedido:', {
        orderId,
        trackingCode,
        carrier,
        userRole: req.user?.role,
      });

      // 1. AUTOMATICAMENTE criar fulfillment no Shopify
      await this.createShopifyFulfillment(simulatedOrder, {
        trackingCode,
        carrier,
        estimatedDelivery,
      });

      // 2. Atualizar status do pedido local
      await this.updateOrderStatusToShipped(orderId, {
        trackingCode,
        carrier,
        estimatedDelivery,
        dispatchedAt: new Date(),
        dispatchedBy: req.user?.id,
        notes,
      });

      // 3. Enviar notificação WhatsApp para cliente
      await this.sendDispatchNotificationToCustomer(simulatedOrder, {
        trackingCode,
        carrier,
        estimatedDelivery,
      });

      // 4. Emitir evento para dashboard em tempo real
      if (global.io) {
        global.io.to('dashboard').emit('order_dispatched', {
          orderId,
          orderNumber: simulatedOrder.numeroPedido,
          trackingCode,
          carrier,
          timestamp: new Date().toISOString(),
        });
      }

      // 5. Agendar rastreamento automático
      await this.scheduleAutomaticTracking(orderId, trackingCode, carrier);

      logger.info('Pedido despachado com sucesso:', {
        orderId,
        trackingCode,
        carrier,
        shopifyOrderId: simulatedOrder.shopifyOrderId,
      });

      res.status(200).json({
        success: true,
        message: 'Pedido despachado com sucesso! Cliente será notificado automaticamente.',
        data: {
          orderId,
          orderNumber: simulatedOrder.numeroPedido,
          trackingCode,
          carrier,
          dispatchedAt: new Date().toISOString(),
          shopifyFulfilled: true,
          customerNotified: true,
          estimatedDelivery,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao despachar pedido:', error);
      throw new ApiError(500, `Erro ao despachar pedido: ${error.message}`);
    }
  });

  /**
   * @desc    Create tracking for order
   * @route   POST /api/shipping/order/:orderId/tracking
   * @access  Private (Manager, Admin)
   */
  static createOrderTracking = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { trackingCode, service, shippedAt } = req.body;

    if (!orderId || !trackingCode) {
      throw new ApiError(400, 'Order ID e código de rastreamento são obrigatórios');
    }

    try {
      // TODO: Salvar código de rastreamento no banco de dados
      /*
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          codigoRastreamento: trackingCode,
          servicoEntrega: service,
          dataEnvio: shippedAt ? new Date(shippedAt) : new Date(),
          status: 'ENVIADO',
          updatedAt: new Date(),
        },
      });
      */

      // Buscar informações iniciais de rastreamento
      const trackingResult = await this.correiosService.trackPackage(trackingCode);

      logger.info('Código de rastreamento adicionado ao pedido:', {
        orderId,
        trackingCode,
        service,
      });

      res.status(201).json({
        success: true,
        message: 'Código de rastreamento adicionado com sucesso',
        data: {
          orderId,
          trackingCode,
          service,
          tracking: trackingResult,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao adicionar rastreamento:', error);
      throw new ApiError(500, `Erro ao adicionar rastreamento: ${error.message}`);
    }
  });

  /**
   * MÉTODOS AUXILIARES PARA DESPACHO AUTOMÁTICO
   */

  /**
   * Criar fulfillment automaticamente no Shopify
   */
  private static async createShopifyFulfillment(order: any, dispatchData: any): Promise<void> {
    try {
      // Importar ShopifyRealService dinamicamente para evitar dependência circular
      const { ShopifyRealService } = await import('../services/shopify-real.service');
      
      const shopifyConfig = {
        shop: process.env.SHOPIFY_SHOP || '',
        apiKey: process.env.SHOPIFY_API_KEY || '',
        apiSecret: process.env.SHOPIFY_API_SECRET || '',
        accessToken: process.env.SHOPIFY_ACCESS_TOKEN || '',
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || '',
        apiVersion: '2024-01',
      };

      if (!shopifyConfig.shop || !shopifyConfig.accessToken) {
        logger.warn('Configuração do Shopify não encontrada - pulando criação de fulfillment');
        return;
      }

      const shopifyService = new ShopifyRealService(shopifyConfig);

      const fulfillmentData = {
        order_id: Number(order.shopifyOrderId),
        status: 'success' as const,
        tracking_number: dispatchData.trackingCode,
        tracking_company: dispatchData.carrier,
        tracking_urls: this.generateTrackingUrls(dispatchData.trackingCode, dispatchData.carrier),
        notify_customer: true, // Shopify enviará email automaticamente
        line_items: [], // Todos os itens (pode ser obtido do pedido)
      };

      const fulfillment = await shopifyService.createFulfillment(fulfillmentData);

      logger.info('Fulfillment criado automaticamente no Shopify:', {
        orderId: order.id,
        shopifyOrderId: order.shopifyOrderId,
        fulfillmentId: fulfillment.fulfillment.id,
        trackingNumber: dispatchData.trackingCode,
        notifiedCustomer: true,
      });

    } catch (error) {
      logger.error('Erro ao criar fulfillment no Shopify:', error);
      // Não bloquear o fluxo se Shopify falhar
    }
  }

  /**
   * Atualizar status do pedido local para enviado
   */
  private static async updateOrderStatusToShipped(orderId: string, dispatchData: any): Promise<void> {
    try {
      // TODO: Implementar quando Prisma estiver configurado
      /*
      await prisma.order.update({
        where: { id: Number(orderId) },
        data: {
          status: 'ENVIADO',
          codigoRastreamento: dispatchData.trackingCode,
          transportadora: dispatchData.carrier,
          dataEnvio: dispatchData.dispatchedAt,
          previsaoEntrega: dispatchData.estimatedDelivery ? new Date(dispatchData.estimatedDelivery) : null,
          observacoesEnvio: dispatchData.notes,
          usuarioEnvio: dispatchData.dispatchedBy,
          updatedAt: new Date(),
        },
      });
      */

      logger.info('Status do pedido atualizado para ENVIADO (simulado):', {
        orderId,
        status: 'ENVIADO',
        trackingCode: dispatchData.trackingCode,
        carrier: dispatchData.carrier,
        dispatchedAt: dispatchData.dispatchedAt,
      });

    } catch (error) {
      logger.error('Erro ao atualizar status do pedido:', error);
      throw error;
    }
  }

  /**
   * Enviar notificação WhatsApp para cliente sobre despacho
   */
  private static async sendDispatchNotificationToCustomer(order: any, dispatchData: any): Promise<void> {
    try {
      if (!order.cliente.telefone) {
        logger.warn('Cliente não possui telefone para notificação:', {
          orderId: order.id,
          clienteEmail: order.cliente.email,
        });
        return;
      }

      // Importar WhatsAppService dinamicamente
      const { WhatsAppService } = await import('../services/whatsapp.service');
      const whatsappService = new WhatsAppService();

      // Detectar idioma baseado no país
      const language = this.detectCustomerLanguage(order.cliente.country);

      // Construir mensagem personalizada
      const message = this.buildDispatchMessage(order, dispatchData, language);

      // Enviar mensagem
      await whatsappService.sendMessage(
        order.cliente.telefone,
        message,
        language
      );

      logger.info('Notificação de despacho enviada via WhatsApp:', {
        orderId: order.id,
        customerPhone: order.cliente.telefone,
        trackingCode: dispatchData.trackingCode,
        language,
      });

    } catch (error) {
      logger.error('Erro ao enviar notificação de despacho:', error);
      // Não bloquear o fluxo se WhatsApp falhar
    }
  }

  /**
   * Construir mensagem de despacho personalizada
   */
  private static buildDispatchMessage(order: any, dispatchData: any, language: string): string {
    const trackingUrl = this.generateTrackingUrls(dispatchData.trackingCode, dispatchData.carrier)[0];
    
    if (language === 'en') {
      return `🚀 Your order has been shipped!\n\n` +
        `📦 Order: ${order.numeroPedido}\n` +
        `🚚 Carrier: ${dispatchData.carrier}\n` +
        `📋 Tracking Code: ${dispatchData.trackingCode}\n` +
        `💰 Total: $${order.valorTotal.toFixed(2)}\n` +
        (dispatchData.estimatedDelivery ? `📅 Estimated Delivery: ${dispatchData.estimatedDelivery}\n` : '') +
        `\n🔗 Track your package: ${trackingUrl}\n\n` +
        `Thank you for shopping with us! 🛍️`;
    } else if (language === 'zh-CN') {
      return `🚀 您的订单已发货！\n\n` +
        `📦 订单号：${order.numeroPedido}\n` +
        `🚚 承运商：${dispatchData.carrier}\n` +
        `📋 快递单号：${dispatchData.trackingCode}\n` +
        `💰 总计：¥${order.valorTotal.toFixed(2)}\n` +
        (dispatchData.estimatedDelivery ? `📅 预计送达：${dispatchData.estimatedDelivery}\n` : '') +
        `\n🔗 跟踪包裹：${trackingUrl}\n\n` +
        `感谢您的购买！🛍️`;
    } else {
      // Português brasileiro (padrão)
      return `🚀 Seu pedido foi enviado!\n\n` +
        `📦 Pedido: ${order.numeroPedido}\n` +
        `🚚 Transportadora: ${dispatchData.carrier}\n` +
        `📋 Código de Rastreamento: ${dispatchData.trackingCode}\n` +
        `💰 Total: R$ ${order.valorTotal.toFixed(2)}\n` +
        (dispatchData.estimatedDelivery ? `📅 Previsão de Entrega: ${dispatchData.estimatedDelivery}\n` : '') +
        `\n🔗 Rastreie seu pedido: ${trackingUrl}\n\n` +
        `Obrigado pela preferência! 🛍️`;
    }
  }

  /**
   * Detectar idioma do cliente baseado no país
   */
  private static detectCustomerLanguage(country: string): string {
    const languageMap: Record<string, string> = {
      'BR': 'pt-BR',
      'US': 'en',
      'CN': 'zh-CN',
      'DE': 'de',
      'FR': 'fr',
      'ES': 'es',
    };
    return languageMap[country] || 'pt-BR';
  }

  /**
   * Gerar URLs de rastreamento baseadas na transportadora
   */
  private static generateTrackingUrls(trackingCode: string, carrier: string): string[] {
    const urlMap: Record<string, string> = {
      'Correios': `https://www2.correios.com.br/sistemas/rastreamento/resultado_semcpf.cfm?objetos=${trackingCode}`,
      'China Post': `https://track.chinapost.com.cn/index_en.html?code=${trackingCode}`,
      'DHL': `https://www.dhl.com/br-pt/home/tracking/tracking-express.html?submit=1&tracking-id=${trackingCode}`,
      'FedEx': `https://www.fedex.com/fedextrack/?trknbr=${trackingCode}`,
      'UPS': `https://www.ups.com/track?tracknum=${trackingCode}`,
      'SEDEX': `https://www2.correios.com.br/sistemas/rastreamento/resultado_semcpf.cfm?objetos=${trackingCode}`,
      'PAC': `https://www2.correios.com.br/sistemas/rastreamento/resultado_semcpf.cfm?objetos=${trackingCode}`,
    };

    const url = urlMap[carrier] || `https://www.google.com/search?q=rastrear+${trackingCode}`;
    return [url];
  }

  /**
   * Agendar rastreamento automático
   */
  private static async scheduleAutomaticTracking(orderId: string, trackingCode: string, carrier: string): Promise<void> {
    try {
      // TODO: Implementar agendamento real de job para rastreamento
      logger.info('Rastreamento automático agendado (simulado):', {
        orderId,
        trackingCode,
        carrier,
        nextCheck: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 horas
      });

      // Aqui seria adicionado um job na fila de rastreamento
      // trackingQueue.add('track_package', { orderId, trackingCode, carrier }, {
      //   repeat: { every: 4 * 60 * 60 * 1000 }, // A cada 4 horas
      //   attempts: 3,
      // });

    } catch (error) {
      logger.error('Erro ao agendar rastreamento automático:', error);
    }
  }
}

// Inicializar o controller
ShippingController.init();

export default ShippingController;