import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export interface TranslationContext {
  language: string;
  fallbackLanguage?: string;
  context?: string;
}

export class I18nService {
  private static instance: I18nService;
  private translationCache: Map<string, Map<string, string>> = new Map();
  private cacheExpiryTime = 5 * 60 * 1000; // 5 minutos
  private lastCacheUpdate = 0;

  private constructor() {}

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  /**
   * Traduzir uma chave específica
   */
  public async translate(
    key: string,
    language: string = 'en',
    variables: Record<string, any> = {},
    fallbackLanguage: string = 'en'
  ): Promise<string> {
    try {
      // Verificar cache
      if (this.shouldUpdateCache()) {
        await this.updateCache();
      }

      // Buscar tradução no idioma solicitado
      let translation = this.getFromCache(key, language);
      
      // Se não encontrou, tentar fallback
      if (!translation && language !== fallbackLanguage) {
        translation = this.getFromCache(key, fallbackLanguage);
      }

      // Se ainda não encontrou, buscar no banco
      if (!translation) {
        translation = await this.getFromDatabase(key, language, fallbackLanguage);
      }

      // Se ainda não encontrou, retornar a chave
      if (!translation) {
        logger.warn(`Translation not found for key: ${key}, language: ${language}`);
        return key;
      }

      // Substituir variáveis
      return this.replaceVariables(translation, variables);

    } catch (error) {
      logger.error('Error translating key', { key, language, error });
      return key;
    }
  }

  /**
   * Traduzir múltiplas chaves
   */
  public async translateMultiple(
    keys: string[],
    language: string = 'en',
    variables: Record<string, Record<string, any>> = {},
    fallbackLanguage: string = 'en'
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};

    for (const key of keys) {
      const keyVariables = variables[key] || {};
      results[key] = await this.translate(key, language, keyVariables, fallbackLanguage);
    }

