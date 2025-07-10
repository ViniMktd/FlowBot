import { Job } from 'bull';
import { logger } from '../config/logger';

/**
 * Worker para processamento de mensagens WhatsApp
 */
export class WhatsAppWorker {
  /**
   * Enviar mensagem de confirmação de pedido
   */
  async sendOrderConfirmation(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, orderNumber } = job.data;
    
    try {
      logger.info(`📱 Enviando confirmação de pedido via WhatsApp`, {
        orderId,
        customerPhone,
        jobId: job.id
      });

      // Simular envio da mensagem
      const message = `Olá ${customerName}! Seu pedido #${orderNumber} foi confirmado e está sendo preparado. Em breve você receberá o código de rastreamento! 📦`;
      
      await this.simulateWhatsAppSend(customerPhone, message);
      await this.delay(1000);

      logger.info(`✅ Confirmação de pedido enviada com sucesso`, {
        orderId,
        customerPhone
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar confirmação de pedido`, {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação de envio
   */
  async sendShippingNotification(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName, trackingCode } = job.data;
    
    try {
      logger.info(`📦 Enviando notificação de envio via WhatsApp`, {
        orderId,
        trackingCode,
        jobId: job.id
      });

      const message = `🚚 Boa notícia ${customerName}! Seu pedido foi enviado e já está a caminho! Código de rastreamento: ${trackingCode}. Acompanhe sua entrega pelos Correios!`;
      
      await this.simulateWhatsAppSend(customerPhone, message);
      await this.delay(1200);

      logger.info(`✅ Notificação de envio enviada com sucesso`, {
        orderId,
        trackingCode
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação de envio`, {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação de entrega
   */
  async sendDeliveryNotification(job: Job): Promise<void> {
    const { orderId, customerPhone, customerName } = job.data;
    
    try {
      logger.info(`✅ Enviando notificação de entrega via WhatsApp`, {
        orderId,
        jobId: job.id
      });

      const message = `🎉 ${customerName}, seu pedido foi entregue com sucesso! Esperamos que você goste do seu produto. Agradecemos pela preferência! ⭐`;
      
      await this.simulateWhatsAppSend(customerPhone, message);
      await this.delay(800);

      logger.info(`✅ Notificação de entrega enviada com sucesso`, {
        orderId
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação de entrega`, {
        orderId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar mensagem recebida do cliente
   */
  async processIncomingMessage(job: Job): Promise<void> {
    const { messageId, customerPhone, messageText, timestamp } = job.data;
    
    try {
      logger.info(`📥 Processando mensagem recebida`, {
        messageId,
        customerPhone,
        jobId: job.id
      });

      // Simular análise da mensagem
      await this.delay(500);
      
      // Simular resposta automática baseada no conteúdo
      const response = await this.generateAutoResponse(messageText);
      
      if (response) {
        await this.simulateWhatsAppSend(customerPhone, response);
      }

      logger.info(`✅ Mensagem processada com sucesso`, {
        messageId,
        hasAutoResponse: !!response
      });

    } catch (error) {
      logger.error(`❌ Erro ao processar mensagem recebida`, {
        messageId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /* ==========================================
     MÉTODOS AUXILIARES PRIVADOS
     ========================================== */

  private async simulateWhatsAppSend(phone: string, message: string): Promise<void> {
    await this.delay(800);
    logger.info(`📤 WhatsApp enviado`, {
      phone: phone.replace(/\d(?=\d{4})/g, '*'), // Mascarar telefone
      messageLength: message.length
    });
  }

  private async generateAutoResponse(messageText: string): Promise<string | null> {
    const lowerText = messageText.toLowerCase();
    
    // Respostas automáticas para perguntas comuns
    if (lowerText.includes('rastreamento') || lowerText.includes('codigo')) {
      return '📦 Para consultar o rastreamento do seu pedido, acesse o site dos Correios com o código que enviamos por WhatsApp. Se não recebeu, nos informe o número do seu pedido!';
    }
    
    if (lowerText.includes('entrega') || lowerText.includes('prazo')) {
      return '🚚 O prazo de entrega varia conforme sua região. Após o envio, você receberá o código de rastreamento para acompanhar o status da entrega!';
    }
    
    if (lowerText.includes('cancelar') || lowerText.includes('cancelamento')) {
      return '❌ Para cancelamentos, entre em contato conosco através do nosso atendimento. Teremos prazer em ajudá-lo!';
    }
    
    if (lowerText.includes('obrigad') || lowerText.includes('valeu')) {
      return '😊 Fico feliz em ajudar! Estamos sempre à disposição. Tenha um ótimo dia!';
    }
    
    // Resposta padrão para mensagens não reconhecidas
    if (lowerText.length > 10) {
      return '👋 Obrigado pelo contato! Nossa equipe analisará sua mensagem e retornará em breve. Para urgências, ligue para nosso atendimento!';
    }
    
    return null;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const whatsappWorker = new WhatsAppWorker();
