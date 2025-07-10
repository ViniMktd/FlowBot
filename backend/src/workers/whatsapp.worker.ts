import { Job } from 'bull';
import { logger } from '../config/logger';
import { WhatsAppService } from '../services/whatsapp.service';
import { BrazilianTimeUtils } from '../utils/brazilian';

/**
 * Worker para processamento de mensagens WhatsApp
 */
export class WhatsAppWorker {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Enviar mensagem de confirmação de pedido
   */
  async sendOrderConfirmation(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber } = job.data;

    try {
      logger.info(`📱 Enviando confirmação de pedido via WhatsApp: ${orderId}`, {
        jobId: job.id,
        customerPhone,
        orderNumber
      });

      const message = `Olá ${customerName}! 🎉\n\n` +
        `Seu pedido #${orderNumber} foi confirmado com sucesso!\n\n` +
        `📦 Status: Processando\n` +
        `⏰ Recebido em: ${BrazilianTimeUtils.now().format('DD/MM/YYYY HH:mm')}\n\n` +
        `Em breve você receberá o código de rastreamento.\n\n` +
        `Obrigado pela preferência! 🙏`;

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Confirmação de pedido enviada: ${orderId}`, {
        jobId: job.id,
        customerPhone
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar confirmação de pedido: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação de envio com código de rastreamento
   */
  async sendShippingNotification(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber, trackingCode } = job.data;

    try {
      logger.info(`📦 Enviando notificação de envio: ${orderId}`, {
        jobId: job.id,
        customerPhone,
        trackingCode
      });

      const message = `Oi ${customerName}! 📦\n\n` +
        `Seu pedido #${orderNumber} foi enviado!\n\n` +
        `🚚 Código de rastreamento: ${trackingCode}\n` +
        `📅 Enviado em: ${BrazilianTimeUtils.now().format('DD/MM/YYYY HH:mm')}\n\n` +
        `Acompanhe sua entrega pelos Correios:\n` +
        `https://www.correios.com.br/rastreamento\n\n` +
        `Previsão de entrega: 3-7 dias úteis 📅`;

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Notificação de envio enviada: ${orderId}`, {
        jobId: job.id,
        trackingCode
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação de envio: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação de entrega
   */
  async sendDeliveryNotification(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber } = job.data;

    try {
      logger.info(`🎉 Enviando notificação de entrega: ${orderId}`, {
        jobId: job.id,
        customerPhone
      });

      const message = `Parabéns ${customerName}! 🎉\n\n` +
        `Seu pedido #${orderNumber} foi entregue com sucesso!\n\n` +
        `📅 Entregue em: ${BrazilianTimeUtils.now().format('DD/MM/YYYY HH:mm')}\n\n` +
        `Esperamos que você esteja satisfeito com sua compra! 😊\n\n` +
        `Avalie sua experiência conosco e ganhe 10% de desconto na próxima compra! 🎁`;

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Notificação de entrega enviada: ${orderId}`, {
        jobId: job.id
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação de entrega: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação de cancelamento
   */
  async sendCancellationNotification(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber, reason } = job.data;

    try {
      logger.info(`❌ Enviando notificação de cancelamento: ${orderId}`, {
        jobId: job.id,
        customerPhone,
        reason
      });

      const message = `Olá ${customerName},\n\n` +
        `Infelizmente seu pedido #${orderNumber} foi cancelado.\n\n` +
        `📅 Cancelado em: ${BrazilianTimeUtils.now().format('DD/MM/YYYY HH:mm')}\n` +
        `💡 Motivo: ${reason}\n\n` +
        `O reembolso será processado em até 5 dias úteis.\n\n` +
        `Desculpe pelo transtorno. Entre em contato se tiver dúvidas! 💬`;

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Notificação de cancelamento enviada: ${orderId}`, {
        jobId: job.id
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação de cancelamento: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar lembrete de avaliação
   */
  async sendReviewReminder(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber } = job.data;

    try {
      logger.info(`⭐ Enviando lembrete de avaliação: ${orderId}`, {
        jobId: job.id,
        customerPhone
      });

      const message = `Oi ${customerName}! ⭐\n\n` +
        `Esperamos que você esteja satisfeito com seu pedido #${orderNumber}!\n\n` +
        `Que tal avaliar sua experiência conosco? Sua opinião é muito importante! 📝\n\n` +
        `✅ Avalie nosso atendimento\n` +
        `✅ Qualidade dos produtos\n` +
        `✅ Velocidade de entrega\n\n` +
        `Como agradecimento, você ganhará 10% de desconto na próxima compra! 🎁`;

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Lembrete de avaliação enviado: ${orderId}`, {
        jobId: job.id
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar lembrete de avaliação: ${orderId}`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar mensagem personalizada
   */
  async sendCustomMessage(job: Job): Promise<void> {
    const { customerPhone, message, orderId } = job.data;

    try {
      logger.info(`💬 Enviando mensagem personalizada`, {
        jobId: job.id,
        customerPhone,
        orderId
      });

      await this.sendWhatsAppMessage(customerPhone, message);
      await job.progress(100);

      logger.info(`✅ Mensagem personalizada enviada`, {
        jobId: job.id,
        customerPhone
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar mensagem personalizada`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar mensagem recebida
   */
  async processIncomingMessage(job: Job): Promise<void> {
    const { messageId, customerPhone, message } = job.data;

    try {
      logger.info(`📥 Processando mensagem recebida`, {
        jobId: job.id,
        messageId,
        customerPhone
      });

      // Analisar conteúdo da mensagem
      const intent = await this.analyzeMessageIntent(message);

      // Responder baseado na intenção
      await this.respondToMessage(customerPhone, intent);

      await job.progress(100);

      logger.info(`✅ Mensagem processada`, {
        jobId: job.id,
        messageId,
        intent
      });

    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem recebida`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /* ==========================================
     MÉTODOS AUXILIARES PRIVADOS
     ========================================== */

  private async sendWhatsAppMessage(customerPhone: string, message: string): Promise<void> {
    await this.whatsappService.sendMessage({
      customerId: customerPhone,
      phone: customerPhone,
      messageType: 'text',
      data: { message }
    });
  }

  private async analyzeMessageIntent(message: string): Promise<string> {
    const lowerMessage = message.toLowerCase();

    // Intenções básicas
    if (lowerMessage.includes('pedido') || lowerMessage.includes('compra')) {
      return 'ORDER_INQUIRY';
    }

    if (lowerMessage.includes('rastreamento') || lowerMessage.includes('entrega')) {
      return 'TRACKING_INQUIRY';
    }

    if (lowerMessage.includes('cancelar') || lowerMessage.includes('cancelamento')) {
      return 'CANCELLATION_REQUEST';
    }

    if (lowerMessage.includes('problema') || lowerMessage.includes('reclamação')) {
      return 'COMPLAINT';
    }

    if (lowerMessage.includes('ajuda') || lowerMessage.includes('suporte')) {
      return 'SUPPORT_REQUEST';
    }

    return 'GENERAL_INQUIRY';
  }

  private async respondToMessage(customerPhone: string, intent: string): Promise<void> {
    let response: string;

    switch (intent) {
      case 'ORDER_INQUIRY':
        response = `Olá! Vi que você tem uma dúvida sobre seu pedido. 📦\n\n` +
          `Para consultar o status do seu pedido, me informe o número do pedido.\n\n` +
          `Posso ajudar em mais alguma coisa? 😊`;
        break;

      case 'TRACKING_INQUIRY':
        response = `Oi! Vou te ajudar com o rastreamento! 📦\n\n` +
          `Me informe o número do seu pedido ou código de rastreamento.\n\n` +
          `Também posso consultar diretamente nos Correios para você! 📮`;
        break;

      case 'CANCELLATION_REQUEST':
        response = `Entendo que você quer cancelar seu pedido. 😔\n\n` +
          `Me informe o número do pedido que deseja cancelar.\n\n` +
          `Vou verificar se ainda é possível cancelar e te ajudo com o processo! 💙`;
        break;

      case 'COMPLAINT':
        response = `Sinto muito pelo transtorno! 😔\n\n` +
          `Sua satisfação é muito importante para nós.\n\n` +
          `Me conte mais detalhes sobre o problema para que eu possa te ajudar da melhor forma! 💬`;
        break;

      case 'SUPPORT_REQUEST':
        response = `Olá! Estou aqui para te ajudar! 😊\n\n` +
          `Posso te ajudar com:\n` +
          `📦 Status do pedido\n` +
          `🚚 Rastreamento\n` +
          `❌ Cancelamentos\n` +
          `💬 Dúvidas gerais\n\n` +
          `O que você precisa?`;
        break;

      default:
        response = `Oi! Obrigado pela mensagem! 😊\n\n` +
          `Estou aqui para te ajudar com qualquer dúvida sobre seus pedidos.\n\n` +
          `Como posso te ajudar hoje? 💬`;
    }

    await this.sendWhatsAppMessage(customerPhone, response);
  }
}

// Instância singleton do worker
export const whatsappWorker = new WhatsAppWorker();
