import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { PaginationParams } from '../types';
import { BaseService } from './base.service';

interface IOrderItem {
  shopifyVariantId?: bigint;
  productName: string;
  variantTitle?: string;
  quantity: number;
  price: number;
  sku?: string;
  supplierId?: string;
}

interface ICreateOrderData {
  shopifyOrderId: bigint;
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
  shopifyFulfillmentId?: bigint | null;
}

export class OrderService extends BaseService {
  protected entityName = 'Order';

  /**
   * Buscar todos os pedidos com paginação
   */
  async findAll(params: PaginationParams = {}) {
    try {
      const { skip, take } = this.getPaginationOptions(params);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          skip,
          take,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cpfCnpj: true
              }
            },
            supplier: {
              select: {
                id: true,
                companyName: true,
                tradeName: true,
                email: true,
                phone: true
              }
            },
            orderItems: {
              select: {
                id: true,
                productName: true,
                variantTitle: true,
                quantity: true,
                price: true,
                sku: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.order.count()
      ]);

      const formattedOrders = orders.map(order => ({
        id: order.id,
        shopifyOrderId: order.shopifyOrderId.toString(),
        shopifyOrderNumber: order.shopifyOrderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        shippingAmount: order.shippingAmount,
        paymentStatus: order.paymentStatus,
        trackingCode: order.trackingCode,
        carrier: order.carrier,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.customer,
        supplier: order.supplier,
        items: order.orderItems
      }));

      const paginatedData = this.createPaginatedResponse(formattedOrders, total, params);

      this.logOperation('findAll', { total, page: params.page, limit: params.limit });

