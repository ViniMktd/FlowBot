import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export interface ShippingCalculationData {
  originPostalCode: string;
  destinationPostalCode: string;
  weight: number; // em kg
  length: number; // em cm
  width: number; // em cm
  height: number; // em cm
  value?: number; // valor declarado
  services?: string[]; // códigos dos serviços
}

export interface ShippingResult {
  service: string;
  serviceName: string;
  price: number;
  deliveryTime: number;
  error?: string;
}

export interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  description: string;
}

export interface TrackingResult {
  trackingCode: string;
  status: string;
  service: string;
  events: TrackingEvent[];
  deliveredAt?: string;
  estimatedDelivery?: string;
}

export interface PostalCodeInfo {
  postalCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  stateCode: string;
  country: string;
  valid: boolean;
}

/**
 * Serviço para integração com APIs dos Correios
 * Suporta cálculo de frete, rastreamento e consulta de CEP
 */
export class CorreiosService {
  private api: AxiosInstance;
  private viaCepApi: AxiosInstance;

  // Códigos dos serviços dos Correios
  static readonly SERVICES = {
    PAC: '04669', // PAC
    SEDEX: '04014', // SEDEX
    SEDEX_10: '40215', // SEDEX 10
    SEDEX_12: '40169', // SEDEX 12
    SEDEX_TODAY: '40290', // SEDEX Hoje
    CARTA_REGISTRADA: '04510', // Carta Registrada
  };

  constructor() {
    // API principal dos Correios (pode usar API oficial ou service intermediário)
    this.api = axios.create({
      baseURL: process.env.CORREIOS_API_URL || 'https://ws.correios.com.br',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FlowBot/1.0',
      },
    });

