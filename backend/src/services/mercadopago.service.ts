import axios, { AxiosInstance } from 'axios';
import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

export interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  notification_url?: string;
  external_reference?: string;
}

export interface PIXPaymentData {
  transaction_amount: number;
  description: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  notification_url?: string;
  external_reference?: string;
}

export interface PaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  date_created: string;
  date_approved?: string;
  qr_code?: string;
  qr_code_base64?: string;
  ticket_url?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
}

export interface PreferenceData {
  items: Array<{
    title: string;
    quantity: number;
    unit_price: number;
    description?: string;
  }>;
  payer?: {
    email: string;
    name?: string;
    surname?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  back_urls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  auto_return?: 'approved' | 'all';
  external_reference?: string;
  notification_url?: string;
  payment_methods?: {
    excluded_payment_methods?: Array<{ id: string }>;
    excluded_payment_types?: Array<{ id: string }>;
    installments?: number;
  };
}

/**
 * Serviço para integração com MercadoPago
 * Suporta pagamentos via cartão, PIX, boleto e checkout pro
 */
export class MercadoPagoService {
  private api: AxiosInstance;
  private accessToken: string;
  private publicKey: string;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    this.publicKey = process.env.MERCADOPAGO_PUBLIC_KEY || '';

    if (!this.accessToken) {
      throw new ApiError(500, 'MercadoPago access token não configurado');
    }

    this.api = axios.create({
      baseURL: process.env.MERCADOPAGO_BASE_URL || 'https://api.mercadopago.com',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Idempotency-Key': this.generateIdempotencyKey(),
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        logger.info('MercadoPago API Request:', {
          method: config.method,
          url: config.url,
          data: config.data ? JSON.stringify(config.data).substring(0, 200) : undefined,
        });
        return config;
      },
      (error) => {
        logger.error('MercadoPago API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        logger.info('MercadoPago API Response:', {
          status: response.status,
          url: response.config.url,
          data: JSON.stringify(response.data).substring(0, 200),
        });
        return response;
      },
      (error) => {
        logger.error('MercadoPago API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  private generateIdempotencyKey(): string {
    return `flowbot_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Criar pagamento PIX
   */
  async createPIXPayment(paymentData: PIXPaymentData): Promise<PaymentResponse> {
    try {
      const payload = {
        ...paymentData,
        payment_method_id: 'pix',
        notification_url: paymentData.notification_url || `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      };

      const response = await this.api.post('/v1/payments', payload);
      
      logger.info('Pagamento PIX criado:', {
        paymentId: response.data.id,
        status: response.data.status,
        amount: paymentData.transaction_amount,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao criar pagamento PIX:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao criar pagamento PIX: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Criar pagamento com cartão
   */
  async createCardPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const payload = {
        ...paymentData,
        notification_url: paymentData.notification_url || `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      };

      const response = await this.api.post('/v1/payments', payload);
      
      logger.info('Pagamento com cartão criado:', {
        paymentId: response.data.id,
        status: response.data.status,
        amount: paymentData.transaction_amount,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao criar pagamento com cartão:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao criar pagamento: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Criar preferência de checkout (Checkout Pro)
   */
  async createPreference(preferenceData: PreferenceData): Promise<any> {
    try {
      const payload = {
        ...preferenceData,
        notification_url: preferenceData.notification_url || `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
          ...preferenceData.back_urls,
        },
      };

      const response = await this.api.post('/checkout/preferences', payload);
      
      logger.info('Preferência de checkout criada:', {
        preferenceId: response.data.id,
        externalReference: preferenceData.external_reference,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao criar preferência:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao criar preferência: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Buscar pagamento por ID
   */
  async getPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.api.get(`/v1/payments/${paymentId}`);
      return response.data;
    } catch (error: any) {
      logger.error('Erro ao buscar pagamento:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao buscar pagamento: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Cancelar pagamento
   */
  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    try {
      const response = await this.api.put(`/v1/payments/${paymentId}`, {
        status: 'cancelled',
      });
      
      logger.info('Pagamento cancelado:', {
        paymentId,
        status: response.data.status,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao cancelar pagamento:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao cancelar pagamento: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Reembolsar pagamento
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      const payload = amount ? { amount } : {};
      const response = await this.api.post(`/v1/payments/${paymentId}/refunds`, payload);
      
      logger.info('Reembolso criado:', {
        paymentId,
        refundId: response.data.id,
        amount: amount || 'total',
      });

      return response.data;
    } catch (error: any) {
      logger.error('Erro ao reembolsar pagamento:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao reembolsar pagamento: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Verificar status de um pagamento
   */
  async checkPaymentStatus(paymentId: string): Promise<string> {
    try {
      const payment = await this.getPayment(paymentId);
      return payment.status;
    } catch (error) {
      logger.error('Erro ao verificar status do pagamento:', error);
      throw error;
    }
  }

  /**
   * Buscar pagamentos por referência externa
   */
  async getPaymentsByExternalReference(externalReference: string): Promise<PaymentResponse[]> {
    try {
      const response = await this.api.get('/v1/payments/search', {
        params: {
          external_reference: externalReference,
        },
      });

      return response.data.results || [];
    } catch (error: any) {
      logger.error('Erro ao buscar pagamentos por referência:', error);
      throw new ApiError(
        error.response?.status || 500,
        `Erro ao buscar pagamentos: ${error.response?.data?.message || error.message}`
      );
    }
  }

  /**
   * Validar webhook do MercadoPago
   */
  static validateWebhook(body: any, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';

      if (!webhookSecret) {
        logger.warn('Webhook secret do MercadoPago não configurado');
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      logger.error('Erro ao validar webhook do MercadoPago:', error);
      return false;
    }
  }

  /**
   * Converter status do MercadoPago para status interno
   */
  static mapPaymentStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'PENDENTE',
      'approved': 'CONFIRMADO',
      'authorized': 'AUTORIZADO', 
      'in_process': 'PROCESSANDO',
      'in_mediation': 'EM_MEDIACAO',
      'rejected': 'REJEITADO',
      'cancelled': 'CANCELADO',
      'refunded': 'REEMBOLSADO',
      'charged_back': 'ESTORNADO',
    };

    return statusMap[mpStatus] || 'DESCONHECIDO';
  }

  /**
   * Gerar QR Code para PIX (se necessário processamento adicional)
   */
  async generatePIXQRCode(paymentId: string): Promise<{ qrCode: string; qrCodeBase64: string }> {
    try {
      const payment = await this.getPayment(paymentId);
      
      if (payment.point_of_interaction?.transaction_data) {
        return {
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
        };
      }

      throw new Error('QR Code não disponível para este pagamento');
    } catch (error) {
      logger.error('Erro ao gerar QR Code PIX:', error);
      throw error;
    }
  }
}

export default MercadoPagoService;