    return results;
  }

  /**
   * Detectar idioma baseado no país
   */
  public getLanguageByCountry(countryCode: string): string {
    const countryToLanguage: Record<string, string> = {
      'BR': 'pt-BR',
      'CN': 'zh-CN',
      'US': 'en',
      'GB': 'en',
      'CA': 'en',
      'AU': 'en',
      'DE': 'de',
      'FR': 'fr',
      'IT': 'it',
      'ES': 'es',
      'JP': 'ja',
      'KR': 'ko',
      'IN': 'hi',
      'MX': 'es',
      'TR': 'tr',
      'TH': 'th'
    };

    return countryToLanguage[countryCode.toUpperCase()] || 'en';
  }

  /**
   * Detectar idioma baseado no número de telefone
   */
  public getLanguageByPhoneNumber(phone: string): string | null {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    // Mapear prefixos de telefone para idiomas
    const phonePrefixMap: Record<string, string> = {
      '+55': 'pt-BR', // Brasil
      '+1': 'en',     // EUA/Canadá
      '+86': 'zh-CN', // China
      '+44': 'en',    // Reino Unido
      '+49': 'de',    // Alemanha
      '+33': 'fr',    // França
      '+39': 'it',    // Itália
      '+34': 'es',    // Espanha
      '+52': 'es',    // México
      '+54': 'es',    // Argentina
      '+56': 'es',    // Chile
      '+57': 'es',    // Colômbia
      '+51': 'es',    // Peru
      '+598': 'es',   // Uruguai
      '+595': 'es',   // Paraguai
      '+593': 'es',   // Equador
      '+58': 'es',    // Venezuela
      '+591': 'es',   // Bolívia
      '+507': 'es',   // Panamá
      '+506': 'es',   // Costa Rica
      '+502': 'es',   // Guatemala
      '+504': 'es',   // Honduras
      '+505': 'es',   // Nicarágua
      '+503': 'es',   // El Salvador
      '+809': 'es',   // República Dominicana
      '+53': 'es',    // Cuba
      '+81': 'ja',    // Japão
      '+82': 'ko',    // Coreia do Sul
      '+91': 'hi',    // Índia
      '+7': 'ru',     // Rússia
      '+351': 'pt',   // Portugal
      '+61': 'en',    // Austrália
      '+64': 'en',    // Nova Zelândia
      '+27': 'en',    // África do Sul
      '+852': 'zh-CN', // Hong Kong
      '+853': 'zh-CN', // Macau
      '+886': 'zh-CN'  // Taiwan
    };

    // Buscar por prefixos (do mais específico para o menos específico)
    const sortedPrefixes = Object.keys(phonePrefixMap).sort((a, b) => b.length - a.length);
    
    for (const prefix of sortedPrefixes) {
      if (cleanPhone.startsWith(prefix)) {
        return phonePrefixMap[prefix];
      }
    }

    return null;
  }

  /**
   * Adicionar nova tradução
   */
  public async addTranslation(
    key: string,
    language: string,
    value: string,
    context?: string
  ): Promise<void> {
    try {
      await prisma.translation.upsert({
        where: {
          key_language: {
            key,
            language
          }
        },
        update: {
          value,
          context,
          updatedAt: new Date()
        },
        create: {
          key,
          language,
          value,
          context
        }
      });

      // Atualizar cache
      await this.updateCache();

      logger.info('Translation added/updated', { key, language, context });
    } catch (error) {
      logger.error('Error adding translation', { key, language, error });
      throw error;
    }
  }

  /**
   * Formatar mensagem com template
   */
  public formatMessage(
    template: string,
    variables: Record<string, any> = {}
  ): string {
    return this.replaceVariables(template, variables);
  }

  /**
   * Obter idiomas disponíveis
   */
  public async getAvailableLanguages(): Promise<string[]> {
    try {
      const languages = await prisma.translation.findMany({
        select: {
          language: true
        },
        distinct: ['language']
      });

      return languages.map(l => l.language);
    } catch (error) {
      logger.error('Error getting available languages', { error });
      return ['en', 'pt-BR', 'zh-CN'];
    }
  }

  /**
   * Obter todas as traduções para um idioma
   */
  public async getTranslationsByLanguage(
    language: string,
    context?: string
  ): Promise<Record<string, string>> {
    try {
      const where: any = { language };
      if (context) {
        where.context = context;
      }

      const translations = await prisma.translation.findMany({
        where,
        select: {
          key: true,
          value: true
        }
      });

      return translations.reduce((acc, translation) => {
        acc[translation.key] = translation.value;
        return acc;
      }, {} as Record<string, string>);
    } catch (error) {
      logger.error('Error getting translations by language', { language, context, error });
      return {};
    }
  }

  // Métodos privados
  private shouldUpdateCache(): boolean {
    return Date.now() - this.lastCacheUpdate > this.cacheExpiryTime;
  }

  private async updateCache(): Promise<void> {
    try {
      const translations = await prisma.translation.findMany({
        select: {
          key: true,
          language: true,
          value: true
        }
      });

      this.translationCache.clear();

      for (const translation of translations) {
        if (!this.translationCache.has(translation.language)) {
          this.translationCache.set(translation.language, new Map());
        }
        this.translationCache.get(translation.language)!.set(translation.key, translation.value);
      }

      this.lastCacheUpdate = Date.now();
      logger.debug('Translation cache updated', { 
        translations: translations.length,
        languages: this.translationCache.size 
      });
    } catch (error) {
      logger.error('Error updating translation cache', { error });
    }
  }

  private getFromCache(key: string, language: string): string | null {
    const languageCache = this.translationCache.get(language);
    if (!languageCache) return null;
    return languageCache.get(key) || null;
  }

  private async getFromDatabase(
    key: string,
    language: string,
    fallbackLanguage: string
  ): Promise<string | null> {
    try {
      // Tentar buscar no idioma solicitado
      let translation = await prisma.translation.findFirst({
        where: {
          key,
          language
        },
        select: {
          value: true
        }
      });

      // Se não encontrou, tentar fallback
      if (!translation && language !== fallbackLanguage) {
        translation = await prisma.translation.findFirst({
          where: {
            key,
            language: fallbackLanguage
          },
          select: {
            value: true
          }
        });
      }

      return translation?.value ?? null;
    } catch (error) {
      logger.error('Error getting translation from database', { key, language, error });
      return null;
    }
  }

  private replaceVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }
}

// Instância singleton
export const i18nService = I18nService.getInstance();

// Funções de conveniência
export const t = (
  key: string,
  language: string = 'en',
  variables: Record<string, any> = {}
): Promise<string> => {
  return i18nService.translate(key, language, variables);
};

export const detectLanguage = (countryCode: string): string => {
  return i18nService.getLanguageByCountry(countryCode);
};

export const formatMessage = (
  template: string,
  variables: Record<string, any> = {}
): string => {
  return i18nService.formatMessage(template, variables);
};