    // API do ViaCEP para consulta de CEP
    this.viaCepApi = axios.create({
      baseURL: 'https://viacep.com.br/ws',
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        logger.info('Correios API Request:', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        logger.error('Correios API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        logger.info('Correios API Response:', {
          status: response.status,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        logger.error('Correios API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Calcular frete para múltiplos serviços
   */
  async calculateShipping(data: ShippingCalculationData): Promise<ShippingResult[]> {
    try {
      const services = data.services || [
        CorreiosService.SERVICES.PAC,
        CorreiosService.SERVICES.SEDEX,
      ];

      const results: ShippingResult[] = [];

      for (const serviceCode of services) {
        try {
          const result = await this.calculateSingleService(data, serviceCode);
          results.push(result);
        } catch (error: any) {
          results.push({
            service: serviceCode,
            serviceName: this.getServiceName(serviceCode),
            price: 0,
            deliveryTime: 0,
            error: error.message,
          });
        }
      }

      logger.info('Cálculo de frete realizado:', {
        origin: data.originPostalCode,
        destination: data.destinationPostalCode,
        servicesCalculated: results.length,
      });

      return results;
    } catch (error: any) {
      logger.error('Erro ao calcular frete:', error);
      throw new ApiError(500, `Erro ao calcular frete: ${error.message}`);
    }
  }

  /**
   * Calcular frete para um serviço específico
   */
  private async calculateSingleService(
    data: ShippingCalculationData,
    serviceCode: string
  ): Promise<ShippingResult> {
    try {
      // Implementação usando API dos Correios (pode variar dependendo da API disponível)
      const params = {
        nCdEmpresa: process.env.CORREIOS_COMPANY_CODE || '',
        sDsSenha: process.env.CORREIOS_PASSWORD || '',
        nCdServico: serviceCode,
        sCepOrigem: data.originPostalCode.replace(/\D/g, ''),
        sCepDestino: data.destinationPostalCode.replace(/\D/g, ''),
        nVlPeso: data.weight,
        nCdFormato: '1', // Caixa/Pacote
        nVlComprimento: data.length,
        nVlAltura: data.height,
        nVlLargura: data.width,
        nVlDiametro: '0',
        sCdMaoPropria: 'N',
        nVlValorDeclarado: data.value || 0,
        sCdAvisoRecebimento: 'N',
        StrRetorno: 'xml',
      };

      // Como a API oficial dos Correios pode ter limitações,
      // vou implementar uma simulação realista para demonstração
      const simulatedResult = this.simulateShippingCalculation(data, serviceCode);

      return simulatedResult;
    } catch (error: any) {
      logger.error('Erro ao calcular serviço específico:', error);
      throw new Error(`Erro no serviço ${serviceCode}: ${error.message}`);
    }
  }

  /**
   * Simulação de cálculo de frete (para demonstração)
   */
  private simulateShippingCalculation(
    data: ShippingCalculationData,
    serviceCode: string
  ): ShippingResult {
    const serviceName = this.getServiceName(serviceCode);
    
    // Calcular preço baseado em peso e distância (simulado)
    const basePrice = this.calculateBasePrice(serviceCode);
    const weightFactor = Math.max(data.weight, 1) * 2.5;
    const sizeFactor = (data.length * data.width * data.height) / 1000000 * 0.5;
    
    const price = Math.round((basePrice + weightFactor + sizeFactor) * 100) / 100;
    
    // Calcular prazo de entrega baseado no serviço
    const deliveryTime = this.calculateDeliveryTime(serviceCode);

    return {
      service: serviceCode,
      serviceName,
      price,
      deliveryTime,
    };
  }

  /**
   * Obter preço base por serviço
   */
  private calculateBasePrice(serviceCode: string): number {
    const basePrices: Record<string, number> = {
      [CorreiosService.SERVICES.PAC]: 15.00,
      [CorreiosService.SERVICES.SEDEX]: 25.00,
      [CorreiosService.SERVICES.SEDEX_10]: 35.00,
      [CorreiosService.SERVICES.SEDEX_12]: 30.00,
      [CorreiosService.SERVICES.SEDEX_TODAY]: 45.00,
      [CorreiosService.SERVICES.CARTA_REGISTRADA]: 8.00,
    };
    return basePrices[serviceCode] || 20.00;
  }

  /**
   * Calcular prazo de entrega
   */
  private calculateDeliveryTime(serviceCode: string): number {
    const deliveryTimes: Record<string, number> = {
      [CorreiosService.SERVICES.PAC]: 8,
      [CorreiosService.SERVICES.SEDEX]: 3,
      [CorreiosService.SERVICES.SEDEX_10]: 1,
      [CorreiosService.SERVICES.SEDEX_12]: 1,
      [CorreiosService.SERVICES.SEDEX_TODAY]: 1,
      [CorreiosService.SERVICES.CARTA_REGISTRADA]: 5,
    };
    return deliveryTimes[serviceCode] || 5;
  }

  /**
   * Obter nome do serviço
   */
  private getServiceName(serviceCode: string): string {
    const serviceNames: Record<string, string> = {
      [CorreiosService.SERVICES.PAC]: 'PAC',
      [CorreiosService.SERVICES.SEDEX]: 'SEDEX',
      [CorreiosService.SERVICES.SEDEX_10]: 'SEDEX 10',
      [CorreiosService.SERVICES.SEDEX_12]: 'SEDEX 12',
      [CorreiosService.SERVICES.SEDEX_TODAY]: 'SEDEX Hoje',
      [CorreiosService.SERVICES.CARTA_REGISTRADA]: 'Carta Registrada',
    };
    return serviceNames[serviceCode] || `Serviço ${serviceCode}`;
  }

  /**
   * Rastrear encomenda
   */
  async trackPackage(trackingCode: string): Promise<TrackingResult> {
    try {
      // Implementação para rastreamento real seria aqui
      // Por enquanto, vou simular um resultado
      const simulatedTracking = this.simulateTracking(trackingCode);

      logger.info('Rastreamento realizado:', {
        trackingCode,
        status: simulatedTracking.status,
        eventsCount: simulatedTracking.events.length,
      });

      return simulatedTracking;
    } catch (error: any) {
      logger.error('Erro ao rastrear encomenda:', error);
      throw new ApiError(500, `Erro ao rastrear encomenda: ${error.message}`);
    }
  }

  /**
   * Simulação de rastreamento
   */
  private simulateTracking(trackingCode: string): TrackingResult {
    const events: TrackingEvent[] = [
      {
        date: '2024-01-15',
        time: '08:30',
        location: 'Centro de Distribuição - São Paulo/SP',
        status: 'Postado',
        description: 'Objeto postado nos Correios',
      },
      {
        date: '2024-01-15',
        time: '14:20',
        location: 'Centro de Triagem - São Paulo/SP',
        status: 'Em Trânsito',
        description: 'Objeto em trânsito entre unidades dos Correios',
      },
      {
        date: '2024-01-16',
        time: '10:15',
        location: 'Unidade de Distribuição - Rio de Janeiro/RJ',
        status: 'Em Trânsito',
        description: 'Objeto chegou à unidade de distribuição',
      },
      {
        date: '2024-01-17',
        time: '09:00',
        location: 'Unidade de Distribuição - Rio de Janeiro/RJ',
        status: 'Saiu para Entrega',
        description: 'Objeto saiu para entrega ao destinatário',
      },
    ];

    return {
      trackingCode,
      status: 'Saiu para Entrega',
      service: 'SEDEX',
      events,
      estimatedDelivery: '2024-01-17',
    };
  }

  /**
   * Consultar informações de CEP
   */
  async getPostalCodeInfo(postalCode: string): Promise<PostalCodeInfo> {
    try {
      const cleanPostalCode = postalCode.replace(/\D/g, '');
      
      if (cleanPostalCode.length !== 8) {
        throw new ApiError(400, 'CEP deve conter 8 dígitos');
      }

      const response = await this.viaCepApi.get(`/${cleanPostalCode}/json/`);

      if (response.data.erro) {
        throw new ApiError(404, 'CEP não encontrado');
      }

      const info: PostalCodeInfo = {
        postalCode: cleanPostalCode,
        street: response.data.logradouro || '',
        neighborhood: response.data.bairro || '',
        city: response.data.localidade,
        state: response.data.uf,
        stateCode: response.data.uf,
        country: 'Brasil',
        valid: true,
      };

      logger.info('Consulta de CEP realizada:', {
        postalCode: cleanPostalCode,
        city: info.city,
        state: info.state,
      });

      return info;
    } catch (error: any) {
      logger.error('Erro ao consultar CEP:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(500, `Erro ao consultar CEP: ${error.message}`);
    }
  }

  /**
   * Validar CEP
   */
  validatePostalCode(postalCode: string): boolean {
    const cleanPostalCode = postalCode.replace(/\D/g, '');
    return cleanPostalCode.length === 8 && /^\d+$/.test(cleanPostalCode);
  }

  /**
   * Formatar CEP
   */
  static formatPostalCode(postalCode: string): string {
    const cleanPostalCode = postalCode.replace(/\D/g, '');
    if (cleanPostalCode.length === 8) {
      return `${cleanPostalCode.substring(0, 5)}-${cleanPostalCode.substring(5)}`;
    }
    return postalCode;
  }

  /**
   * Calcular dimensões mínimas para envio
   */
  static calculateMinimumDimensions(length: number, width: number, height: number) {
    // Dimensões mínimas dos Correios
    const minLength = Math.max(length, 16);
    const minWidth = Math.max(width, 11);
    const minHeight = Math.max(height, 2);
    
    return {
      length: minLength,
      width: minWidth,
      height: minHeight,
    };
  }

  /**
   * Validar dimensões para envio
   */
  static validateDimensions(length: number, width: number, height: number, weight: number): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Limites dos Correios
    const maxLength = 105;
    const maxWidth = 105;
    const maxHeight = 105;
    const maxWeight = 30;
    const maxSum = 200; // soma das dimensões
    
    if (length > maxLength) errors.push(`Comprimento máximo: ${maxLength}cm`);
    if (width > maxWidth) errors.push(`Largura máxima: ${maxWidth}cm`);
    if (height > maxHeight) errors.push(`Altura máxima: ${maxHeight}cm`);
    if (weight > maxWeight) errors.push(`Peso máximo: ${maxWeight}kg`);
    if ((length + width + height) > maxSum) {
      errors.push(`Soma das dimensões máxima: ${maxSum}cm`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Obter lista de serviços disponíveis
   */
  static getAvailableServices(): Array<{ code: string; name: string; description: string }> {
    return [
      {
        code: CorreiosService.SERVICES.PAC,
        name: 'PAC',
        description: 'Encomenda econômica com prazo estendido',
      },
      {
        code: CorreiosService.SERVICES.SEDEX,
        name: 'SEDEX',
        description: 'Encomenda expressa',
      },
      {
        code: CorreiosService.SERVICES.SEDEX_10,
        name: 'SEDEX 10',
        description: 'Entrega até as 10h do próximo dia útil',
      },
      {
        code: CorreiosService.SERVICES.SEDEX_12,
        name: 'SEDEX 12',
        description: 'Entrega até as 12h do próximo dia útil',
      },
      {
        code: CorreiosService.SERVICES.SEDEX_TODAY,
        name: 'SEDEX Hoje',
        description: 'Entrega no mesmo dia',
      },
    ];
  }
}

export default CorreiosService;