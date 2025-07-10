import axios from 'axios';
import { logger } from '../config/logger';
import { i18nService } from './i18n.service';

export interface TranslationApiResponse {
  success: boolean;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage: string;
  confidence?: number;
  error?: string;
}

export interface TranslationRequest {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  context?: string;
}

export class TranslationService {
  private static instance: TranslationService;
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  private constructor() {
    this.apiKey = process.env['TRANSLATION_API_KEY'] || '';
    this.baseUrl = process.env['TRANSLATION_API_URL'] || 'https://api.translate.google.com/translate_a/single';
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  /**
   * Traduzir texto usando API externa
   */
  async translateText(request: TranslationRequest): Promise<TranslationApiResponse> {
    try {
      // Primeiro tentar buscar tradução no banco local
      const localTranslation = await this.tryLocalTranslation(request);
      if (localTranslation) {
        return {
          success: true,
          translatedText: localTranslation,
          targetLanguage: request.targetLanguage,
          sourceLanguage: request.sourceLanguage
        };
      }

      // Se não encontrou localmente, usar API externa
      const apiTranslation = await this.callTranslationApi(request);
      
      // Salvar tradução no banco para uso futuro
      if (apiTranslation.success && apiTranslation.translatedText) {
        await this.saveTranslation(request, apiTranslation.translatedText);
      }

      return apiTranslation;

    } catch (error) {
      logger.error('Translation error', {
        text: request.text.substring(0, 100),
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        translatedText: request.text,
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Traduzir mensagem de pedido para fornecedor chinês
   */
  async translateOrderMessage(
    orderData: any,
    sourceLanguage: string = 'pt-BR',
    targetLanguage: string = 'zh-CN'
  ): Promise<string> {
    try {
      const orderMessage = this.buildOrderMessage(orderData, sourceLanguage);
      
      const translation = await this.translateText({
        text: orderMessage,
        sourceLanguage,
        targetLanguage,
        context: 'order_message'
      });

      if (translation.success) {
        return translation.translatedText;
      }

      // Fallback para template pré-definido
      return await this.getFallbackOrderMessage(orderData, targetLanguage);

    } catch (error) {
      logger.error('Error translating order message', {
        orderId: orderData.id,
        sourceLanguage,
        targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      });

      return await this.getFallbackOrderMessage(orderData, targetLanguage);
    }
  }

  /**
   * Traduzir notificação para cliente
   */
  async translateCustomerNotification(
    messageKey: string,
    variables: Record<string, any>,
    targetLanguage: string,
    context?: string
  ): Promise<string> {
    try {
      // Buscar template base
      const baseTemplate = await i18nService.translate(messageKey, 'pt-BR', variables);
      
      // Se já está no idioma desejado, retornar
      if (targetLanguage === 'pt-BR') {
        return baseTemplate;
      }

      // Verificar se já temos tradução deste template
      const existingTranslation = await i18nService.translate(messageKey, targetLanguage, variables);
      if (existingTranslation && existingTranslation !== messageKey) {
        return existingTranslation;
      }

      // Traduzir usando API
      const translation = await this.translateText({
        text: baseTemplate,
        sourceLanguage: 'pt-BR',
        targetLanguage,
        context: context || 'notification'
      });

      return translation.success ? translation.translatedText : baseTemplate;

    } catch (error) {
      logger.error('Error translating customer notification', {
        messageKey,
        targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      });

      // Retornar template original em caso de erro
      return await i18nService.translate(messageKey, 'pt-BR', variables);
    }
  }

  /**
   * Detectar idioma do texto
   */
  async detectLanguage(text: string): Promise<string> {
    try {
      if (!this.apiKey) {
        return this.detectLanguageHeuristic(text);
      }

      const response = await axios.post(
        `${this.baseUrl.replace('translate_a/single', 'detect')}`,
        {
          q: text,
          key: this.apiKey
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data && response.data.data && response.data.data.detections) {
        return response.data.data.detections[0][0].language;
      }

      return this.detectLanguageHeuristic(text);

    } catch (error) {
      logger.error('Error detecting language', {
        text: text.substring(0, 100),
        error: error instanceof Error ? error.message : String(error)
      });

      return this.detectLanguageHeuristic(text);
    }
  }

  /**
   * Verificar se tradução automática está disponível
   */
  isTranslationAvailable(): boolean {
    return !!this.apiKey && !!this.baseUrl;
  }

  /**
   * Obter idiomas suportados
   */
  getSupportedLanguages(): string[] {
    return [
      'pt-BR', 'en', 'zh-CN', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'ru', 'hi', 'ar', 'th'
    ];
  }

  // Métodos privados
  private async tryLocalTranslation(request: TranslationRequest): Promise<string | null> {
    try {
      // Criar chave baseada no hash do texto
      const textHash = this.generateTextHash(request.text);
      const translationKey = `auto_${textHash}`;

      return await i18nService.translate(translationKey, request.targetLanguage);
    } catch (error) {
      return null;
    }
  }

  private async callTranslationApi(request: TranslationRequest): Promise<TranslationApiResponse> {
    const maxRetries = this.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Usar Google Translate gratuito como fallback
        if (!this.apiKey) {
          return await this.callGoogleTranslateFree(request);
        }

        // Usar API paga se disponível
        const response = await axios.post(
          this.baseUrl,
          {
            q: request.text,
            source: request.sourceLanguage || 'auto',
            target: request.targetLanguage,
            key: this.apiKey
          },
          {
            headers: {
              'Content-Type': 'application/json'
            },
            timeout: 15000
          }
        );

        if (response.data && response.data.data && response.data.data.translations) {
          return {
            success: true,
            translatedText: response.data.data.translations[0].translatedText,
            targetLanguage: request.targetLanguage,
            sourceLanguage: response.data.data.translations[0].detectedSourceLanguage || request.sourceLanguage
          };
        }

        throw new Error('Invalid API response format');

      } catch (error: any) {
        lastError = error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError;
  }

  private async callGoogleTranslateFree(request: TranslationRequest): Promise<TranslationApiResponse> {
    try {
      const sourceLang = request.sourceLanguage || 'auto';
      const targetLang = request.targetLanguage;
      
      // Usar endpoint gratuito do Google Translate
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(request.text)}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      if (response.data && Array.isArray(response.data) && response.data[0]) {
        const translatedText = response.data[0]
          .map((item: any) => item[0])
          .join('');

        return {
          success: true,
          translatedText,
          targetLanguage: request.targetLanguage,
          sourceLanguage: response.data[2] || request.sourceLanguage
        };
      }

      throw new Error('Invalid response from translation service');

    } catch (error) {
      logger.error('Free translation API error', {
        text: request.text.substring(0, 100),
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      });

      return {
        success: false,
        translatedText: request.text,
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async saveTranslation(request: TranslationRequest, translatedText: string): Promise<void> {
    try {
      const textHash = this.generateTextHash(request.text);
      const translationKey = `auto_${textHash}`;

      await i18nService.addTranslation(
        translationKey,
        request.targetLanguage,
        translatedText,
        request.context || 'auto_translation'
      );

      logger.debug('Translation saved to database', {
        key: translationKey,
        language: request.targetLanguage,
        context: request.context
      });

    } catch (error) {
      logger.error('Error saving translation', {
        text: request.text.substring(0, 100),
        targetLanguage: request.targetLanguage,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private generateTextHash(text: string): string {
    // Simple hash function para criar chave única
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private buildOrderMessage(orderData: any, language: string): string {
    const templates = {
      'pt-BR': `Novo pedido recebido - #${orderData.orderNumber}
Cliente: ${orderData.customer.name}
Total: R$ ${orderData.totalAmount}
Itens: ${orderData.items.length}
Endereço: ${orderData.customer.address.street}, ${orderData.customer.address.city}
Por favor, confirme o recebimento e tempo estimado de processamento.`,

      'en': `New order received - #${orderData.orderNumber}
Customer: ${orderData.customer.name}
Total: $${orderData.totalAmount}
Items: ${orderData.items.length}
Address: ${orderData.customer.address.street}, ${orderData.customer.address.city}
Please confirm receipt and estimated processing time.`,

      'zh-CN': `收到新订单 - #${orderData.orderNumber}
客户: ${orderData.customer.name}
总计: ¥${orderData.totalAmount}
商品: ${orderData.items.length}
地址: ${orderData.customer.address.street}, ${orderData.customer.address.city}
请确认收到并提供预计处理时间。`
    };

    return templates[language as keyof typeof templates] || templates['en'];
  }

  private async getFallbackOrderMessage(orderData: any, language: string): Promise<string> {
    try {
      const baseMessage = this.buildOrderMessage(orderData, language);
      return baseMessage;
    } catch (error) {
      return `Order #${orderData.orderNumber} - Customer: ${orderData.customer.name}`;
    }
  }

  private detectLanguageHeuristic(text: string): string {
    // Detecção heurística simples baseada em caracteres
    const chineseRegex = /[\u4e00-\u9fff]/;
    const portugueseRegex = /[áàâãäéèêëíìîïóòôõöúùûüç]/i;
    const englishRegex = /^[a-zA-Z0-9\s.,!?;:'"()-]*$/;

    if (chineseRegex.test(text)) {
      return 'zh-CN';
    } else if (portugueseRegex.test(text)) {
      return 'pt-BR';
    } else if (englishRegex.test(text)) {
      return 'en';
    }

    return 'en'; // Default
  }
}

// Singleton instance
export const translationService = TranslationService.getInstance();