      return this.createSuccessResponse(paginatedData, 'Pedidos recuperados com sucesso');
    } catch (error) {
      logger.error('Erro ao buscar pedidos:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Buscar pedido por ID
   */
  async findById(id: string) {
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
        return this.createErrorResponse('Pedido não encontrado');
      }

      const formattedOrder = {
        id: order.id,
        shopifyOrderId: order.shopifyOrderId.toString(),
        shopifyOrderNumber: order.shopifyOrderNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
        shippingAmount: order.shippingAmount,
        paymentStatus: order.paymentStatus,
        trackingCode: order.trackingCode,
        carrier: order.carrier,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        customer: order.customer,
        supplier: order.supplier,
        items: order.orderItems
      };

      this.logOperation('findById', { orderId: id });

      return this.createSuccessResponse(formattedOrder, 'Pedido encontrado');
    } catch (error) {
      logger.error('Erro ao buscar pedido por ID:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Criar novo pedido
   */
  async create(data: ICreateOrderData) {
    try {
      const order = await prisma.order.create({
        data: {
          shopifyOrderId: data.shopifyOrderId,
          shopifyOrderNumber: data.shopifyOrderNumber,
          customerId: data.customerId,
          supplierId: data.supplierId,
          totalAmount: data.totalAmount,
          shippingAmount: data.shippingAmount || 0,
          paymentStatus: data.paymentStatus || 'PENDING',
          currency: 'BRL',
          status: 'PENDING',
          orderItems: {
            create: data.items.map(item => ({
              shopifyVariantId: item.shopifyVariantId,
              productName: item.productName,
              variantTitle: item.variantTitle,
              quantity: item.quantity,
              price: item.price,
              sku: item.sku,
              supplierId: item.supplierId
            }))
          }
        },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Registrar log da criação
      await prisma.systemLog.create({
        data: {
          level: 'INFO' as any,
          service: 'ORDER_SERVICE',
          action: 'CREATE_ORDER',
          message: `Novo pedido criado: ${order.shopifyOrderNumber}`,
          orderId: order.id,
          metadata: {
            shopifyOrderId: order.shopifyOrderId.toString(),
            customerId: order.customerId,
            totalAmount: order.totalAmount,
            itemsCount: data.items.length
          } as any
        }
      });

      this.logOperation('create', { orderId: order.id, shopifyOrderId: order.shopifyOrderId.toString() });

      return this.createSuccessResponse(order, 'Pedido criado com sucesso');
    } catch (error) {
      logger.error('Erro ao criar pedido:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Atualizar pedido
   */
  async update(id: string, data: IUpdateOrderData) {
    try {
      const existingOrder = await prisma.order.findUnique({
        where: { id }
      });

      if (!existingOrder) {
        return this.createErrorResponse('Pedido não encontrado');
      }

      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          ...(data as any),
          updatedAt: new Date()
        },
        include: {
          customer: true,
          supplier: true,
          orderItems: true
        }
      });

      // Registrar log da atualização
      await prisma.systemLog.create({
        data: {
          level: 'INFO' as any,
          service: 'ORDER_SERVICE',
          action: 'UPDATE_ORDER',
          message: `Pedido atualizado: ${updatedOrder.shopifyOrderNumber}`,
          orderId: id,
          metadata: {
            changes: JSON.stringify(data),
            previousStatus: existingOrder.status,
            newStatus: updatedOrder.status
          } as any
        }
      });

      this.logOperation('update', { orderId: id, changes: data });

      return this.createSuccessResponse(updatedOrder, 'Pedido atualizado com sucesso');
    } catch (error) {
      logger.error('Erro ao atualizar pedido:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Cancelar pedido
   */
  async cancel(id: string, reason?: string) {
    try {
      const order = await prisma.order.findUnique({
        where: { id }
      });

      if (!order) {
        return this.createErrorResponse('Pedido não encontrado');
      }

      if (order.status === 'CANCELLED') {
        return this.createErrorResponse('Pedido já foi cancelado');
      }

      if (order.status === 'DELIVERED') {
        return this.createErrorResponse('Não é possível cancelar um pedido já entregue');
      }

      const cancelledOrder = await prisma.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
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
          level: 'INFO' as any,
          service: 'ORDER_SERVICE',
          action: 'CANCEL_ORDER',
          message: `Pedido cancelado: ${reason || 'Motivo não informado'}`,
          orderId: id,
          metadata: {
            reason,
            cancelledAt: new Date().toISOString(),
            previousStatus: order.status
          } as any
        }
      });

      this.logOperation('cancel', { orderId: id, reason });

      return this.createSuccessResponse(cancelledOrder, 'Pedido cancelado com sucesso');
    } catch (error) {
      logger.error('Erro ao cancelar pedido:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Buscar pedidos por status
   */
  async findByStatus(status: string, params: PaginationParams = {}) {
    try {
      const { skip, take } = this.getPaginationOptions(params);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { status: status as any },
          skip,
          take,
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            supplier: {
              select: {
                id: true,
                companyName: true,
                tradeName: true,
                email: true
              }
            },
            orderItems: {
              select: {
                id: true,
                productName: true,
                quantity: true,
                price: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.order.count({
          where: { status: status as any }
        })
      ]);

      const paginatedData = this.createPaginatedResponse(orders, total, params);

      this.logOperation('findByStatus', { status, total });

      return this.createSuccessResponse(paginatedData, `Pedidos com status ${status} recuperados`);
    } catch (error) {
      logger.error('Erro ao buscar pedidos por status:', error);
      return this.handlePrismaError(error);
    }
  }

  /**
   * Buscar pedidos por cliente
   */
  async findByCustomer(customerId: string, params: PaginationParams = {}) {
    try {
      const { skip, take } = this.getPaginationOptions(params);

      const [orders, total] = await Promise.all([
        prisma.order.findMany({
          where: { customerId },
          skip,
          take,
          include: {
            customer: true,
            supplier: {
              select: {
                id: true,
                companyName: true,
                tradeName: true
              }
            },
            orderItems: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.order.count({
          where: { customerId }
        })
      ]);

      const paginatedData = this.createPaginatedResponse(orders, total, params);

      this.logOperation('findByCustomer', { customerId, total });

      return this.createSuccessResponse(paginatedData, 'Pedidos do cliente recuperados');
    } catch (error) {
      logger.error('Erro ao buscar pedidos por cliente:', error);
      return this.handlePrismaError(error);
    }
  }
}
