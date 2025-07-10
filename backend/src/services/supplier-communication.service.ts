import axios, { AxiosResponse } from 'axios';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import {
    addJob,
    JobType,
    NotificationJobData,
    notificationQueue,
    TrackingJobData,
    trackingQueue
} from '../config/queues';
import { formatDateTime } from '../utils/brazilian';
import { BaseService } from './base.service';
import { t } from './i18n.service';

export interface SupplierApiResponse {
  success: boolean;
  message: string;
  data?: any;
  trackingCode?: string;
  estimatedDelivery?: string;
  confirmationId?: string;
}

export interface ProductPhoto {
  url: string;
  description: string;
  isPrimary: boolean;
  uploadedAt: Date;
}

export interface SupplierOrderData {
  orderNumber: string;
  shopifyOrderId: string;
  language?: string;
  currency?: string;
  timezone?: string;
  items: Array<{
    sku: string;
    productName: string;
    quantity: number;
    price: number;
    notes?: string;
    weight?: number;
    dimensions?: string;
    hsCode?: string; // Harmonized System Code for customs
  }>;
  customer: {
    name: string;
    email: string;
    phone: string;
    country?: string;
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      cep?: string;
      zipCode?: string;
      country?: string;
    };
  };
  shipping: {
    method: string;
    cost: number;
    deadline: string;
    type?: 'domestic' | 'international';
    carrier?: string;
    service?: string;
  };
  payment: {
    method: string;
    status: string;
    total: number;
    currency?: string;
    exchangeRate?: number;
  };
  customs?: {
    value: number;
    currency: string;
    description: string;
    category: string;
  };
  metadata: {
    orderId: string;
    createdAt: string;
    priority: string;
    specialInstructions?: string;
    supplierCountry?: string;
    customerCountry?: string;
  };
}

export interface ChineseSupplierOrderData extends SupplierOrderData {
  chineseFields: {
    companyName: string;
    contactPerson: string;
    wechatId?: string;
    qqNumber?: string;
    alibabaAccount?: string;
    factoryAddress: string;
    businessLicense: string;
    notes: string;
  };
}

export class SupplierCommunicationService extends BaseService {
  protected entityName = 'SupplierCommunication';
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 segundos

