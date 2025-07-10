import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { i18nService } from './i18n.service';
// import { translationService } from './translation.service';
import { templateService } from './template.service';
import { WhatsAppService } from './whatsapp.service';
import { SupplierCommunicationService } from './supplier-communication.service';
import { InternationalValidator } from '../utils/international-validators';

export interface InternationalCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  country?: {
    code: string;
    name: string;
    language: string;
    currency: string;
    timezone: string;
  };
  preferredLanguage?: string;
  documentType?: string;
  documentNumber?: string;
}

export interface InternationalOrder {
  id: string;
  orderNumber: string;
  customer: InternationalCustomer;
  supplier?: any;
  items: any[];
  totalAmount: number;
  currency: string;
  customerLanguage: string;
  supplierLanguage?: string;
  isInternational: boolean;
  requiresTranslation: boolean;
}

export class InternationalIntegrationService {
  private static instance: InternationalIntegrationService;
  private whatsappService: WhatsAppService;
  private supplierService: SupplierCommunicationService;

  private constructor() {
    this.whatsappService = new WhatsAppService();
    this.supplierService = new SupplierCommunicationService();
  }

  public static getInstance(): InternationalIntegrationService {
    if (!InternationalIntegrationService.instance) {
      InternationalIntegrationService.instance = new InternationalIntegrationService();
    }
    return InternationalIntegrationService.instance;
  }

