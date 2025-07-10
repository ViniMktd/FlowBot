import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/errors';
import { WhatsAppService } from './whatsapp.service';
import { PaginationParams } from '../types';

interface IOrderItem {
  shopifyVariantId?: number;
  productName: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  sku?: string;
  supplierId?: string;
}

interface ICreateOrderData {
  shopifyOrderId: number;
  shopifyOrderNumber?: string;
  customerId: string;
  supplierId?: string;
  totalAmount: number;
  shippingAmount?: number;
  paymentStatus?: string;
  items: IOrderItem[];
}

interface IUpdateOrderData {
  supplierId?: string | null;
  status?: string;
  trackingCode?: string | null;
  carrier?: string | null;
  estimatedDelivery?: Date | null;
  shopifyFulfillmentId?: number | null;
}

interface IOrderResponse {
  id: string;
  shopifyOrderId: number;
  shopifyOrderNumber?: string | null;
  customerId: string;
  supplierId?: string | null;
  status: string;
  totalAmount: number;
  currency: string;
  shippingAmount: number;
  paymentStatus?: string | null;
  trackingCode?: string | null;
  carrier?: string | null;
  estimatedDelivery?: Date | null;
  shopifyFulfillmentId?: number | null;
  createdAt: Date;
  updatedAt: Date;
  customer?: any;
  supplier?: any;
  items?: any[];
}

export class OrderService {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Criar novo pedido
   */
  async createOrder(orderData: ICreateOrderData): Promise<IOrderResponse> {
    try {
      // Verificar se o cliente existe
      const customer = await prisma.customer.findUnique({
        where: { id: orderData.customerId }
      });

      if (!customer) {
        throw new AppError('Cliente não encontrado', 404);
      }

      // Verificar se o fornecedor existe (se fornecido)
      if (orderData.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: orderData.supplierId }
        });