  /**
   * Enviar pedido para fornecedor com suporte internacional
   */
  async sendOrderToSupplier(orderId: string, supplierId: string): Promise<SupplierApiResponse> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true
            }
          },
          supplier: true
        }
      });

      if (!order || !order.supplier) {
        throw new Error('Pedido ou fornecedor não encontrado');
      }

      // Detectar se é fornecedor chinês e preparar dados adequadamente
      const isChineseSupplier = await this.isChineseSupplier(order.supplier);
      const orderData = isChineseSupplier
        ? await this.prepareChineseOrderData(order)
        : await this.prepareOrderData(order);

      // Determinar idioma de comunicação
      const supplierLanguage = order.supplier.preferredLanguage ||
                               (isChineseSupplier ? 'zh-CN' : 'en');

      // Traduzir dados se necessário
      if (supplierLanguage !== 'en') {
        orderData.language = supplierLanguage;
        await this.translateOrderData(orderData, supplierLanguage);
      }

      // Enviar para fornecedor
      const response = await this.sendToSupplierApi(order.supplier, 'orders', orderData, supplierLanguage);

      if (response.success) {
        // Atualizar pedido com dados do fornecedor
        await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'PROCESSING',
            shopifyFulfillmentId: response.confirmationId ? BigInt(response.confirmationId) : null,
            updatedAt: new Date()
          }
        });

        // Registrar comunicação
        await this.logSupplierCommunication(orderId, supplierId, 'ORDER_SENT', response);

        // Agendar busca de tracking se fornecido
        if (response.trackingCode) {
          await addJob(trackingQueue, JobType.UPDATE_TRACKING_STATUS, {
            orderId,
            trackingCode: response.trackingCode,
            carrier: response.data?.carrier || 'UNKNOWN',
          } as TrackingJobData);
        }

        this.logOperation('sendOrderToSupplier', { orderId, supplierId, success: true });
      }

      return response;

    } catch (error) {
      logger.error('Erro ao enviar pedido para fornecedor', {
        orderId,
        supplierId,
        error: error.message
      });

      // Registrar falha
      await this.logSupplierCommunication(orderId, supplierId, 'ORDER_SEND_FAILED', {
        success: false,
        message: error.message,
        data: null
      });

      throw error;
    }
  }

  /**
   * Solicitar código de rastreamento
   */
  async requestTrackingCode(orderId: string): Promise<string | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { supplier: true }
      });

      if (!order || !order.supplier) {
        throw new Error('Pedido ou fornecedor não encontrado');
      }

      const response = await this.sendToSupplierApi(order.supplier, 'tracking', {
        orderNumber: order.shopifyOrderNumber,
        orderId: order.id
      });

      if (response.success && response.trackingCode) {
        // Atualizar pedido com código de rastreamento
        await prisma.order.update({
          where: { id: orderId },
          data: {
            trackingCode: response.trackingCode,
            carrier: response.data?.carrier || null,
            status: 'SHIPPED',
            updatedAt: new Date()
          }
        });

        // Registrar comunicação
        await this.logSupplierCommunication(orderId, order.supplier.id, 'TRACKING_RECEIVED', response);

        // Iniciar monitoramento de tracking
        await addJob(trackingQueue, JobType.FETCH_TRACKING_UPDATES, {
          orderId,
          trackingCode: response.trackingCode,
          carrier: response.data?.carrier || 'UNKNOWN',
        } as TrackingJobData);

        // Notificar cliente
        await this.notifyCustomerTrackingCode(order, response.trackingCode);

        this.logOperation('requestTrackingCode', { orderId, trackingCode: response.trackingCode });

        return response.trackingCode;
      }

      return null;

    } catch (error) {
      logger.error('Erro ao solicitar código de rastreamento', {
        orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Upload de fotos de produtos
   */
  async uploadProductPhotos(productId: string, photos: ProductPhoto[]): Promise<void> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          supplierProducts: {
            include: {
              supplier: true
            }
          }
        }
      });

      if (!product) {
        throw new Error('Produto não encontrado');
      }

      // Enviar fotos para cada fornecedor do produto
      for (const supplierProduct of product.supplierProducts) {
        const supplier = supplierProduct.supplier;

        if (supplier.apiEndpoint) {
          const response = await this.sendToSupplierApi(supplier, 'products/photos', {
            productId,
            sku: supplierProduct.supplierSku,
            photos: photos.map(photo => ({
              url: photo.url,
              description: photo.description,
              isPrimary: photo.isPrimary,
              uploadedAt: photo.uploadedAt.toISOString()
            }))
          });

          // Registrar comunicação
          await this.logSupplierCommunication(null, supplier.id, 'PHOTOS_UPLOADED', response);
        }
      }

      this.logOperation('uploadProductPhotos', { productId, photosCount: photos.length });

    } catch (error) {
      logger.error('Erro ao fazer upload de fotos', {
        productId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Confirmar recebimento de pedido pelo fornecedor
   */
  async confirmSupplierReceipt(orderId: string, confirmationData: Record<string, any>): Promise<void> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { supplier: true }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Atualizar status do pedido
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING',
          estimatedDelivery: confirmationData.estimatedDelivery
            ? new Date(confirmationData.estimatedDelivery)
            : null,
          updatedAt: new Date()
        }
      });

      // Registrar confirmação
      await this.logSupplierCommunication(orderId, order.supplierId!, 'RECEIPT_CONFIRMED', {
        success: true,
        message: 'Recebimento confirmado pelo fornecedor',
        data: confirmationData
      });

      this.logOperation('confirmSupplierReceipt', { orderId, confirmationData });

    } catch (error) {
      logger.error('Erro ao confirmar recebimento', {
        orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Preparar dados do pedido para envio
   */
  private prepareOrderData(order: any): SupplierOrderData {
    return {
      orderNumber: order.shopifyOrderNumber || order.id,
      shopifyOrderId: order.shopifyOrderId.toString(),
      items: order.orderItems.map((item: any) => ({
        sku: item.sku || item.product?.sku || 'N/A',
        productName: item.productName,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        notes: item.notes || undefined
      })),
      customer: {
        name: order.customer.name,
        email: order.customer.email || '',
        phone: order.customer.phone || '',
        address: {
          street: order.customer.addressStreet || '',
          number: order.customer.addressNumber || '',
          complement: order.customer.addressComplement || undefined,
          neighborhood: order.customer.addressNeighborhood || '',
          city: order.customer.addressCity || '',
          state: order.customer.addressState || '',
          cep: order.customer.addressCep || ''
        }
      },
      shipping: {
        method: 'STANDARD',
        cost: parseFloat(order.shippingAmount.toString()),
        deadline: '7 dias úteis'
      },
      payment: {
        method: 'CREDIT_CARD',
        status: order.paymentStatus || 'PAID',
        total: parseFloat(order.totalAmount.toString())
      },
      metadata: {
        orderId: order.id,
        createdAt: order.createdAt.toISOString(),
        priority: order.priority || 'normal',
        specialInstructions: order.specialInstructions || undefined
      }
    };
  }

  /**
   * Verificar se é fornecedor chinês
   */
  private async isChineseSupplier(supplier: any): Promise<boolean> {
    try {
      // Verificar se tem país configurado
      if (supplier.country?.code === 'CN') {
        return true;
      }

      // Verificar baseado no idioma preferido
      if (supplier.preferredLanguage === 'zh-CN') {
        return true;
      }

      // Verificar baseado no telefone (código +86)
      if (supplier.phone?.includes('+86') || supplier.phone?.startsWith('86')) {
        return true;
      }

      // Verificar baseado no endpoint da API
      if (supplier.apiEndpoint?.includes('.cn') || supplier.apiEndpoint?.includes('china')) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Erro ao verificar se é fornecedor chinês', { supplierId: supplier.id, error });
      return false;
    }
  }

  /**
   * Preparar dados específicos para fornecedores chineses
   */
  private async prepareChineseOrderData(order: any): Promise<ChineseSupplierOrderData> {
    const baseData = await this.prepareOrderData(order);

    return {
      ...baseData,
      language: 'zh-CN',
      currency: 'CNY',
      timezone: 'Asia/Shanghai',
      shipping: {
        ...baseData.shipping,
        type: 'international',
        carrier: 'CHINA_POST',
        service: 'EMS'
      },
      customs: {
        value: parseFloat(order.customsValue?.toString() || order.totalAmount.toString()),
        currency: order.currency || 'BRL',
        description: order.customsDescription || 'Consumer goods',
        category: 'consumer_goods'
      },
      metadata: {
        ...baseData.metadata,
        supplierCountry: 'CN',
        customerCountry: order.customer.country?.code || 'BR'
      },
      chineseFields: {
        companyName: order.supplier.companyName,
        contactPerson: order.supplier.contactPerson || '联系人',
        wechatId: order.supplier.wechatId,
        qqNumber: order.supplier.qqNumber,
        alibabaAccount: order.supplier.alibabaAccount,
        factoryAddress: order.supplier.addressStreet || '工厂地址',
        businessLicense: order.supplier.businessLicense || '',
        notes: `订单号: ${order.shopifyOrderNumber}\n客户: ${order.customer.name}\n总金额: ${order.totalAmount} ${order.currency}`
      }
    };
  }

  /**
   * Traduzir dados do pedido para o idioma do fornecedor
   */
  private async translateOrderData(orderData: SupplierOrderData, language: string): Promise<void> {
    try {
      // Traduzir nomes de produtos
      for (const item of orderData.items) {
        if (language === 'zh-CN') {
          // Para chinês, manter nome original + tradução se disponível
          const translatedName = await t(`product.${item.sku}`, language, {}, 'en');
          if (translatedName !== `product.${item.sku}`) {
            item.productName = `${item.productName} (${translatedName})`;
          }
        }
      }

      // Traduzir status de pagamento
      const paymentStatus = await t(`payment.status.${orderData.payment.status.toLowerCase()}`, language);
      if (paymentStatus !== `payment.status.${orderData.payment.status.toLowerCase()}`) {
        orderData.payment.status = paymentStatus;
      }

      // Traduzir método de envio
      const shippingMethod = await t(`shipping.method.${orderData.shipping.method.toLowerCase()}`, language);
      if (shippingMethod !== `shipping.method.${orderData.shipping.method.toLowerCase()}`) {
        orderData.shipping.method = shippingMethod;
      }

      // Traduzir instruções especiais
      if (orderData.metadata.specialInstructions) {
        const translatedInstructions = await t('order.special_instructions', language, {
          instructions: orderData.metadata.specialInstructions
        });
        orderData.metadata.specialInstructions = translatedInstructions;
      }

    } catch (error) {
      logger.error('Erro ao traduzir dados do pedido', { language, error });
      // Continuar sem tradução em caso de erro
    }
  }

  /**
   * Enviar dados para API do fornecedor
   */
  private async sendToSupplierApi(
    supplier: any,
    endpoint: string,
    data: any
  ): Promise<SupplierApiResponse> {
    const maxRetries = this.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const url = `${supplier.apiEndpoint}/${endpoint}`;
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supplier.apiKey}`,
          'X-FlowBot-Version': '1.0',
          'X-FlowBot-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };

        logger.info('Enviando dados para fornecedor', {
          supplierId: supplier.id,
          url,
          attempt,
          dataSize: JSON.stringify(data).length
        });

        const response: AxiosResponse = await axios.post(url, data, {
          headers,
          timeout: 30000 // 30 segundos
        });

        if (response.status === 200 || response.status === 201) {
          return {
            success: true,
            message: 'Dados enviados com sucesso',
            data: response.data.data,
            trackingCode: response.data.trackingCode,
            estimatedDelivery: response.data.estimatedDelivery,
            confirmationId: response.data.confirmationId
          };
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);

      } catch (error: any) {
        lastError = error;

        logger.warn('Tentativa de envio falhou', {
          supplierId: supplier.id,
          endpoint,
          attempt,
          error: error.message,
          willRetry: attempt < maxRetries
        });

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    // Todas as tentativas falharam
    throw new Error(`Falha ao comunicar com fornecedor após ${maxRetries} tentativas: ${lastError?.message}`);
  }

  /**
   * Registrar comunicação com fornecedor
   */
  private async logSupplierCommunication(
    orderId: string | null,
    supplierId: string,
    action: string,
    response: SupplierApiResponse
  ): Promise<void> {
    try {
      await prisma.supplierCommunication.create({
        data: {
          supplierId,
          orderId,
          action,
          request: null, // Implementar se necessário
          response: JSON.stringify(response),
          success: response.success,
          responseTime: 0, // Implementar medição se necessário
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao registrar comunicação com fornecedor', {
        orderId,
        supplierId,
        action,
        error: error.message
      });
    }
  }

  /**
   * Notificar cliente sobre código de rastreamento
   */
  private async notifyCustomerTrackingCode(order: any, trackingCode: string): Promise<void> {
    if (order.customer.phone) {
      const message = `*Código de Rastreamento - Pedido ${order.shopifyOrderNumber}*\n\n` +
                     `Seu pedido foi enviado! 🚚\n\n` +
                     `**Código de Rastreamento:** ${trackingCode}\n\n` +
                     `Você pode acompanhar o status da entrega diretamente pelo código acima.\n\n` +
                     `Data do envio: ${formatDateTime(new Date())}`;

      await addJob(notificationQueue, JobType.SEND_WHATSAPP_MESSAGE, {
        type: 'whatsapp',
        recipient: order.customer.phone,
        message,
        orderId: order.id,
        templateId: 'tracking_code'
      } as NotificationJobData);
    }
  }

  /**
   * Obter histórico de comunicações com fornecedor
   */
  async getSupplierCommunicationHistory(supplierId: string, limit: number = 50): Promise<any[]> {
    try {
      const communications = await prisma.supplierCommunication.findMany({
        where: { supplierId },
        include: {
          order: {
            select: {
              id: true,
              shopifyOrderNumber: true,
              status: true,
              totalAmount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return communications.map(comm => ({
        id: comm.id,
        action: comm.action,
        success: comm.success,
        responseTime: comm.responseTime,
        createdAt: comm.createdAt,
        order: comm.order,
        response: comm.response ? JSON.parse(comm.response) : null
      }));

    } catch (error) {
      logger.error('Erro ao obter histórico de comunicações', {
        supplierId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas de comunicação
   */
  async getSupplierCommunicationStats(): Promise<Record<string, any>> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = await prisma.supplierCommunication.groupBy({
        by: ['supplierId', 'success'],
        where: {
          createdAt: {
            gte: today
          }
        },
        _count: {
          success: true
        }
      });

      const avgResponseTime = await prisma.supplierCommunication.aggregate({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
          },
          responseTime: {
            gt: 0
          }
        },
        _avg: {
          responseTime: true
        }
      });

      return {
        totalCommunications: stats.reduce((sum, stat) => sum + stat._count.success, 0),
        successRate: this.calculateSuccessRate(stats),
        averageResponseTime: avgResponseTime._avg.responseTime || 0,
        bySupplier: this.groupStatsBySupplier(stats),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Erro ao obter estatísticas de comunicação', { error: error.message });
      throw error;
    }
  }

  private calculateSuccessRate(stats: any[]): number {
    const total = stats.reduce((sum, stat) => sum + stat._count.success, 0);
    const successful = stats
      .filter(stat => stat.success)
      .reduce((sum, stat) => sum + stat._count.success, 0);

    return total > 0 ? (successful / total) * 100 : 0;
  }

  private groupStatsBySupplier(stats: any[]): Record<string, any> {
    const grouped: Record<string, any> = {};

    stats.forEach(stat => {
      if (!grouped[stat.supplierId]) {
        grouped[stat.supplierId] = { total: 0, successful: 0 };
      }

      grouped[stat.supplierId].total += stat._count.success;

      if (stat.success) {
        grouped[stat.supplierId].successful += stat._count.success;
      }
    });

    // Calcular taxa de sucesso para cada fornecedor
    Object.keys(grouped).forEach(supplierId => {
      const stats = grouped[supplierId];
      stats.successRate = (stats.successful / stats.total) * 100;
    });

    return grouped;
  }
}