  /**
   * Processar novo pedido internacional
   */
  async processInternationalOrder(orderId: string): Promise<void> {
    try {
      logger.info('Processing international order', { orderId });

      // Buscar pedido com informações completas
      const order = await this.getOrderWithInternationalData(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Detectar configuração internacional
      const internationalConfig = await this.detectInternationalConfiguration(order);
      
      // Atualizar pedido com configurações internacionais
      await this.updateOrderInternationalFields(order, internationalConfig);

      // Processar comunicações
      await this.processCustomerCommunication(order, internationalConfig);
      
      if (order.supplier) {
        await this.processSupplierCommunication(order, internationalConfig);
      }

      // Validar documentos se necessário
      if (internationalConfig.requiresDocumentValidation) {
        await this.validateInternationalDocuments(order);
      }

      logger.info('International order processed successfully', { 
        orderId,
        customerLanguage: internationalConfig.customerLanguage,
        supplierLanguage: internationalConfig.supplierLanguage,
        isInternational: internationalConfig.isInternational
      });

    } catch (error) {
      logger.error('Error processing international order', {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar confirmação de pedido em múltiplos idiomas
   */
  async sendMultilingualOrderConfirmation(orderId: string): Promise<void> {
    try {
      const order = await this.getOrderWithInternationalData(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const customerLanguage = order.customerLanguage || 'pt-BR';
      
      // Preparar contexto para template
      const templateContext = {
        language: customerLanguage,
        country: order.customer.country?.code || 'BR',
        timezone: order.customer.country?.timezone || 'America/Sao_Paulo',
        currency: order.currency || 'BRL',
        customerName: order.customer.name,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        itemCount: order.items.length
      };

      // Gerar template formatado
      const template = await templateService.getFormattedTemplate(
        'order_confirmation',
        'whatsapp',
        templateContext
      );

      if (template && order.customer.phone) {
        await this.whatsappService.sendMessage({
          customerId: order.customer.id,
          phone: order.customer.phone,
          messageType: 'text',
          data: { message: template.content }
        });
      }

      logger.info('Multilingual order confirmation sent', {
        orderId,
        language: customerLanguage,
        hasPhone: !!order.customer.phone
      });

    } catch (error) {
      logger.error('Error sending multilingual order confirmation', {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar comunicação com fornecedor chinês
   */
  async processChineseSupplierCommunication(orderId: string, supplierId: string): Promise<void> {
    try {
      const order = await this.getOrderWithInternationalData(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Usar o serviço de comunicação com fornecedores
      await this.supplierService.sendOrderToSupplier(orderId, supplierId);

      logger.info('Chinese supplier communication processed', {
        orderId,
        supplierId
      });

    } catch (error) {
      logger.error('Error processing Chinese supplier communication', {
        orderId,
        supplierId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Detectar e configurar cliente internacional
   */
  async detectAndConfigureInternationalCustomer(customerId: string): Promise<InternationalCustomer> {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { country: true }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      let detectedLanguage = customer.preferredLanguage;
      let detectedCountry = customer.country;

      // Detectar idioma baseado no telefone se não configurado
      if (!detectedLanguage && customer.phone) {
        detectedLanguage = i18nService.getLanguageByPhoneNumber(customer.phone);
      }

      // Detectar país baseado no telefone se não configurado
      if (!detectedCountry && customer.phone) {
        const phoneCountry = await this.detectCountryByPhone(customer.phone);
        if (phoneCountry) {
          detectedCountry = phoneCountry;
          
          // Atualizar cliente com país detectado
          await prisma.customer.update({
            where: { id: customerId },
            data: { 
              countryId: phoneCountry.id,
              preferredLanguage: detectedLanguage || phoneCountry.language
            }
          });
        }
      }

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email || undefined,
        phone: customer.phone || undefined,
        country: detectedCountry ? {
          code: detectedCountry.code,
          name: detectedCountry.name,
          language: detectedCountry.language,
          currency: detectedCountry.currency,
          timezone: detectedCountry.timezone
        } : undefined,
        preferredLanguage: detectedLanguage || 'pt-BR',
        documentType: customer.documentType || undefined,
        documentNumber: customer.documentNumber || undefined
      };

    } catch (error) {
      logger.error('Error detecting international customer', {
        customerId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas de pedidos internacionais
   */
  async getInternationalOrderStats(): Promise<Record<string, any>> {
    try {
      const stats = await prisma.order.groupBy({
        by: ['customerLanguage'],
        where: {
          customerLanguage: {
            not: 'pt-BR'
          }
        },
        _count: {
          customerLanguage: true
        }
      });

      const totalInternational = stats.reduce((sum, stat) => sum + stat._count.customerLanguage, 0);
      
      const supplierStats = await prisma.supplier.groupBy({
        by: ['preferredLanguage'],
        where: {
          preferredLanguage: {
            not: 'pt-BR'
          }
        },
        _count: {
          preferredLanguage: true
        }
      });

      return {
        totalInternationalOrders: totalInternational,
        ordersByLanguage: stats.reduce((acc, stat) => {
          if (stat.customerLanguage) {
            acc[stat.customerLanguage] = stat._count.customerLanguage;
          }
          return acc;
        }, {} as Record<string, number>),
        internationalSuppliers: supplierStats.reduce((sum, stat) => sum + stat._count.preferredLanguage, 0),
        suppliersByLanguage: supplierStats.reduce((acc, stat) => {
          if (stat.preferredLanguage) {
            acc[stat.preferredLanguage] = stat._count.preferredLanguage;
          }
          return acc;
        }, {} as Record<string, number>),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Error getting international order stats', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  // Métodos privados
  private async getOrderWithInternationalData(orderId: string): Promise<InternationalOrder | null> {
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          customer: {
            include: { country: true }
          },
          supplier: {
            include: { country: true }
          },
          orderItems: {
            include: { product: true }
          }
        }
      });

      if (!order) {
        return null;
      }

      return {
        id: order.id,
        orderNumber: order.shopifyOrderNumber || order.id,
        customer: {
          id: order.customer.id,
          name: order.customer.name,
          email: order.customer.email || undefined,
          phone: order.customer.phone || undefined,
          country: order.customer.country ? {
            code: order.customer.country.code,
            name: order.customer.country.name,
            language: order.customer.country.language,
            currency: order.customer.country.currency,
            timezone: order.customer.country.timezone
          } : undefined,
          preferredLanguage: order.customer.preferredLanguage || undefined,
          documentType: order.customer.documentType || undefined,
          documentNumber: order.customer.documentNumber || undefined
        },
        supplier: order.supplier,
        items: order.orderItems,
        totalAmount: parseFloat(order.totalAmount.toString()),
        currency: order.customer.country?.currency || 'BRL',
        customerLanguage: order.customerLanguage || 'pt-BR',
        supplierLanguage: order.supplierLanguage,
        isInternational: (order.customer.country?.code !== 'BR') || (order.supplier?.country?.code !== 'BR'),
        requiresTranslation: order.customerLanguage !== 'pt-BR' || order.supplierLanguage !== 'pt-BR'
      };

    } catch (error) {
      logger.error('Error getting order with international data', {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  private async detectInternationalConfiguration(order: InternationalOrder) {
    const customerLanguage = order.customer.preferredLanguage || 
                            order.customer.country?.language || 
                            'pt-BR';

    const supplierLanguage = order.supplier?.preferredLanguage || 
                            order.supplier?.country?.language || 
                            'pt-BR';

    const isInternational = order.customer.country?.code !== 'BR' || 
                           order.supplier?.country?.code !== 'BR';

    const requiresTranslation = customerLanguage !== 'pt-BR' || supplierLanguage !== 'pt-BR';

    const requiresDocumentValidation = isInternational && 
                                     (order.customer.documentNumber || order.supplier?.taxId);

    return {
      customerLanguage,
      supplierLanguage,
      isInternational,
      requiresTranslation,
      requiresDocumentValidation,
      customerCountry: order.customer.country?.code || 'BR',
      supplierCountry: order.supplier?.country?.code || 'BR'
    };
  }

  private async updateOrderInternationalFields(order: InternationalOrder, config: any): Promise<void> {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        customerLanguage: config.customerLanguage,
        supplierLanguage: config.supplierLanguage,
        countryId: order.customer.country?.code ? 
          (await prisma.country.findUnique({ where: { code: order.customer.country.code } }))?.id : null
      }
    });
  }

  private async processCustomerCommunication(_order: InternationalOrder, _config: any): Promise<void> {
    // Já será tratado pelos métodos de envio de confirmação
  }

  private async processSupplierCommunication(order: InternationalOrder, config: any): Promise<void> {
    if (config.supplierLanguage !== 'pt-BR' && order.supplier) {
      await this.supplierService.sendOrderToSupplier(order.id, order.supplier.id);
    }
  }

  private async validateInternationalDocuments(order: InternationalOrder): Promise<void> {
    if (order.customer.documentNumber && order.customer.country) {
      const validation = InternationalValidator.validateDocument(
        order.customer.documentNumber,
        order.customer.country.code,
        order.customer.documentType
      );

      if (!validation.isValid) {
        logger.warn('Invalid customer document', {
          orderId: order.id,
          documentNumber: order.customer.documentNumber,
          country: order.customer.country.code,
          errors: validation.errors
        });
      }
    }
  }

  private async detectCountryByPhone(phone: string): Promise<any> {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Mapear prefixos comuns para códigos de países
    const prefixToCountry: Record<string, string> = {
      '+55': 'BR',
      '+1': 'US',
      '+86': 'CN',
      '+44': 'GB',
      '+49': 'DE',
      '+33': 'FR',
      '+39': 'IT',
      '+34': 'ES',
      '+52': 'MX',
      '+81': 'JP',
      '+82': 'KR',
      '+91': 'IN'
    };

    for (const [prefix, countryCode] of Object.entries(prefixToCountry)) {
      if (cleanPhone.startsWith(prefix)) {
        return await prisma.country.findUnique({
          where: { code: countryCode }
        });
      }
    }

    return null;
  }
}

// Singleton instance
export const internationalIntegrationService = InternationalIntegrationService.getInstance();