// Utilitários compartilhados para formatação e validação brasileira

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Configurar dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

/* ==========================================
   FORMATADORES BRASILEIROS
   ========================================== */

export class BrazilianFormatters {
  /**
   * Formatar valor monetário em Real brasileiro
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formatar número com separadores brasileiros
   */
  static formatNumber(value: number, decimals: number = 2): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  }

  /**
   * Formatar data no padrão brasileiro
   */
  static formatDate(date: Date | string, format: string = 'DD/MM/YYYY'): string {
    return dayjs(date).tz('America/Sao_Paulo').format(format);
  }

  /**
   * Formatar data e hora no padrão brasileiro
   */
  static formatDateTime(date: Date | string): string {
    return dayjs(date).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss');
  }

  /**
   * Formatar CPF
   */
  static formatCPF(cpf: string): string {
    const digits = cpf.replace(/\D/g, '');
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  /**
   * Formatar CNPJ
   */
  static formatCNPJ(cnpj: string): string {
    const digits = cnpj.replace(/\D/g, '');
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  /**
   * Formatar CEP
   */
  static formatCEP(cep: string): string {
    const digits = cep.replace(/\D/g, '');
    return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  /**
   * Formatar telefone brasileiro
   */
  static formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');

    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone;
  }

  /**
   * Formatar peso (gramas para kg)
   */
  static formatWeight(gramas: number): string {
    if (gramas < 1000) {
      return `${gramas}g`;
    }
    return `${(gramas / 1000).toFixed(2)}kg`;
  }

  /**
   * Formatar dimensões (cm)
   */
  static formatDimensions(altura: number, largura: number, comprimento: number): string {
    return `${altura} x ${largura} x ${comprimento} cm`;
  }
}

/* ==========================================
   VALIDADORES BRASILEIROS
   ========================================== */

export class BrazilianValidators {
  /**
   * Validar CPF
   */
  static validateCPF(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) {
      return false;
    }

    // Validar primeiro dígito
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits[i]) * (10 - i);
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(digits[9]) !== digit1) {
      return false;
    }

    // Validar segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits[i]) * (11 - i);
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(digits[10]) === digit2;
  }

  /**
   * Validar CNPJ
   */
  static validateCNPJ(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) {
      return false;
    }

    // Validar primeiro dígito
    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(digits[12]) !== digit1) {
      return false;
    }

    // Validar segundo dígito
    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(digits[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(digits[13]) === digit2;
  }

  /**
   * Validar CEP
   */
  static validateCEP(cep: string): boolean {
    const digits = cep.replace(/\D/g, '');
    return digits.length === 8 && !/^0{8}$/.test(digits);
  }

  /**
   * Validar telefone brasileiro
   */
  static validatePhone(phone: string): boolean {
    const digits = phone.replace(/\D/g, '');
    return (digits.length === 10 || digits.length === 11) &&
           (digits.startsWith('11') || // São Paulo
           Boolean(digits.match(/^[1-9][1-9]\d{8,9}$/))); // Outros estados
  }

  /**
   * Validar email
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/* ==========================================
   UTILITÁRIOS DE TEMPO/TIMEZONE
   ========================================== */

export class BrazilianTimeUtils {
  /**
   * Obter data/hora atual no timezone do Brasil
   */
  static now(): dayjs.Dayjs {
    return dayjs().tz('America/Sao_Paulo');
  }

  /**
   * Converter data para timezone do Brasil
   */
  static toBrazilTime(date: Date | string): dayjs.Dayjs {
    return dayjs(date).tz('America/Sao_Paulo');
  }

  /**
   * Verificar se é horário comercial no Brasil (9h às 18h)
   */
  static isBusinessHours(date?: Date | string): boolean {
    const time = date ? this.toBrazilTime(date) : this.now();
    const hour = time.hour();
    const dayOfWeek = time.day();

    // Segunda a sexta (1-5), das 9h às 18h
    return dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour < 18;
  }

  /**
   * Calcular próximo dia útil
   */
  static nextBusinessDay(date?: Date | string): dayjs.Dayjs {
    let next = date ? this.toBrazilTime(date) : this.now();

    do {
      next = next.add(1, 'day');
    } while (next.day() === 0 || next.day() === 6); // Pula fins de semana

    return next;
  }

  /**
   * Calcular dias úteis entre duas datas
   */
  static businessDaysBetween(start: Date | string, end: Date | string): number {
    const startDate = this.toBrazilTime(start);
    const endDate = this.toBrazilTime(end);
    let count = 0;
    let current = startDate;

    while (current.isBefore(endDate)) {
      if (current.day() !== 0 && current.day() !== 6) {
        count++;
      }
      current = current.add(1, 'day');
    }

    return count;
  }

  /**
   * Verificar se uma data é feriado nacional brasileiro
   */
  static isBrazilianHoliday(date: Date | string): boolean {
    const targetDate = this.toBrazilTime(date);
    const year = targetDate.year();

    // Feriados fixos
    const fixedHolidays = [
      `${year}-01-01`, // Confraternização Universal
      `${year}-04-21`, // Tiradentes
      `${year}-05-01`, // Dia do Trabalhador
      `${year}-09-07`, // Independência do Brasil
      `${year}-10-12`, // Nossa Senhora Aparecida
      `${year}-11-02`, // Finados
      `${year}-11-15`, // Proclamação da República
      `${year}-12-25`, // Natal
    ];

    const dateStr = targetDate.format('YYYY-MM-DD');
    return fixedHolidays.includes(dateStr);
  }
}

/* ==========================================
   GERADORES DE CÓDIGO
   ========================================== */

export class BrazilianCodeGenerator {
  /**
   * Gerar número de pedido no formato brasileiro
   */
  static generateOrderNumber(): string {
    const now = BrazilianTimeUtils.now();
    const year = now.year();
    const month = now.format('MM');
    const day = now.format('DD');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

    return `PED${year}${month}${day}${random}`;
  }

  /**
   * Gerar código de rastreamento simulado
   */
  static generateTrackingCode(carrier: string = 'PAC'): string {
    const prefix = carrier.toUpperCase().substring(0, 2);
    const number = Math.floor(Math.random() * 999999999).toString().padStart(9, '0');
    const suffix = 'BR';

    return `${prefix}${number}${suffix}`;
  }

  /**
   * Gerar ID único brasileiro
   */
  static generateBrazilianId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `BR_${timestamp}_${random}`.toUpperCase();
  }
}

