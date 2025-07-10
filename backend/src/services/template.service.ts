import { logger } from '../config/logger';
import { i18nService, t } from './i18n.service';

export interface TemplateContext {
  language: string;
  country: string;
  timezone: string;
  currency: string;
  customerName?: string;
  orderNumber?: string;
  trackingCode?: string;
  supplierName?: string;
  totalAmount?: number;
  carrier?: string;
  [key: string]: any;
}

export interface MessageTemplate {
  id: string;
  type: string;
  language: string;
  channel: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateService {
  private static instance: TemplateService;
  private templateCache: Map<string, MessageTemplate[]> = new Map();
  private cacheExpiryTime = 10 * 60 * 1000; // 10 minutos
  private lastCacheUpdate = 0;

  private constructor() {}

  public static getInstance(): TemplateService {
    if (!TemplateService.instance) {
      TemplateService.instance = new TemplateService();
    }
    return TemplateService.instance;
  }

  /**
   * Obter template formatado para envio
   */
  public async getFormattedTemplate(
    type: string,
    channel: 'whatsapp' | 'email' | 'sms',
    context: TemplateContext
  ): Promise<{ subject?: string; content: string } | null> {
    try {
      const template = await this.getTemplate(type, channel, context.language);
      if (!template) {
        logger.warn(`Template não encontrado: ${type}/${channel}/${context.language}`);
        return null;
      }

      const formattedContent = this.formatTemplate(template.content, context);
      const formattedSubject = template.subject 
        ? this.formatTemplate(template.subject, context)
        : undefined;

      return {
        subject: formattedSubject,
        content: formattedContent
      };
    } catch (error) {
      logger.error('Erro ao formatar template', { type, channel, context, error });
      return null;
    }
  }

  /**
   * Buscar template específico
   */
  private async getTemplate(
    type: string,
    channel: 'whatsapp' | 'email' | 'sms',
    language: string
  ): Promise<MessageTemplate | null> {
    try {
      // Verificar cache
      if (this.shouldUpdateCache()) {
        await this.updateCache();
      }

      const cacheKey = `${type}_${channel}_${language}`;
      const templates = this.templateCache.get(cacheKey);
      
      if (templates && templates.length > 0) {
        return templates[0] || null; // Retornar o primeiro template ativo
      }

      // Buscar no banco se não encontrou no cache
      const template = await this.getTemplateFromDatabase(type, channel, language);
      return template;
    } catch (error) {
      logger.error('Erro ao buscar template', { type, channel, language, error });
      return null;
    }
  }

  /**
   * Formatar template com variáveis
   */
  private formatTemplate(template: string, context: TemplateContext): string {
    let formatted = template;

    // Substituir variáveis básicas
    for (const [key, value] of Object.entries(context)) {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        formatted = formatted.replace(regex, String(value));
      }
    }

    // Formatar valores monetários
    formatted = formatted.replace(/{{money:(\w+)}}/g, (match, variable) => {
      const amount = context[variable];
      if (typeof amount === 'number') {
        return this.formatCurrency(amount, context.currency, context.language);
      }
      return match;
    });

    // Formatar datas
    formatted = formatted.replace(/{{date:(\w+)(?::(\w+))?}}/g, (match, variable, format) => {
      const date = context[variable];
      if (date instanceof Date) {
        return this.formatDate(date, context.timezone, context.language, format);
      }
      return match;
    });

    // Formatar telefones
    formatted = formatted.replace(/{{phone:(\w+)}}/g, (match, variable) => {
      const phone = context[variable];
      if (typeof phone === 'string') {
        return this.formatPhone(phone, context.country);
      }
      return match;
    });

    return formatted;
  }

  /**
   * Templates pré-definidos para diferentes cenários
   */
  public async getOrderConfirmationTemplate(_context: TemplateContext) {
    const templates = {
      whatsapp: {
        'pt-BR': `🎉 {{greeting}}

Seu pedido #{{orderNumber}} foi confirmado!

💰 Total: {{money:totalAmount}}
📦 Itens: {{itemCount}}

Estamos preparando tudo com carinho. Em breve você receberá o código de rastreamento.

{{thankYou}}`,

        'en': `🎉 {{greeting}}

Your order #{{orderNumber}} has been confirmed!

💰 Total: {{money:totalAmount}}
📦 Items: {{itemCount}}

We are carefully preparing everything. You will receive the tracking code soon.

{{thankYou}}`,

        'zh-CN': `🎉 {{greeting}}

您的订单 #{{orderNumber}} 已确认！

💰 总计：{{money:totalAmount}}
📦 商品：{{itemCount}}

我们正在精心准备一切。您很快就会收到追踪代码。

{{thankYou}}`
      },
      email: {
        'pt-BR': {
          subject: 'Pedido Confirmado - #{{orderNumber}}',
          content: `Olá {{customerName}},

Seu pedido foi confirmado com sucesso!

Detalhes do Pedido:
- Número: #{{orderNumber}}
- Total: {{money:totalAmount}}
- Data: {{date:orderDate}}

Acompanhe o status através do nosso dashboard.

Atenciosamente,
Equipe FlowBot`
        }
      }
    };

    return templates;
  }