        if (!supplier) {
          throw new AppError('Fornecedor não encontrado', 404);
        }
      }

      // Verificar se o pedido já existe
      const existingOrder = await prisma.order.findUnique({
        where: { shopifyOrderId: orderData.shopifyOrderId }
      });

      if (existingOrder) {
        throw new AppError('Pedido já existe', 409);
      }

      // Criar pedido
      const order = await prisma.order.create({
        data: {
          shopifyOrderId: orderData.shopifyOrderId,
          shopifyOrderNumber: orderData.shopifyOrderNumber || null,
          customerId: orderData.customerId,
          supplierId: orderData.supplierId || null,
          status: 'PENDING',
          totalAmount: orderData.totalAmount,
          currency: 'BRL',
          shippingAmount: orderData.shippingAmount || null,
          paymentStatus: orderData.paymentStatus || null,
          orderItems: {
            create: orderData.items.map(item => ({
              shopifyVariantId: item.shopifyVariantId || null,
              productName: item.productName,
              variantTitle: item.variantTitle || null,
              quantity: item.quantity,
              price: item.price,
              sku: item.sku || null,
              supplierId: item.supplierId || null
            }))
          }
        },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Enviar confirmação por WhatsApp se cliente consentiu
      if (customer.whatsappConsent && customer.phone) {
        await this.whatsappService.sendOrderConfirmation(
          customer.phone,
          customer.name,
          order.shopifyOrderNumber || order.id,
          Number(order.totalAmount)
        );
      }

      logger.info('Pedido criado com sucesso', {
        orderId: order.id,
        shopifyOrderId: order.shopifyOrderId,
        customerId: order.customerId,
        totalAmount: order.totalAmount,
        action: 'create_order'
      });

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao criar pedido', {
        shopifyOrderId: orderData.shopifyOrderId,
        customerId: orderData.customerId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter pedido por ID
   */
  async getOrderById(id: string): Promise<IOrderResponse> {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      if (!order) {
        throw new AppError('Pedido não encontrado', 404);
      }

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao buscar pedido', {
        orderId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter pedido por Shopify ID
   */
  async getOrderByShopifyId(shopifyOrderId: number): Promise<IOrderResponse> {
    try {
      const order = await prisma.order.findUnique({
        where: { shopifyOrderId },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      if (!order) {
        throw new AppError('Pedido não encontrado', 404);
      }

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao buscar pedido por Shopify ID', {
        shopifyOrderId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Listar pedidos com filtros e paginação
   */
  async listOrders(
    page: number = 1,
    limit: number = 10,
    status?: string,
    customerId?: string,
    supplierId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    orders: IOrderResponse[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Montar filtros
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (customerId) {
        where.customerId = customerId;
      }

      if (supplierId) {
        where.supplierId = supplierId;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Buscar pedidos
      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          include: {
            customer: true,
            supplier: true,
            orderItems: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.order.count({ where })
      ]);

      const pages = Math.ceil(total / limit);

      return {
        orders: orders.map(order => this.formatOrder(order)),
        total,
        pages,
        currentPage: page
      };
    } catch (error) {
      logger.error('Erro ao listar pedidos', {
        page,
        limit,
        filters: { status, customerId, supplierId, startDate, endDate },
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar pedido
   */
  async updateOrder(id: string, updateData: IUpdateOrderData): Promise<IOrderResponse> {
    try {
      // Verificar se o pedido existe
      const existingOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          supplier: true
        }
      });

      if (!existingOrder) {
        throw new AppError('Pedido não encontrado', 404);
      }

      // Verificar se o fornecedor existe (se fornecido)
      if (updateData.supplierId) {
        const supplier = await prisma.supplier.findUnique({
          where: { id: updateData.supplierId }
        });

        if (!supplier) {
          throw new AppError('Fornecedor não encontrado', 404);
        }
      }

      // Atualizar pedido
      const order = await prisma.order.update({
        where: { id },
        data: updateData as any,
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Enviar notificações baseadas no status
      if (updateData.status && existingOrder.customer.whatsappConsent && existingOrder.customer.phone) {
        await this.sendStatusNotification(order, updateData.status);
      }

      logger.info('Pedido atualizado com sucesso', {
        orderId: order.id,
        oldStatus: existingOrder.status,
        newStatus: updateData.status,
        action: 'update_order'
      });

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao atualizar pedido', {
        orderId: id,
        updateData,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Cancelar pedido
   */
  async cancelOrder(id: string, reason?: string): Promise<IOrderResponse> {
    try {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          customer: true,
          supplier: true
        }
      });

      if (!order) {
        throw new AppError('Pedido não encontrado', 404);
      }

      if (order.status === 'CANCELLED') {
        throw new AppError('Pedido já cancelado', 400);
      }

      if (order.status === 'DELIVERED') {
        throw new AppError('Não é possível cancelar pedido já entregue', 400);
      }

      // Atualizar status
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED'
        },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Registrar log do cancelamento
      await prisma.systemLog.create({
        data: {
          level: 'INFO',
          service: 'ORDER_SERVICE',
          action: 'CANCEL_ORDER',
          message: `Pedido cancelado: ${reason || 'Motivo não informado'}`,
          orderId: id,
          metadata: {
            reason,
            cancelledAt: new Date().toISOString(),
            previousStatus: order.status
          }
        }
      });

      logger.info('Pedido cancelado com sucesso', {
        orderId: id,
        reason,
        previousStatus: order.status,
        action: 'cancel_order'
      });

      return this.formatOrder(updatedOrder);
    } catch (error) {
      logger.error('Erro ao cancelar pedido', {
        orderId: id,
        reason,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas de pedidos
   */
  async getOrderStats(): Promise<{
    total: number;
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    averageOrderValue: number;
  }> {
    try {
      const [
        total,
        pending,
        processing,
        shipped,
        delivered,
        cancelled,
        revenueResult
      ] = await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'PENDING' } }),
        prisma.order.count({ where: { status: 'PROCESSING' } }),
        prisma.order.count({ where: { status: 'SHIPPED' } }),
        prisma.order.count({ where: { status: 'DELIVERED' } }),
        prisma.order.count({ where: { status: 'CANCELLED' } }),
        prisma.order.aggregate({
          _sum: {
            totalAmount: true
          },
          _avg: {
            totalAmount: true
          },
          where: {
            status: {
              not: 'CANCELLED'
            }
          }
        })
      ]);

      return {
        total,
        pending,
        processing,
        shipped,
        delivered,
        cancelled,
        totalRevenue: Number(revenueResult._sum.totalAmount || 0),
        averageOrderValue: Number(revenueResult._avg.totalAmount || 0)
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas de pedidos', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Buscar pedidos com filtros e paginação
   */
  async getOrders(params: PaginationParams, filters: any = {}) {
    try {
      const { page = 1, limit = 10, search } = params;
      const skip = (page - 1) * limit;

      const where: any = {};

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.supplierId) {
        where.supplierId = filters.supplierId;
      }
      if (filters.customerId) {
        where.customerId = filters.customerId;
      }
      if (search) {
        where.OR = [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          { customer: { name: { contains: search, mode: 'insensitive' } } },
          { customer: { email: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          include: {
            customer: true,
            supplier: true,
            orderItems: true
          },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.order.count({ where })
      ]);

      return {
        orders: orders.map(order => this.formatOrder(order)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Erro ao buscar pedidos', { error });
      throw new Error('Erro ao buscar pedidos');
    }
  }

  /**
   * Atualizar status do pedido
   */
  async updateOrderStatus(orderId: string, status: string) {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Enviar notificação de status
      if (order.customer?.whatsappConsent && order.customer?.phone) {
        await this.sendStatusNotification(order, status);
      }

      logger.info('Status do pedido atualizado', {
        orderId,
        newStatus: status,
        action: 'update_order_status'
      });

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao atualizar status do pedido', { orderId, status, error });
      throw new Error('Erro ao atualizar status do pedido');
    }
  }

  /**
   * Definir código de rastreamento
   */
  async setTrackingCode(orderId: string, trackingCode: string, carrier?: string) {
    try {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: {
          trackingCode,
          carrier: carrier || 'Correios',
          status: 'SHIPPED'
        },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Enviar notificação de rastreamento
      if (order.customer?.whatsappConsent && order.customer?.phone) {
        await this.sendTrackingNotification(order, trackingCode);
      }

      logger.info('Código de rastreamento definido', {
        orderId,
        trackingCode,
        carrier,
        action: 'set_tracking_code'
      });

      return this.formatOrder(order);
    } catch (error) {
      logger.error('Erro ao definir código de rastreamento', { orderId, trackingCode, error });
      throw new Error('Erro ao definir código de rastreamento');
    }
  }

  /**
   * Reenviar notificação
   */
  async resendNotification(orderId: string, type: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      if (!order.customer.whatsappConsent || !order.customer.phone) {
        throw new Error('Cliente não possui WhatsApp ou não consentiu');
      }

      switch (type) {
        case 'status':
          await this.sendStatusNotification(order, order.status);
          break;
        case 'tracking':
          if (order.trackingCode) {
            await this.sendTrackingNotification(order, order.trackingCode);
          }
          break;
        case 'confirmation':
          await this.sendOrderConfirmation(order);
          break;
        default:
          throw new Error('Tipo de notificação inválido');
      }

      logger.info('Notificação reenviada', {
        orderId,
        type,
        action: 'resend_notification'
      });

      return { success: true };
    } catch (error) {
      logger.error('Erro ao reenviar notificação', { orderId, type, error });
      throw error;
    }
  }

  /**
   * Processar novo pedido
   */
  async processNewOrder(orderId: string, _shopifyOrderData: any) {
    try {
      // Implementar lógica de processamento
      logger.info('Processando novo pedido', { orderId });

      // Aqui você pode adicionar lógica específica de processamento
      // Por exemplo: verificar estoque, validar dados, etc.

      return { success: true };
    } catch (error) {
      logger.error('Erro ao processar novo pedido', { orderId, error });
      throw error;
    }
  }

  /**
   * Atribuir fornecedor
   */
  async assignSupplier(orderId: string) {
    try {
      // Implementar lógica de atribuição de fornecedor
      logger.info('Atribuindo fornecedor', { orderId });

      // Aqui você pode adicionar lógica específica de atribuição
      // Por exemplo: encontrar melhor fornecedor, verificar disponibilidade, etc.

      return { success: true };
    } catch (error) {
      logger.error('Erro ao atribuir fornecedor', { orderId, error });
      throw error;
    }
  }

  /**
   * Enviar notificação de rastreamento
   */
  private async sendTrackingNotification(order: any, trackingCode: string) {
    try {
      const whatsappService = new WhatsAppService();
      const message = `🚚 Seu pedido #${order.shopifyOrderNumber} foi enviado!\n\nCódigo de rastreamento: ${trackingCode}\n\nAcompanhe a entrega em tempo real.`;

      await whatsappService.sendMessage({
        customerId: order.customerId,
        phone: order.customer.phone,
        messageType: 'tracking',
        data: { message, trackingCode }
      });

      logger.info('Notificação de rastreamento enviada', {
        orderId: order.id,
        trackingCode,
        phone: order.customer.phone
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de rastreamento', { orderId: order.id, trackingCode, error });
    }
  }

  /**
   * Enviar confirmação do pedido
   */
  private async sendOrderConfirmation(order: any) {
    try {
      const whatsappService = new WhatsAppService();
      const message = `✅ Pedido #${order.shopifyOrderNumber} confirmado!\n\nTotal: R$ ${order.totalAmount.toFixed(2)}\n\nAguarde o processamento.`;

      await whatsappService.sendMessage({
        customerId: order.customerId,
        phone: order.customer.phone,
        messageType: 'confirmation',
        data: { message }
      });

      logger.info('Confirmação do pedido enviada', {
        orderId: order.id,
        phone: order.customer.phone
      });
    } catch (error) {
      logger.error('Erro ao enviar confirmação do pedido', { orderId: order.id, error });
    }
  }

  /**
   * Enviar notificação de status
   */
  private async sendStatusNotification(order: any, status: string) {
    try {
      const whatsappService = new WhatsAppService();
      const statusMessages: { [key: string]: string } = {
        'PENDING': '⏳ Seu pedido está sendo processado',
        'PROCESSING': '🔄 Seu pedido está sendo preparado',
        'SHIPPED': '🚚 Seu pedido foi enviado',
        'DELIVERED': '✅ Seu pedido foi entregue',
        'CANCELLED': '❌ Seu pedido foi cancelado'
      };

      const message = `${statusMessages[status] || 'Status atualizado'}\n\nPedido: #${order.shopifyOrderNumber}`;

      await whatsappService.sendMessage({
        customerId: order.customerId,
        phone: order.customer.phone,
        messageType: 'status',
        data: { message, status }
      });

      logger.info('Notificação de status enviada', {
        orderId: order.id,
        status,
        phone: order.customer.phone
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de status', { orderId: order.id, status, error });
    }
  }

  /**
   * Formatar dados do pedido para resposta
   */
  private formatOrder(order: any): IOrderResponse {
    return {
      id: order.id,
      shopifyOrderId: order.shopifyOrderId,
      shopifyOrderNumber: order.shopifyOrderNumber,
      customerId: order.customerId,
      supplierId: order.supplierId,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      currency: order.currency,
      shippingAmount: order.shippingAmount ? Number(order.shippingAmount) : 0,
      paymentStatus: order.paymentStatus,
      trackingCode: order.trackingCode,
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      shopifyFulfillmentId: order.shopifyFulfillmentId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customer: order.customer,
      supplier: order.supplier,
      items: order.orderItems
    };
  }
}
