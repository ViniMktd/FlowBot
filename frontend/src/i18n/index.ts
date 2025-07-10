import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translation files
import ptBR from './locales/pt-BR.json';
import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

// Initialize i18n
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Fallback language
    fallbackLng: 'pt-BR',
    
    // Default language
    lng: 'pt-BR',
    
    // Available languages
    supportedLngs: ['pt-BR', 'en', 'zh-CN'],
    
    // Debug mode (only in development)
    debug: process.env.NODE_ENV === 'development',
    
    // Detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
    },
    
    // Resources
    resources: {
      'pt-BR': {
        translation: ptBR
      },
      'en': {
        translation: en
      },
      'zh-CN': {
        translation: zhCN
      }
    },
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      formatSeparator: ',',
      format: (value, format, lng) => {
        if (format === 'uppercase') return value.toUpperCase();
        if (format === 'lowercase') return value.toLowerCase();
        if (format === 'currency') {
          const locale = lng === 'pt-BR' ? 'pt-BR' : lng === 'zh-CN' ? 'zh-CN' : 'en-US';
          const currency = lng === 'pt-BR' ? 'BRL' : lng === 'zh-CN' ? 'CNY' : 'USD';
          return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
          }).format(value);
        }
        if (format === 'number') {
          const locale = lng === 'pt-BR' ? 'pt-BR' : lng === 'zh-CN' ? 'zh-CN' : 'en-US';
          return new Intl.NumberFormat(locale).format(value);
        }
        return value;
      },
    },
    
    // Namespace options
    defaultNS: 'translation',
    ns: ['translation'],
    
    // React options
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span'],
    },
    
    // Backend options (for HTTP loading)
    backend: {
      loadPath: '/api/translations/{{lng}}',
      allowMultiLoading: false,
      parse: (data: string) => JSON.parse(data),
      crossDomain: false,
    },
  });

export default i18n;

// Utility functions
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
  localStorage.setItem('i18nextLng', language);
};

export const getCurrentLanguage = () => {
  return i18n.language || 'pt-BR';
};

export const getAvailableLanguages = () => {
  return [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  ];
};

export const detectCountryLanguage = (countryCode: string): string => {
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
};