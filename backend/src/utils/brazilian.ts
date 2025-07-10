import axios from 'axios';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/pt-br';
import { BrazilianAddress, CPFValidation, CNPJValidation } from '../types';

// Configurar dayjs para o Brasil
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pt-br');

/**
 * Utilitários para formatação de valores brasileiros
 */
export class BrazilianFormatters {
  /**
   * Formatar valor em Real brasileiro
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
}

/**
 * Validadores de documentos brasileiros
 */
export class BrazilianValidators {
  /**
   * Validar CPF
   */
  static validateCPF(cpf: string): CPFValidation {
    const digits = cpf.replace(/\D/g, '');

    if (digits.length !== 11) {
      return { valid: false, message: 'CPF deve ter 11 dígitos' };
    }

    // Verifica se não é uma sequência repetida
    if (/^(\d)\1{10}$/.test(digits)) {
      return { valid: false, message: 'CPF não pode ser uma sequência repetida' };
    }

    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    const isValid = digits.charAt(9) === digit1.toString() && digits.charAt(10) === digit2.toString();

    if (isValid) {
      return {
        valid: true,
        formatted: BrazilianFormatters.formatCPF(digits)
      };
    } else {
      return {
        valid: false,
        message: 'CPF inválido'
      };
    }
  }

  /**
   * Validar CNPJ
   */
  static validateCNPJ(cnpj: string): CNPJValidation {
    const digits = cnpj.replace(/\D/g, '');

    if (digits.length !== 14) {
      return { valid: false, message: 'CNPJ deve ter 14 dígitos' };
    }

    // Verifica se não é uma sequência repetida
    if (/^(\d)\1{13}$/.test(digits)) {
      return { valid: false, message: 'CNPJ não pode ser uma sequência repetida' };
    }

    // Calcula primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits.charAt(i)) * (weights1[i] ?? 0);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    // Calcula segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits.charAt(i)) * (weights2[i] ?? 0);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    const isValid = digits.charAt(12) === digit1.toString() && digits.charAt(13) === digit2.toString();

    if (isValid) {
      return {
        valid: true,
        formatted: BrazilianFormatters.formatCNPJ(digits)
      };
    } else {
      return {
        valid: false,
        message: 'CNPJ inválido'
      };
    }
  }

  /**
   * Validar CEP
   */
  static validateCEP(cep: string): boolean {
    const digits = cep.replace(/\D/g, '');
    return /^\d{8}$/.test(digits);
  }
}

/**
 * Integração com API do ViaCEP
 */
export class CEPService {
  private static readonly BASE_URL = 'https://viacep.com.br/ws';

  /**
   * Buscar endereço por CEP
   */
  static async getAddress(cep: string): Promise<BrazilianAddress | null> {
    try {
      const cleanCEP = cep.replace(/\D/g, '');

      if (!BrazilianValidators.validateCEP(cleanCEP)) {
        throw new Error('CEP inválido');
      }

      const response = await axios.get(`${this.BASE_URL}/${cleanCEP}/json/`, {
        timeout: 5000
      });

      if (response.data.erro) {
        return null;
      }

      return {
        cep: BrazilianFormatters.formatCEP(response.data.cep),
        logradouro: response.data.logradouro,
        numero: '',
        complemento: response.data.complemento || undefined,
        bairro: response.data.bairro,
        cidade: response.data.localidade,
        estado: response.data.uf,
        pais: 'Brasil'
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }
}

/**
 * Utilitários de timezone para o Brasil
 */
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
    let current = startDate;
    let businessDays = 0;

    while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
      if (current.day() !== 0 && current.day() !== 6) {
        businessDays++;
      }
      current = current.add(1, 'day');
    }

    return businessDays;
  }
}

/**
 * Gerador de códigos brasileiros
 */