  /**
   * Template para fornecedores chineses
   */
  public async getChineseSupplierTemplate(_context: TemplateContext) {
    return {
      email: {
        subject: `新订单 - {{orderNumber}} | New Order - {{orderNumber}}`,
        content: `尊敬的供应商 / Dear Supplier,

我们收到了一个新的订单，需要您的处理。
We have received a new order that requires your processing.

订单详情 / Order Details:
- 订单号 / Order Number: {{orderNumber}}
- 客户 / Customer: {{customerName}}
- 总金额 / Total Amount: {{money:totalAmount}}
- 发货地址 / Shipping Address: {{shippingAddress}}

请确认收到此订单并提供预计处理时间。
Please confirm receipt of this order and provide estimated processing time.

微信 / WeChat: {{wechatContact}}
QQ: {{qqContact}}

此致敬礼 / Best regards,
FlowBot 团队 / FlowBot Team`
      },
      api: {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept-Language': 'zh-CN,en;q=0.9',
          'X-Timezone': 'Asia/Shanghai'
        },
        payload: {
          order_number: '{{orderNumber}}',
          customer_info: {
            name: '{{customerName}}',
            phone: '{{customerPhone}}',
            address: '{{fullAddress}}'
          },
          items: '{{orderItems}}',
          total_amount: '{{totalAmount}}',
          currency: '{{currency}}',
          notes: '订单来自FlowBot系统 / Order from FlowBot system',
          priority: '{{priority}}',
          language: 'zh-CN'
        }
      }
    };
  }

  /**
   * Atualizar cache de templates
   */
  private async updateCache(): Promise<void> {
    try {
      // Por enquanto, usar templates estáticos
      // Em produção, buscar do banco de dados
      this.lastCacheUpdate = Date.now();
      logger.debug('Template cache atualizado');
    } catch (error) {
      logger.error('Erro ao atualizar cache de templates', { error });
    }
  }

  private shouldUpdateCache(): boolean {
    return Date.now() - this.lastCacheUpdate > this.cacheExpiryTime;
  }

  private async getTemplateFromDatabase(
    _type: string,
    _channel: string,
    _language: string
  ): Promise<MessageTemplate | null> {
    // Por enquanto retornar null, implementar busca no banco posteriormente
    return null;
  }

  /**
   * Formatar moeda
   */
  private formatCurrency(amount: number, currency: string, language: string): string {
    try {
      const locale = this.getLocaleFromLanguage(language);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  }

  /**
   * Formatar data
   */
  private formatDate(date: Date, timezone: string, language: string, format?: string): string {
    try {
      const locale = this.getLocaleFromLanguage(language);
      const options: Intl.DateTimeFormatOptions = {
        timeZone: timezone
      };

      if (format === 'short') {
        options.dateStyle = 'short';
      } else if (format === 'long') {
        options.dateStyle = 'full';
        options.timeStyle = 'short';
      } else {
        options.dateStyle = 'medium';
        options.timeStyle = 'short';
      }

      return new Intl.DateTimeFormat(locale, options).format(date);
    } catch (error) {
      return date.toISOString();
    }
  }

  /**
   * Formatar telefone
   */
  private formatPhone(phone: string, country: string): string {
    // Implementar formatação específica por país
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    if (country === 'BR' && cleanPhone.length >= 10) {
      return cleanPhone.replace(/(\+55)?(\d{2})(\d{4,5})(\d{4})/, '+55 ($2) $3-$4');
    } else if (country === 'CN' && cleanPhone.length >= 11) {
      return cleanPhone.replace(/(\+86)?(\d{3})(\d{4})(\d{4})/, '+86 $2-$3-$4');
    } else if (country === 'US' && cleanPhone.length >= 10) {
      return cleanPhone.replace(/(\+1)?(\d{3})(\d{3})(\d{4})/, '+1 ($2) $3-$4');
    }
    
    return phone;
  }

  /**
   * Obter locale do idioma
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
   * Criar template personalizado
   */
  public async createCustomTemplate(
    type: string,
    channel: 'whatsapp' | 'email' | 'sms',
    language: string,
    content: string,
    subject?: string,
    variables: string[] = []
  ): Promise<MessageTemplate> {
    const template: MessageTemplate = {
      id: `${type}_${channel}_${language}_${Date.now()}`,
      type,
      language,
      channel,
      subject,
      content,
      variables,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Em produção, salvar no banco de dados
    logger.info('Template personalizado criado', { template });
    
    return template;
  }

  /**
   * Validar template
   */
  public validateTemplate(content: string, variables: string[]): boolean {
    try {
      // Verificar se todas as variáveis têm placeholders
      const placeholderRegex = /{{(\w+)}}/g;
      const foundVariables: string[] = [];
      let match;

      while ((match = placeholderRegex.exec(content)) !== null) {
        foundVariables.push(match[1]);
      }

      // Verificar se todas as variáveis necessárias estão presentes
      const missingVariables = variables.filter(v => !foundVariables.includes(v));
      if (missingVariables.length > 0) {
        logger.warn('Variáveis obrigatórias ausentes no template', { missingVariables });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Erro ao validar template', { content, variables, error });
      return false;
    }
  }
}

// Instância singleton
export const templateService = TemplateService.getInstance();