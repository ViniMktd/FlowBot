import { Request, Response } from 'express';
import { MercadoPagoService } from '../services/mercadopago.service';
import { WhatsAppService } from '../services/whatsapp.service';
import { I18nService } from '../services/i18n.service';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';
// import { prisma } from '../config/database'; // Uncomment when Prisma is configured

/**
 * Controller para processar webhooks do MercadoPago
 */
export class MercadoPagoWebhooksController {
  private static mercadoPagoService: MercadoPagoService;
  private static whatsappService: WhatsAppService;
  private static i18nService: I18nService;

  static init() {
    this.mercadoPagoService = new MercadoPagoService();
    this.whatsappService = new WhatsAppService();
    this.i18nService = new I18nService();
  }

  /**
   * @desc    Handle MercadoPago payment webhooks
   * @route   POST /api/webhooks/mercadopago
   * @access  Public (verified by webhook signature)
   */
  static handlePaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
    const { type, data, action } = req.body;

    logger.info('Webhook recebido do MercadoPago:', {
      type,
      action,
      dataId: data?.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Processar apenas webhooks de pagamento
      if (type === 'payment') {
        await this.processPaymentWebhook(data.id, action);
      }

      // Sempre responder 200 para evitar reenvio
      res.status(200).json({ 
        success: true, 
        message: 'Webhook processado com sucesso' 
      });

    } catch (error) {
      logger.error('Erro ao processar webhook do MercadoPago:', error);
      
      // Mesmo com erro, responder 200 para evitar spam de webhooks
      res.status(200).json({ 
        success: false, 
        message: 'Erro interno, será processado novamente' 
      });
    }
  });

  /**
   * Processar webhook de pagamento
   */
  private static async processPaymentWebhook(paymentId: string, action: string) {
    try {
      // Buscar detalhes do pagamento no MercadoPago
      const payment = await this.mercadoPagoService.getPayment(paymentId);
      
      logger.info('Processando webhook de pagamento:', {
        paymentId,
        status: payment.status,
        action,
        externalReference: payment.external_reference,
      });

      // Atualizar status do pagamento no banco local
      await this.updateLocalPayment(payment);

      // Processar ações baseadas no status
      switch (payment.status) {
        case 'approved':
          await this.handlePaymentApproved(payment);
          break;
          
        case 'pending':
          await this.handlePaymentPending(payment);
          break;
          
        case 'cancelled':
        case 'rejected':
          await this.handlePaymentFailed(payment);
          break;
          
        case 'refunded':
          await this.handlePaymentRefunded(payment);
          break;
          
        default:
          logger.info('Status de pagamento não requer ação:', payment.status);
      }

      // Emitir evento via WebSocket para dashboard em tempo real
      if (global.io) {
        global.io.to('dashboard').emit('payment_update', {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.transaction_amount,
          externalReference: payment.external_reference,
          timestamp: new Date().toISOString(),
        });
      }

    } catch (error) {
      logger.error('Erro ao processar webhook de pagamento:', error);
      throw error;
    }
  }

  /**
   * Atualizar pagamento no banco local
   */
  private static async updateLocalPayment(payment: any) {
    try {
      // TODO: Implementar quando Prisma estiver configurado
      /*
      const updatedPayment = await prisma.payment.update({
        where: { mpPaymentId: payment.id.toString() },
        data: {
          status: MercadoPagoService.mapPaymentStatus(payment.status),
          statusDetail: payment.status_detail,
          approvedAt: payment.date_approved ? new Date(payment.date_approved) : null,
          updatedAt: new Date(),
        },
        include: {
          order: {
            include: {
              cliente: true,
            },
          },
        },
      });

      return updatedPayment;
      */

      // Simulação para demonstração
      logger.info('Pagamento atualizado no banco local (simulado):', {
        paymentId: payment.id,
        status: MercadoPagoService.mapPaymentStatus(payment.status),
      });

      return {
        id: payment.id,
        status: MercadoPagoService.mapPaymentStatus(payment.status),
        order: {
          id: 1,
          numeroPedido: 'FLW-001',
          cliente: {
            nome: 'Cliente Demo',
            telefone: '+5511999999999',
            email: 'cliente@demo.com',
            country: 'BR',
          },
        },
      };

    } catch (error) {
      logger.error('Erro ao atualizar pagamento no banco:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento aprovado
   */
  private static async handlePaymentApproved(payment: any) {
    try {
      logger.info('Processando pagamento aprovado:', {
        paymentId: payment.id,
        amount: payment.transaction_amount,
        externalReference: payment.external_reference,
      });

      // Buscar informações do pedido
      const localPayment = await this.updateLocalPayment(payment);

      // TODO: Atualizar status do pedido para confirmado
      /*
      await prisma.order.update({
        where: { id: localPayment.order.id },
        data: { 
          status: 'CONFIRMADO',
          updatedAt: new Date(),
        },
      });
      */

      // Enviar confirmação para o cliente
      await this.sendPaymentConfirmationToCustomer(payment, localPayment);

      // Iniciar processo de fulfillment
      await this.initiateOrderFulfillment(localPayment.order);

      logger.info('Pagamento aprovado processado com sucesso:', {
        paymentId: payment.id,
        orderId: localPayment.order.id,
      });

    } catch (error) {
      logger.error('Erro ao processar pagamento aprovado:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento pendente
   */
  private static async handlePaymentPending(payment: any) {
    try {
      logger.info('Processando pagamento pendente:', {
        paymentId: payment.id,
        statusDetail: payment.status_detail,
      });

      const localPayment = await this.updateLocalPayment(payment);

      // Enviar instruções para o cliente (PIX, boleto, etc.)
      await this.sendPaymentInstructionsToCustomer(payment, localPayment);

    } catch (error) {
      logger.error('Erro ao processar pagamento pendente:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento falhado
   */
  private static async handlePaymentFailed(payment: any) {
    try {
      logger.info('Processando pagamento falhado:', {
        paymentId: payment.id,
        status: payment.status,
        statusDetail: payment.status_detail,
      });

      const localPayment = await this.updateLocalPayment(payment);

      // Notificar cliente sobre falha
      await this.sendPaymentFailureNotification(payment, localPayment);

    } catch (error) {
      logger.error('Erro ao processar pagamento falhado:', error);
      throw error;
    }
  }

  /**
   * Processar pagamento reembolsado
   */
  private static async handlePaymentRefunded(payment: any) {
    try {
      logger.info('Processando pagamento reembolsado:', {
        paymentId: payment.id,
        amount: payment.transaction_amount,
      });

      const localPayment = await this.updateLocalPayment(payment);

      // Notificar cliente sobre reembolso
      await this.sendRefundNotificationToCustomer(payment, localPayment);

    } catch (error) {
      logger.error('Erro ao processar reembolso:', error);
      throw error;
    }
  }

  /**
   * Enviar confirmação de pagamento para o cliente
   */
  private static async sendPaymentConfirmationToCustomer(payment: any, localPayment: any) {
    try {
      const customer = localPayment.order.cliente;
      
      if (!customer.telefone) {
        logger.warn('Cliente não possui telefone para notificação');
        return;
      }

      const language = this.detectLanguageFromCountry(customer.country || 'BR');

      const template = await this.i18nService.translate(
        'whatsapp.payment_approved',
        language,
        {
          customerName: customer.nome,
          orderNumber: localPayment.order.numeroPedido,
          amount: payment.transaction_amount,
          paymentMethod: this.getPaymentMethodName(payment.payment_method_id),
        }
      );

      await this.whatsappService.sendMessage(
        customer.telefone,
        template,
        language
      );

      logger.info('Confirmação de pagamento enviada:', {
        paymentId: payment.id,
        customerPhone: customer.telefone,
        language,
      });

    } catch (error) {
      logger.error('Erro ao enviar confirmação de pagamento:', error);
    }
  }

  /**
   * Enviar instruções de pagamento para o cliente
   */
  private static async sendPaymentInstructionsToCustomer(payment: any, localPayment: any) {
    try {
      const customer = localPayment.order.cliente;
      
      if (!customer.telefone) return;

      const language = this.detectLanguageFromCountry(customer.country || 'BR');

      let template: string;
      let additionalData: any = {};

      if (payment.payment_method_id === 'pix') {
        // Instruções para PIX
        template = await this.i18nService.translate(
          'whatsapp.pix_instructions',
          language,
          {
            customerName: customer.nome,
            orderNumber: localPayment.order.numeroPedido,
            amount: payment.transaction_amount,
            expirationTime: '30 minutos',
          }
        );

        // Aqui poderia enviar o QR Code como anexo
        additionalData.qrCode = payment.point_of_interaction?.transaction_data?.qr_code;
      } else {
        // Instruções genéricas para outros métodos
        template = await this.i18nService.translate(
          'whatsapp.payment_pending',
          language,
          {
            customerName: customer.nome,
            orderNumber: localPayment.order.numeroPedido,
            paymentMethod: this.getPaymentMethodName(payment.payment_method_id),
          }
        );
      }

      await this.whatsappService.sendMessage(
        customer.telefone,
        template,
        language,
        additionalData
      );

    } catch (error) {
      logger.error('Erro ao enviar instruções de pagamento:', error);
    }
  }

  /**
   * Enviar notificação de falha no pagamento
   */
  private static async sendPaymentFailureNotification(payment: any, localPayment: any) {
    try {
      const customer = localPayment.order.cliente;
      
      if (!customer.telefone) return;

      const language = this.detectLanguageFromCountry(customer.country || 'BR');

      const template = await this.i18nService.translate(
        'whatsapp.payment_failed',
        language,
        {
          customerName: customer.nome,
          orderNumber: localPayment.order.numeroPedido,
          failureReason: this.getFailureReason(payment.status_detail),
        }
      );

      await this.whatsappService.sendMessage(
        customer.telefone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao enviar notificação de falha:', error);
    }
  }

  /**
   * Enviar notificação de reembolso
   */
  private static async sendRefundNotificationToCustomer(payment: any, localPayment: any) {
    try {
      const customer = localPayment.order.cliente;
      
      if (!customer.telefone) return;

      const language = this.detectLanguageFromCountry(customer.country || 'BR');

      const template = await this.i18nService.translate(
        'whatsapp.payment_refunded',
        language,
        {
          customerName: customer.nome,
          orderNumber: localPayment.order.numeroPedido,
          amount: payment.transaction_amount,
        }
      );

      await this.whatsappService.sendMessage(
        customer.telefone,
        template,
        language
      );

    } catch (error) {
      logger.error('Erro ao enviar notificação de reembolso:', error);
    }
  }

  /**
   * Iniciar processo de fulfillment
   */
  private static async initiateOrderFulfillment(order: any) {
    try {
      // TODO: Implementar lógica de fulfillment
      logger.info('Iniciando fulfillment para pedido:', {
        orderId: order.id,
        orderNumber: order.numeroPedido,
      });

      // Aqui seria feita a atribuição de fornecedor, criação de tarefas, etc.
    } catch (error) {
      logger.error('Erro ao iniciar fulfillment:', error);
    }
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

  /**
   * Obter nome do método de pagamento
   */
  private static getPaymentMethodName(methodId: string): string {
    const methodNames: Record<string, string> = {
      'pix': 'PIX',
      'visa': 'Visa',
      'master': 'Mastercard',
      'amex': 'American Express',
      'elo': 'Elo',
      'bolbradesco': 'Boleto',
      'account_money': 'Saldo MercadoPago',
    };
    return methodNames[methodId] || methodId;
  }

  /**
   * Obter motivo de falha legível
   */
  private static getFailureReason(statusDetail: string): string {
    const failureReasons: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Saldo insuficiente',
      'cc_rejected_bad_filled_date': 'Data de vencimento inválida',
      'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
      'cc_rejected_bad_filled_card_number': 'Número do cartão inválido',
      'cc_rejected_call_for_authorize': 'Autorização negada pelo banco',
      'cc_rejected_card_disabled': 'Cartão desabilitado',
      'cc_rejected_duplicated_payment': 'Pagamento duplicado',
      'cc_rejected_high_risk': 'Transação negada por risco',
    };
    return failureReasons[statusDetail] || 'Erro no processamento';
  }
}

// Inicializar o controller
MercadoPagoWebhooksController.init();

export default MercadoPagoWebhooksController;