export class BrazilianCodeGenerator {
  /**
   * Gerar código de rastreamento brasileiro
   */
  static generateTrackingCode(): string {
    const prefix = 'BR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * Gerar número de pedido brasileiro
   */
  static generateOrderNumber(): string {
    const date = BrazilianTimeUtils.now().format('YYYYMMDD');
    const random = Math.random().toString().slice(-4);
    return `PED${date}${random}`;
  }

  /**
   * Gerar código de protocolo
   */
  static generateProtocol(): string {
    const timestamp = BrazilianTimeUtils.now().format('YYMMDDHHmmss');
    const random = Math.random().toString(36).substring(2, 4).toUpperCase();
    return `${timestamp}${random}`;
  }
}

/**
 * Calculadora de frete para Brasil
 */
export class BrazilianShippingCalculator {
  /**
   * Calcular prazo de entrega baseado na distância entre CEPs
   */
  static estimateDeliveryDays(originCEP: string, destCEP: string): number {
    const originState = this.getStateFromCEP(originCEP);
    const destState = this.getStateFromCEP(destCEP);

    // Mesmo estado: 1-3 dias
    if (originState === destState) {
      return Math.floor(Math.random() * 3) + 1;
    }

    // Estados vizinhos: 3-5 dias
    const neighborStates = this.getNeighborStates(originState);
    if (neighborStates.includes(destState)) {
      return Math.floor(Math.random() * 3) + 3;
    }

    // Outros estados: 5-10 dias
    return Math.floor(Math.random() * 6) + 5;
  }

  private static getStateFromCEP(cep: string): string {
    const cleanCEP = cep.replace(/\D/g, '');
    const cepNumber = parseInt(cleanCEP);

    // Mapeamento simplificado de faixas de CEP por estado
    if (cepNumber >= 1000000 && cepNumber <= 19999999) return 'SP';
    if (cepNumber >= 20000000 && cepNumber <= 28999999) return 'RJ';
    if (cepNumber >= 30000000 && cepNumber <= 39999999) return 'MG';
    if (cepNumber >= 40000000 && cepNumber <= 48999999) return 'BA';
    if (cepNumber >= 50000000 && cepNumber <= 56999999) return 'PE';
    if (cepNumber >= 60000000 && cepNumber <= 63999999) return 'CE';
    if (cepNumber >= 70000000 && cepNumber <= 72999999) return 'DF';
    if (cepNumber >= 80000000 && cepNumber <= 87999999) return 'PR';
    if (cepNumber >= 90000000 && cepNumber <= 99999999) return 'RS';

    return 'SP'; // Default
  }

  private static getNeighborStates(state: string): string[] {
    const neighbors: Record<string, string[]> = {
      'SP': ['RJ', 'MG', 'PR', 'MS'],
      'RJ': ['SP', 'MG', 'ES'],
      'MG': ['SP', 'RJ', 'ES', 'BA', 'GO', 'DF'],
      'PR': ['SP', 'SC', 'MS'],
      'RS': ['SC'],
      'SC': ['PR', 'RS'],
      // Adicionar mais conforme necessário
    };

    return neighbors[state] || [];
  }
}

/**
 * Validar CNPJ
 */
export function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  if (cleanCNPJ.length !== 14) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  let weight = 5;

  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ[i] || '0') * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cleanCNPJ[12] || '0') !== digit1) return false;

  // Validar segundo dígito verificador
  sum = 0;
  weight = 6;

  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ[i] || '0') * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }

  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cleanCNPJ[13] || '0') === digit2;
}

/**
 * Formatar CNPJ
 */
export function formatCNPJ(cnpj: string): string {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

  if (cleanCNPJ.length !== 14) return cnpj;

  return cleanCNPJ.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Formatar valor em Real brasileiro (função utilitária)
 */
export const formatCurrency = (value: number): string => {
  return BrazilianFormatters.formatCurrency(value);
};

/**
 * Formatar número com separadores brasileiros (função utilitária)
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return BrazilianFormatters.formatNumber(value, decimals);
};

/**
 * Formatar data no padrão brasileiro (função utilitária)
 */
export const formatDate = (date: Date | string, format: string = 'DD/MM/YYYY'): string => {
  return BrazilianFormatters.formatDate(date, format);
};

/**
 * Formatar data e hora no padrão brasileiro (função utilitária)
 */
export const formatDateTime = (date: Date | string): string => {
  return BrazilianFormatters.formatDateTime(date);
};
