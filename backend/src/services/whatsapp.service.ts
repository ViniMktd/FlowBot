import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { ApiResponse } from '../types';
import { BaseService } from './base.service';
import { i18nService, t } from './i18n.service';

const prisma = new PrismaClient();

/**
 * Service para integração com WhatsApp Business API
 */
export class WhatsAppService extends BaseService {
  protected entityName = 'whatsapp';

  private readonly phoneNumberId: string;
  private readonly apiVersion: string;

  constructor() {
    super();
    this.phoneNumberId = process.env['WHATSAPP_PHONE_NUMBER_ID'] || '';
    this.apiVersion = process.env['WHATSAPP_API_VERSION'] || 'v18.0';
  }

  // Método para usar as configurações da API
  public getApiConfig() {
    return {
      phoneNumberId: this.phoneNumberId,
      apiVersion: this.apiVersion
    };
  }

  /**
   * Enviar mensagem de texto com suporte internacional
   */
  async sendTextMessage(
    to: string,
    message: string,
    language: string = 'pt-BR'
  ): Promise<ApiResponse<any>> {
    try {
      logger.info('📱 Enviando mensagem de texto via WhatsApp', {
        to: this.maskPhone(to),
        messageLength: message.length,
        language
      });

      // Simular envio de mensagem
      await this.delay(800);

      const response = {
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
        message_id: `wamid.${Date.now()}`,
        status: 'sent',
        timestamp: new Date().toISOString()
      };

      logger.info('✅ Mensagem de texto enviada com sucesso', {
        messageId: response.message_id,
        to: this.maskPhone(to)
      });

      return this.createSuccessResponse(response);

    } catch (error) {
      logger.error('❌ Erro ao enviar mensagem de texto', {
        error,
        to: this.maskPhone(to)
      });
      return this.createErrorResponse('Erro ao enviar mensagem', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Enviar mensagem usando template
   */
  async sendTemplateMessage(to: string, templateName: string, parameters: any[]): Promise<ApiResponse<any>> {
    try {
      logger.info('📱 Enviando mensagem template via WhatsApp', {
        to: this.maskPhone(to),
        templateName,
        parameterCount: parameters.length
      });

      await this.delay(1000);

      const response = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'pt_BR' },
          components: [
            {
              type: 'body',
              parameters: parameters.map(param => ({ type: 'text', text: param }))
            }
          ]
        },
        message_id: `wamid.${Date.now()}`,
        status: 'sent',
        timestamp: new Date().toISOString()
      };

      logger.info('✅ Mensagem template enviada com sucesso', {
        messageId: response.message_id,
        templateName,
        to: this.maskPhone(to)
      });

      return this.createSuccessResponse(response);

    } catch (error) {
      logger.error('❌ Erro ao enviar mensagem template', {
        error,
        templateName,
        to: this.maskPhone(to)
      });
      return this.createErrorResponse('Erro ao enviar template', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Enviar confirmação de pedido com suporte internacional
   */
  async sendOrderConfirmation(
    to: string,
    customerName: string,
    orderNumber: string,
    total: number,
    currency: string = 'BRL',
    language: string = 'pt-BR'
  ): Promise<ApiResponse<any>> {
    try {
      // Detectar configurações de país baseado no idioma
      const countryConfig = await this.getCountryConfigByLanguage(language);

      // Formatar valor na moeda correta
      const formattedTotal = this.formatCurrency(total, currency, language);

      // Buscar template traduzido
      const greeting = await t('greeting', language, { name: customerName });
      const orderConfirmed = await t('order.confirmed', language);
      const totalLabel = await t('order.total', language);
      const preparingMessage = await t('order.preparing', language);
      const thankYou = await t('thank_you', language);

      const message = `${greeting} 🎉\n\n${orderConfirmed} #${orderNumber}\n\n💰 ${totalLabel}: ${formattedTotal}\n\n${preparingMessage}\n\n${thankYou} 🛍️`;

      return await this.sendTextMessage(to, message, language);

    } catch (error) {
      logger.error('❌ Erro ao enviar confirmação de pedido', {
        error,
        to: this.maskPhone(to),
        orderNumber,
        language
      });
      return this.createErrorResponse('Erro ao enviar confirmação', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Enviar notificação de envio com suporte internacional
   */
  async sendShippingNotification(
    to: string,
    customerName: string,
    orderNumber: string,
    trackingCode: string,
    carrier?: string,
    language: string = 'pt-BR'
  ): Promise<ApiResponse<any>> {
    try {
      // Buscar templates traduzidos
      const greeting = await t('greeting', language, { name: customerName });
      const orderShipped = await t('order.shipped', language);
      const trackingLabel = await t('tracking.code', language, { code: trackingCode });
      const trackingInstructions = await t('tracking.instructions', language);
      const seeYouSoon = await t('order.see_you_soon', language);

      // Obter URL de rastreamento baseado no carrier e país
      const trackingUrl = this.getTrackingUrl(trackingCode, carrier, language);

      const message = `🚚 ${greeting}\n\n${orderShipped} #${orderNumber}!\n\n📦 ${trackingLabel}\n\n${trackingInstructions}: ${trackingUrl}\n\n${seeYouSoon} 😊`;

      return await this.sendTextMessage(to, message, language);

    } catch (error) {
      logger.error('❌ Erro ao enviar notificação de envio', {
        error,
        to: this.maskPhone(to),
        orderNumber,
        trackingCode,
        language
      });
      return this.createErrorResponse('Erro ao enviar notificação', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Enviar notificação de entrega
   */
  async sendDeliveryNotification(to: string, customerName: string, orderNumber: string): Promise<ApiResponse<any>> {
    try {
      const message = `🎉 ${customerName}, seu pedido foi entregue!\n\nPedido #${orderNumber} foi entregue com sucesso!\n\nEsperamos que você goste do seu produto. Sua satisfação é nossa maior recompensa!\n\n⭐ Que tal avaliar sua experiência conosco?\n\nObrigado pela confiança! 💝`;

      return await this.sendTextMessage(to, message);

    } catch (error) {
      logger.error('❌ Erro ao enviar notificação de entrega', {
        error,
        to: this.maskPhone(to),
        orderNumber
      });
      return this.createErrorResponse('Erro ao enviar notificação', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Processar webhook de mensagem recebida
   */
  async processIncomingMessage(webhookData: any): Promise<ApiResponse<any>> {
    try {
      logger.info('📥 Processando mensagem recebida via webhook', {
        from: webhookData.from ? this.maskPhone(webhookData.from) : 'unknown'
      });

      const messageData = {
        id: webhookData.id,
        from: webhookData.from,
        timestamp: webhookData.timestamp,
        type: webhookData.type,
        text: webhookData.text?.body || '',
        context: webhookData.context
      };

      // Simular processamento da mensagem
      await this.delay(500);

      // Gerar resposta automática se necessário
      const autoResponse = await this.generateAutoResponse(messageData.text, messageData.from);

      if (autoResponse) {
        await this.sendTextMessage(messageData.from, autoResponse);
      }

      logger.info('✅ Mensagem processada com sucesso', {
        messageId: messageData.id,
        hasAutoResponse: !!autoResponse
      });

      return this.createSuccessResponse({
        processed: true,
        messageId: messageData.id,
        autoResponseSent: !!autoResponse
      });

    } catch (error) {
      logger.error('❌ Erro ao processar mensagem recebida', { error });
      return this.createErrorResponse('Erro ao processar mensagem', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Marcar mensagem como lida
   */
  async markAsRead(messageId: string): Promise<ApiResponse<any>> {
    try {
      logger.info('👁️ Marcando mensagem como lida', { messageId });

      await this.delay(300);

      const response = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
        timestamp: new Date().toISOString()
      };

      return this.createSuccessResponse(response);

    } catch (error) {
      logger.error('❌ Erro ao marcar mensagem como lida', { error, messageId });
      return this.createErrorResponse('Erro ao marcar como lida', ['WHATSAPP_ERROR']);
    }
  }

  /**
   * Enviar mensagem (método principal)
   */
  async sendMessage(params: {
    customerId: string;
    phone: string;
    messageType: string;
    data: any;
  }) {
    try {
      const { phone, messageType, data } = params;

      // Simular envio de mensagem
      logger.info('Enviando mensagem WhatsApp', {
        phone,
        messageType,
        data
      });

      // Aqui você integraria com a API real do WhatsApp
      // Por enquanto, apenas simulamos o envio

      return { success: true, messageId: `msg_${Date.now()}` };
    } catch (error) {
      logger.error('Erro ao enviar mensagem WhatsApp', { params, error });
      throw error;
    }
  }

  /**
   * Processar webhook
   */
  async processWebhook(webhookData: any) {
    try {
      logger.info('Processando webhook WhatsApp', { webhookData });

      // Aqui você processaria os dados do webhook
      // Por exemplo: mensagens recebidas, status de entrega, etc.

      return { success: true };
    } catch (error) {
      logger.error('Erro ao processar webhook WhatsApp', { webhookData, error });
      throw error;
    }
  }

  /* ==========================================
     MÉTODOS AUXILIARES PRIVADOS
     ========================================== */

  /**
   * Obter configuração do país baseado no idioma
   */
  private async getCountryConfigByLanguage(language: string) {
    try {
      const country = await prisma.country.findFirst({
        where: { language }
      });
      return country;
    } catch (error) {
      logger.error('Erro ao buscar configuração do país', { language, error });
      return null;
    }
  }

  /**
   * Formatar moeda baseado no idioma/país
   */
  private formatCurrency(amount: number, currency: string, language: string): string {
    try {
      const locale = this.getLocaleFromLanguage(language);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      logger.error('Erro ao formatar moeda', { amount, currency, language, error });
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Obter locale baseado no idioma
   */
  private getLocaleFromLanguage(language: string): string {
    const localeMap: Record<string, string> = {
      'pt-BR': 'pt-BR',
      'en': 'en-US',
      'zh-CN': 'zh-CN',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'hi': 'hi-IN'
    };
    return localeMap[language] || 'en-US';
  }

  /**
   * Obter URL de rastreamento baseado no carrier e país
   */
  private getTrackingUrl(trackingCode: string, carrier?: string, language?: string): string {
    const trackingUrls: Record<string, string> = {
      'CORREIOS': 'https://www.correios.com.br/rastreamento',
      'CHINA_POST': 'http://track-chinapost.com',
      'EMS_CHINA': 'https://www.ems.com.cn/qps/yjcx',
      'DHL': 'https://www.dhl.com/track',
      'FEDEX': 'https://www.fedex.com/track',
      'UPS': 'https://www.ups.com/track',
      'USPS': 'https://tools.usps.com/go/TrackConfirmAction'
    };

    // Determinar carrier baseado no idioma se não especificado
    if (!carrier && language) {
      if (language === 'pt-BR') carrier = 'CORREIOS';
      else if (language === 'zh-CN') carrier = 'CHINA_POST';
      else carrier = 'DHL';
    }

    const baseUrl = trackingUrls[carrier || 'DHL'] || trackingUrls['DHL'];
    return `${baseUrl}?trackingNumber=${trackingCode}`;
  }

  /**
   * Detectar idioma do cliente baseado no telefone ou dados do pedido
   */
  private async detectCustomerLanguage(customerId: string, phone: string): Promise<string> {
    try {
      // Buscar cliente no banco
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: { country: true }
      });

      if (customer?.preferredLanguage) {
        return customer.preferredLanguage;
      }

      if (customer?.country?.language) {
        return customer.country.language;
      }

      // Detectar baseado no código do país do telefone
      const countryCode = this.extractCountryCodeFromPhone(phone);
      return i18nService.getLanguageByCountry(countryCode);
    } catch (error) {
      logger.error('Erro ao detectar idioma do cliente', { customerId, phone, error });
      return 'pt-BR'; // Fallback
    }
  }

  /**
   * Extrair código do país do número de telefone
   */
  private extractCountryCodeFromPhone(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');

    // Mapeamento de prefixos para códigos de país
    if (cleanPhone.startsWith('55')) return 'BR';  // Brasil
    if (cleanPhone.startsWith('86')) return 'CN';  // China
    if (cleanPhone.startsWith('1')) return 'US';   // EUA/Canadá
    if (cleanPhone.startsWith('91')) return 'IN';  // Índia
    if (cleanPhone.startsWith('49')) return 'DE';  // Alemanha
    if (cleanPhone.startsWith('33')) return 'FR';  // França
    if (cleanPhone.startsWith('39')) return 'IT';  // Itália
    if (cleanPhone.startsWith('34')) return 'ES';  // Espanha
    if (cleanPhone.startsWith('44')) return 'GB';  // Reino Unido
    if (cleanPhone.startsWith('81')) return 'JP';  // Japão
    if (cleanPhone.startsWith('82')) return 'KR';  // Coreia do Sul

    return 'BR'; // Default
  }

  private async generateAutoResponse(messageText: string, customerPhone: string): Promise<string | null> {
    try {
      // Detectar idioma do cliente
      const language = await this.detectLanguageFromPhone(customerPhone);
      const lowerText = messageText.toLowerCase();

      // Palavras-chave por idioma
      const keywords = this.getKeywordsByLanguage(language);

      // Verificar tracking/rastreamento
      if (this.containsKeywords(lowerText, keywords.tracking)) {
        return await t('auto_response.tracking', language);
      }

      // Verificar entrega/delivery
      if (this.containsKeywords(lowerText, keywords.delivery)) {
        return await t('auto_response.delivery', language);
      }

      // Verificar cancelamento/cancel
      if (this.containsKeywords(lowerText, keywords.cancel)) {
        return await t('auto_response.cancel', language);
      }

      // Verificar troca/return
      if (this.containsKeywords(lowerText, keywords.return)) {
        return await t('auto_response.return', language);
      }

      // Verificar agradecimento/thanks
      if (this.containsKeywords(lowerText, keywords.thanks)) {
        return await t('auto_response.thanks', language);
      }

      // Verificar saudação/greeting
      if (this.containsKeywords(lowerText, keywords.greeting)) {
        return await t('auto_response.greeting', language);
      }

      // Resposta padrão para mensagens mais longas
      if (lowerText.length > 15) {
        return await t('auto_response.default', language);
      }

      return null;
    } catch (error) {
      logger.error('Erro ao gerar resposta automática', { messageText, customerPhone, error });
      return null;
    }
  }

  /**
   * Detectar idioma baseado no telefone
   */
  private async detectLanguageFromPhone(phone: string): Promise<string> {
    const countryCode = this.extractCountryCodeFromPhone(phone);
    return i18nService.getLanguageByCountry(countryCode);
  }

  /**
   * Obter palavras-chave por idioma
   */
  private getKeywordsByLanguage(language: string) {
    const keywordMap: Record<string, any> = {
      'pt-BR': {
        tracking: ['rastreamento', 'codigo', 'onde está', 'track'],
        delivery: ['entrega', 'prazo', 'quando chega', 'delivery'],
        cancel: ['cancelar', 'cancelamento', 'desistir', 'cancel'],
        return: ['troca', 'devolução', 'defeito', 'return'],
        thanks: ['obrigad', 'valeu', 'thanks', 'thx'],
        greeting: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hello']
      },
      'en': {
        tracking: ['tracking', 'track', 'where is', 'status'],
        delivery: ['delivery', 'shipping', 'when', 'arrive'],
        cancel: ['cancel', 'cancellation', 'stop'],
        return: ['return', 'exchange', 'refund', 'defect'],
        thanks: ['thank', 'thanks', 'thx', 'appreciate'],
        greeting: ['hi', 'hello', 'good morning', 'good afternoon', 'good evening']
      },
      'zh-CN': {
        tracking: ['追踪', '跟踪', '查询', '物流'],
        delivery: ['送货', '配送', '什么时候', '到达'],
        cancel: ['取消', '退订'],
        return: ['退货', '换货', '退款', '质量问题'],
        thanks: ['谢谢', '感谢'],
        greeting: ['你好', '您好', '早上好', '下午好', '晚上好']
      }
    };

    return keywordMap[language] || keywordMap['en'];
  }

  /**
   * Verificar se o texto contém alguma das palavras-chave
   */
  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  private maskPhone(phone: string): string {
    if (phone.length < 4) return phone;
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