/* ==========================================
   UTILITÁRIOS DE PREÇO/FRETE
   ========================================== */

export class BrazilianPriceUtils {
  /**
   * Calcular frete básico por região
   */
  static calculateBasicShipping(cep: string, weight: number): number {
    const region = this.getRegionByCEP(cep);
    const baseRate = this.getBaseRateByRegion(region);
    const weightMultiplier = Math.ceil(weight / 1000); // Por kg

    return baseRate * weightMultiplier;
  }

  /**
   * Obter região pelo CEP
   */
  private static getRegionByCEP(cep: string): string {
    const digits = cep.replace(/\D/g, '');
    const firstDigit = parseInt(digits[0]);

    switch (firstDigit) {
      case 0:
      case 1:
        return 'SP'; // São Paulo
      case 2:
        return 'RJ'; // Rio de Janeiro
      case 3:
        return 'MG'; // Minas Gerais
      case 4:
        return 'BA'; // Bahia
      case 5:
        return 'PR'; // Paraná
      case 6:
        return 'GO'; // Goiás
      case 7:
        return 'DF'; // Distrito Federal
      case 8:
        return 'RS'; // Rio Grande do Sul
      case 9:
        return 'AM'; // Amazonas
      default:
        return 'OTHER';
    }
  }

  /**
   * Obter taxa base por região
   */
  private static getBaseRateByRegion(region: string): number {
    const rates: Record<string, number> = {
      'SP': 15.00,
      'RJ': 18.00,
      'MG': 20.00,
      'BA': 25.00,
      'PR': 22.00,
      'GO': 20.00,
      'DF': 18.00,
      'RS': 25.00,
      'AM': 35.00,
      'OTHER': 30.00
    };

    return rates[region] || rates['OTHER'];
  }

  /**
   * Aplicar desconto por volume
   */
  static applyVolumeDiscount(total: number, items: number): number {
    if (items >= 10) return total * 0.9; // 10% desconto
    if (items >= 5) return total * 0.95;  // 5% desconto
    return total;
  }

  /**
   * Calcular taxa de conveniência PIX
   */
  static calculatePixFee(amount: number): number {
    // PIX normalmente não tem taxa, mas alguns casos específicos
    return amount >= 1000 ? 2.50 : 0;
  }
}

/* ==========================================
   UTILITÁRIOS DE STRING
   ========================================== */

export class StringUtils {
  /**
   * Remover acentos de string
   */
  static removeAccents(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Converter para slug brasileiro
   */
  static toSlug(text: string): string {
    return this.removeAccents(text)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Capitalizar primeira letra de cada palavra
   */
  static titleCase(text: string): string {
    return text.replace(/\w\S*/g, (txt) =>
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Truncar texto com reticências
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Limpar número (manter apenas dígitos)
   */
  static cleanNumber(text: string): string {
    return text.replace(/\D/g, '');
  }
}

/* ==========================================
   UTILITÁRIOS DE ARRAY
   ========================================== */

export class ArrayUtils {
  /**
   * Agrupar array por propriedade
   */
  static groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Remover duplicatas de array
   */
  static unique<T>(array: T[]): T[] {
    return [...new Set(array)];
  }

  /**
   * Embaralhar array
   */
  static shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Chunk array em grupos
   */
  static chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}

/* ==========================================
   UTILITÁRIOS DE DEBOUNCE/THROTTLE
   ========================================== */

export class PerformanceUtils {
  /**
   * Debounce function
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let isThrottled = false;
    return (...args: Parameters<T>) => {
      if (!isThrottled) {
        func(...args);
        isThrottled = true;
        setTimeout(() => isThrottled = false, delay);
      }
    };
  }
}

/* ==========================================
   EXPORT DEFAULT INDEX
   ========================================== */

export default {
  BrazilianFormatters,
  BrazilianValidators,
  BrazilianTimeUtils,
  BrazilianCodeGenerator,
  BrazilianPriceUtils,
  StringUtils,
  ArrayUtils,
  PerformanceUtils
};
