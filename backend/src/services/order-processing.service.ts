import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { BaseService } from './base.service';
import {
  addJob,
  JobType,
  orderProcessingQueue,
  supplierCommunicationQueue,
  notificationQueue,
  OrderProcessingJobData,
  SupplierCommunicationJobData,
  NotificationJobData
} from '../config/queues';
import { WhatsAppService } from './whatsapp.service';
import { formatDateTime } from '../utils/brazilian';

export interface OrderRoutingRule {
  id: string;
  supplierId: string;
  productCategories: string[];
  regions: string[];
  maxOrderValue?: number;
  minOrderValue?: number;
  priority: number;
  isActive: boolean;
}

export interface OrderProcessingResult {
  orderId: string;
  status: string;
  supplierId?: string;
  estimatedDelivery?: Date;
  trackingCode?: string;
  processingTime: number;
  notifications: string[];
}

export class OrderProcessingService extends BaseService {
  protected entityName = 'OrderProcessing';
  private whatsappService: WhatsAppService;

  constructor() {
    super();
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Processar pedido completo (entrada principal)
   */
  async processOrder(orderId: string, priority: 'high' | 'normal' | 'low' = 'normal'): Promise<OrderProcessingResult> {
    const startTime = Date.now();

    try {
      // Buscar pedido
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      this.logOperation('processOrder', { orderId, priority });

      // Adicionar à fila de processamento
      await addJob(orderProcessingQueue, JobType.PROCESS_ORDER, {
        orderId,
        shopifyOrderId: order.shopifyOrderId.toString(),
        customerId: order.customerId,
        priority,
        metadata: {
          totalAmount: order.totalAmount,
          itemsCount: order.orderItems.length,
          customerRegion: order.customer.addressState,
        }
      } as OrderProcessingJobData);

      return {
        orderId,
        status: 'PROCESSING',
        processingTime: Date.now() - startTime,
        notifications: ['Pedido adicionado à fila de processamento']
      };

    } catch (error) {
      logger.error('Erro ao processar pedido', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Roteamento inteligente de pedidos
   */
  async routeOrder(orderId: string): Promise<string> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Buscar fornecedores ativos
      const suppliers = await prisma.supplier.findMany({
        where: { active: true },
        include: {
          supplierProducts: {
            include: {
              product: true
            }
          }
        }
      });

      // Algoritmo de roteamento
      let selectedSupplier = null;
      let bestScore = -1;

      for (const supplier of suppliers) {
        const score = this.calculateSupplierScore(order, supplier);

        if (score > bestScore) {
          bestScore = score;
          selectedSupplier = supplier;
        }
      }

      if (!selectedSupplier) {
        throw new Error('Nenhum fornecedor disponível para este pedido');
      }

      // Atualizar pedido com fornecedor
      await prisma.order.update({
        where: { id: orderId },
        data: {
          supplierId: selectedSupplier.id,
          status: 'SENT_TO_SUPPLIER'
        }
      });

      // Adicionar job para enviar ao fornecedor
      await addJob(supplierCommunicationQueue, JobType.SEND_ORDER_TO_SUPPLIER, {
        orderId,
        supplierId: selectedSupplier.id,
        action: 'send_order',
        data: {
          orderDetails: {
            id: order.id,
            shopifyOrderId: order.shopifyOrderId.toString(),
            items: order.orderItems,
            customer: order.customer,
            totalAmount: order.totalAmount,
            shippingAmount: order.shippingAmount,
          },
          supplierInfo: {
            id: selectedSupplier.id,
            companyName: selectedSupplier.companyName,
            email: selectedSupplier.email,
            apiEndpoint: selectedSupplier.apiEndpoint,
          }
        }
      } as SupplierCommunicationJobData);

      this.logOperation('routeOrder', {
        orderId,
        selectedSupplierId: selectedSupplier.id,
        score: bestScore
      });

      return selectedSupplier.id;

    } catch (error) {
      logger.error('Erro no roteamento de pedido', { orderId, error: error.message });
      throw error;
    }
  }

  /**
   * Calcular score do fornecedor para um pedido
   */
  private calculateSupplierScore(order: any, supplier: any): number {
    let score = 0;

    // Score base pela avaliação do fornecedor
    score += supplier.performanceRating * 10;

    // Score por disponibilidade de produtos
    const availableProducts = supplier.supplierProducts.filter((sp: any) =>
      order.orderItems.some((item: any) => item.productId === sp.productId)
    );
    score += (availableProducts.length / order.orderItems.length) * 30;

    // Score por região (mesma região = +20)
    if (supplier.addressState === order.customer.addressState) {
      score += 20;
    }

    // Score por tempo de processamento (menor = melhor)
    if (supplier.averageProcessingTime) {
      score += Math.max(0, 20 - (supplier.averageProcessingTime / 24)); // Penaliza por cada dia acima de 1
    }

    // Score por status ativo
    if (supplier.active) {
      score += 10;
    }

    return score;
  }

  /**
   * Atualizar status do pedido
   */
  async updateOrderStatus(orderId: string, status: string, metadata?: Record<string, any>): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Atualizar status
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status as any,
          updatedAt: new Date()
        }
      });

      // Registrar log
      await prisma.systemLog.create({
        data: {
          level: 'INFO' as any,
          service: 'ORDER_PROCESSING',
          action: 'STATUS_UPDATE',
          message: `Status do pedido alterado para ${status}`,
          orderId,
          metadata: {
            previousStatus: order.status,
            newStatus: status,
            ...metadata
          } as any
        }
      });

      // Notificar cliente sobre mudança de status
      await this.notifyCustomerStatusChange(order, status);

      this.logOperation('updateOrderStatus', { orderId, status, metadata });

    } catch (error) {
      logger.error('Erro ao atualizar status do pedido', { orderId, status, error: error.message });
      throw error;
    }
  }

  /**
   * Notificar cliente sobre mudança de status
   */
  private async notifyCustomerStatusChange(order: any, newStatus: string): Promise<void> {
    const statusMessages = {
      'SENT_TO_SUPPLIER': 'Seu pedido foi enviado ao fornecedor e está sendo processado! 📦',
      'PROCESSING': 'Seu pedido está sendo preparado pelo fornecedor! ⚙️',
      'SHIPPED': 'Seu pedido foi enviado! Em breve você receberá o código de rastreamento. 🚚',
      'DELIVERED': 'Seu pedido foi entregue! Esperamos que goste da sua compra! 🎉',
      'CANCELLED': 'Seu pedido foi cancelado. Entre em contato conosco para mais informações. ❌'
    };

    const message = statusMessages[newStatus] || `Status do seu pedido atualizado para: ${newStatus}`;

    if (order.customer.phone) {
      await addJob(notificationQueue, JobType.SEND_WHATSAPP_MESSAGE, {
        type: 'whatsapp',
        recipient: order.customer.phone,
        message: `*Atualização do Pedido ${order.shopifyOrderNumber}*\n\n${message}\n\nData: ${formatDateTime(new Date())}`,
        orderId: order.id
      } as NotificationJobData);
    }
  }

  /**
   * Processar cancelamento de pedido
   */
  async cancelOrder(orderId: string, reason: string, notifySupplier: boolean = true): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          supplier: true
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      if (order.status === 'CANCELLED') {
        throw new Error('Pedido já foi cancelado');
      }

      if (order.status === 'DELIVERED') {
        throw new Error('Não é possível cancelar pedido já entregue');
      }

      // Atualizar status para cancelado
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date()
        }
      });

      // Notificar fornecedor se necessário
      if (notifySupplier && order.supplier) {
        await addJob(supplierCommunicationQueue, JobType.SEND_ORDER_TO_SUPPLIER, {
          orderId,
          supplierId: order.supplier.id,
          action: 'cancel_order',
          data: {
            reason,
            orderNumber: order.shopifyOrderNumber,
            cancelledAt: new Date().toISOString()
          }
        } as SupplierCommunicationJobData);
      }

      // Notificar cliente
      await this.notifyCustomerStatusChange(order, 'CANCELLED');

      // Registrar log
      await prisma.systemLog.create({
        data: {
          level: 'INFO' as any,
          service: 'ORDER_PROCESSING',
          action: 'CANCEL_ORDER',
          message: `Pedido cancelado: ${reason}`,
          orderId,
          metadata: {
            reason,
            cancelledAt: new Date().toISOString(),
            previousStatus: order.status,
            notifySupplier
          } as any
        }
      });

      this.logOperation('cancelOrder', { orderId, reason, notifySupplier });

    } catch (error) {
      logger.error('Erro ao cancelar pedido', { orderId, reason, error: error.message });
      throw error;
    }
  }

  /**
   * Obter estatísticas de processamento
   */
  async getProcessingStats(): Promise<Record<string, any>> {
    try {
      const stats = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStats = await prisma.order.groupBy({
        by: ['status'],
        where: {
          createdAt: {
            gte: today
          }
        },
        _count: {
          status: true
        }
      });

      const averageProcessingTime = await prisma.order.aggregate({
        where: {
          status: 'DELIVERED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 dias
          }
        },
        _avg: {
          totalAmount: true
        }
      });

      return {
        totalOrders: stats.reduce((sum, stat) => sum + stat._count.status, 0),
        ordersByStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        todayOrders: todayStats.reduce((sum, stat) => sum + stat._count.status, 0),
        todayByStatus: todayStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.status;
          return acc;
        }, {} as Record<string, number>),
        averageOrderValue: averageProcessingTime._avg.totalAmount || 0,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de processamento', { error: error.message });
      throw error;
    }
  }

  /**
   * Reprocessar pedidos falhados
   */
  async reprocessFailedOrders(): Promise<{ reprocessed: number; failed: number }> {
    try {
      const failedOrders = await prisma.order.findMany({
        where: {
          status: 'FAILED',
          updatedAt: {
            lt: new Date(Date.now() - 30 * 60 * 1000) // Mais de 30 minutos
          }
        },
        take: 10 // Processar no máximo 10 por vez
      });

      let reprocessed = 0;
      let failed = 0;

      for (const order of failedOrders) {
        try {
          await this.processOrder(order.id, 'high');
          reprocessed++;
        } catch (error) {
          logger.error('Erro ao reprocessar pedido', {
            orderId: order.id,
            error: error.message
          });
          failed++;
        }
      }

      this.logOperation('reprocessFailedOrders', { reprocessed, failed });

      return { reprocessed, failed };

    } catch (error) {
      logger.error('Erro ao reprocessar pedidos falhados', { error: error.message });
      throw error;
    }
  }
}
