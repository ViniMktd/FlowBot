import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

export interface ShopifyConfig {
  shop: string;
  apiKey: string;
  apiSecret: string;
  accessToken?: string;
  webhookSecret?: string;
  apiVersion: string;
}

export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string;
  status: 'active' | 'archived' | 'draft';
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  created_at: string;
  updated_at: string;
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  inventory_quantity: number;
  weight: number;
  weight_unit: string;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  alt: string;
}

export interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: ShopifyLineItem[];
  customer: ShopifyCustomer;
  shipping_address: ShopifyAddress;
  billing_address: ShopifyAddress;
}

export interface ShopifyLineItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  variant_title: string;
  sku: string;
  price: string;
  quantity: number;
  total_discount: string;
}

export interface ShopifyCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
  addresses: ShopifyAddress[];
}

export interface ShopifyAddress {
  id?: number;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  country: string;
  zip: string;
  phone?: string;
  company?: string;
}

export interface ShopifyFulfillment {
  id?: number;
  order_id: number;
  location_id?: number;
  status: 'pending' | 'open' | 'success' | 'cancelled' | 'error' | 'failure';
  tracking_company?: string;
  tracking_number?: string;
  tracking_urls?: string[];
  line_items: ShopifyLineItem[];
  notify_customer: boolean;
}

/**
 * Serviço real de integração com Shopify
 */
export class ShopifyRealService {
  private config: ShopifyConfig;
  private baseUrl: string;

  constructor(config: ShopifyConfig) {
    this.config = config;
    this.baseUrl = `https://${config.shop}.myshopify.com/admin/api/${config.apiVersion}`;
  }

  /**
   * Configurar headers para requisições autenticadas
   */
  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': this.config.accessToken!,
    };
  }

  /**
   * Fazer requisição autenticada para API do Shopify
   */
  private async makeRequest(method: string, endpoint: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: this.getHeaders(),
        data,
      });

      return response.data;
    } catch (error: any) {
      logger.error('Shopify API error:', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        endpoint,
      });
      throw new Error(`Shopify API error: ${error.message}`);
    }
  }

  /**
   * Verificar webhook signature do Shopify
   */
  static verifyWebhook(body: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(body, 'utf8');
    const calculatedSignature = hmac.digest('base64');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSignature)
    );
  }

  /**
   * Obter informações da loja
   */
  async getShopInfo() {
    return await this.makeRequest('GET', '/shop.json');
  }

  /**
   * Buscar produtos
   */
  async getProducts(params: {
    limit?: number;
    page_info?: string;
    status?: 'active' | 'archived' | 'draft';
    vendor?: string;
    product_type?: string;
  } = {}): Promise<{ products: ShopifyProduct[] }> {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.page_info) queryParams.append('page_info', params.page_info);
    if (params.status) queryParams.append('status', params.status);
    if (params.vendor) queryParams.append('vendor', params.vendor);
    if (params.product_type) queryParams.append('product_type', params.product_type);

    const query = queryParams.toString();
    const endpoint = `/products.json${query ? `?${query}` : ''}`;
    
    return await this.makeRequest('GET', endpoint);
  }

  /**
   * Buscar produto específico
   */
  async getProduct(productId: number): Promise<{ product: ShopifyProduct }> {
    return await this.makeRequest('GET', `/products/${productId}.json`);
  }

  /**
   * Buscar pedidos
   */
  async getOrders(params: {
    limit?: number;
    page_info?: string;
    status?: 'open' | 'closed' | 'cancelled' | 'any';
    financial_status?: 'pending' | 'authorized' | 'paid' | 'refunded';
    fulfillment_status?: 'shipped' | 'partial' | 'unshipped' | 'any';
    created_at_min?: string;
    created_at_max?: string;
  } = {}): Promise<{ orders: ShopifyOrder[] }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const query = queryParams.toString();
    const endpoint = `/orders.json${query ? `?${query}` : ''}`;
    
    return await this.makeRequest('GET', endpoint);
  }

  /**
   * Buscar pedido específico
   */
  async getOrder(orderId: number): Promise<{ order: ShopifyOrder }> {
    return await this.makeRequest('GET', `/orders/${orderId}.json`);
  }

  /**
   * Atualizar status de um pedido
   */
  async updateOrder(orderId: number, updateData: {
    note?: string;
    tags?: string;
    metafields?: any[];
  }): Promise<{ order: ShopifyOrder }> {
    return await this.makeRequest('PUT', `/orders/${orderId}.json`, {
      order: updateData
    });
  }

  /**
   * Criar fulfillment (confirmar envio)
   */
  async createFulfillment(fulfillmentData: ShopifyFulfillment): Promise<{ fulfillment: ShopifyFulfillment }> {
    const { order_id, ...data } = fulfillmentData;
    
    return await this.makeRequest('POST', `/orders/${order_id}/fulfillments.json`, {
      fulfillment: data
    });
  }

  /**
   * Atualizar fulfillment
   */
  async updateFulfillment(orderId: number, fulfillmentId: number, updateData: {
    tracking_number?: string;
    tracking_company?: string;
    tracking_urls?: string[];
    notify_customer?: boolean;
  }): Promise<{ fulfillment: ShopifyFulfillment }> {
    return await this.makeRequest('PUT', `/orders/${orderId}/fulfillments/${fulfillmentId}.json`, {
      fulfillment: updateData
    });
  }

  /**
   * Buscar clientes
   */
  async getCustomers(params: {
    limit?: number;
    page_info?: string;
    created_at_min?: string;
    created_at_max?: string;
  } = {}): Promise<{ customers: ShopifyCustomer[] }> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value.toString());
    });

    const query = queryParams.toString();
    const endpoint = `/customers.json${query ? `?${query}` : ''}`;
    
    return await this.makeRequest('GET', endpoint);
  }

  /**
   * Buscar cliente específico
   */
  async getCustomer(customerId: number): Promise<{ customer: ShopifyCustomer }> {
    return await this.makeRequest('GET', `/customers/${customerId}.json`);
  }

  /**
   * Configurar webhooks
   */
  async createWebhook(webhook: {
    topic: string;
    address: string;
    format?: 'json' | 'xml';
  }): Promise<{ webhook: any }> {
    return await this.makeRequest('POST', '/webhooks.json', {
      webhook: {
        format: 'json',
        ...webhook
      }
    });
  }

  /**
   * Listar webhooks existentes
   */
  async getWebhooks(): Promise<{ webhooks: any[] }> {
    return await this.makeRequest('GET', '/webhooks.json');
  }

  /**
   * Sincronizar pedido do Shopify para o banco local
   */
  async syncOrderToDatabase(shopifyOrder: ShopifyOrder) {
    try {
      // Verificar se o pedido já existe
      const existingOrder = await prisma.order.findUnique({
        where: { shopifyOrderId: shopifyOrder.id.toString() }
      });

      if (existingOrder) {
        logger.info(`Pedido ${shopifyOrder.name} já existe no banco de dados`);
        return existingOrder;
      }

      // Buscar ou criar cliente
      let customer = await prisma.customer.findFirst({
        where: { email: shopifyOrder.customer.email }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            nome: `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}`,
            email: shopifyOrder.customer.email,
            telefone: shopifyOrder.customer.phone || '',
            documento: '', // Será preenchido posteriormente se necessário
            tipoDocumento: 'CPF',
            endereco: {
              cep: shopifyOrder.shipping_address.zip,
              logradouro: shopifyOrder.shipping_address.address1,
              numero: '',
              complemento: shopifyOrder.shipping_address.address2 || '',
              bairro: '',
              cidade: shopifyOrder.shipping_address.city,
              estado: shopifyOrder.shipping_address.province,
              pais: shopifyOrder.shipping_address.country,
            },
            country: this.detectCountryCode(shopifyOrder.shipping_address.country),
            preferredLanguage: this.detectLanguageFromCountry(shopifyOrder.shipping_address.country),
            dataCriacao: new Date().toISOString(),
          }
        });
      }

      // Criar pedido no banco local
      const order = await prisma.order.create({
        data: {
          numeroPedido: this.generateOrderNumber(),
          shopifyOrderId: shopifyOrder.id.toString(),
          clienteId: customer.id,
          status: this.mapShopifyStatus(shopifyOrder.financial_status, shopifyOrder.fulfillment_status),
          valorTotal: parseFloat(shopifyOrder.total_price),
          enderecoEntrega: {
            cep: shopifyOrder.shipping_address.zip,
            logradouro: shopifyOrder.shipping_address.address1,
            numero: '',
            complemento: shopifyOrder.shipping_address.address2 || '',
            bairro: '',
            cidade: shopifyOrder.shipping_address.city,
            estado: shopifyOrder.shipping_address.province,
            pais: shopifyOrder.shipping_address.country,
          },
          dataCriacao: shopifyOrder.created_at,
          dataAtualizacao: shopifyOrder.updated_at,
        }
      });

      // Criar itens do pedido
      for (const lineItem of shopifyOrder.line_items) {
        // Buscar ou criar produto
        let product = await prisma.product.findFirst({
          where: { sku: lineItem.sku }
        });

        if (!product) {
          product = await prisma.product.create({
            data: {
              nome: lineItem.title,
              sku: lineItem.sku,
              preco: parseFloat(lineItem.price),
              peso: 0, // Será atualizado via sync de produtos
              categoria: '',
              fornecedorId: '', // Será atribuído posteriormente
              ativo: true,
              dataCriacao: new Date().toISOString(),
            }
          });
        }

        await prisma.orderItem.create({
          data: {
            orderId: order.id,
            produtoId: product.id,
            quantidade: lineItem.quantity,
            precoUnitario: parseFloat(lineItem.price),
          }
        });
      }

      logger.info(`Pedido ${shopifyOrder.name} sincronizado com sucesso`);
      return order;

    } catch (error) {
      logger.error('Erro ao sincronizar pedido do Shopify:', error);
      throw error;
    }
  }

  /**
   * Gerar número de pedido único
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `BR-${timestamp}-${random}`;
  }

  /**
   * Mapear status do Shopify para status interno
   */
  private mapShopifyStatus(financialStatus: string, fulfillmentStatus: string): string {
    if (financialStatus === 'paid' && fulfillmentStatus === 'fulfilled') {
      return 'ENTREGUE';
    }
    if (financialStatus === 'paid' && fulfillmentStatus === 'shipped') {
      return 'ENVIADO';
    }
    if (financialStatus === 'paid' && fulfillmentStatus === 'partial') {
      return 'PROCESSANDO';
    }
    if (financialStatus === 'paid') {
      return 'CONFIRMADO';
    }
    if (financialStatus === 'pending') {
      return 'PENDENTE';
    }
    return 'PENDENTE';
  }

  /**
   * Detectar código do país
   */
  private detectCountryCode(countryName: string): string {
    const countryMap: Record<string, string> = {
      'Brazil': 'BR',
      'Brasil': 'BR',
      'United States': 'US',
      'China': 'CN',
      'Germany': 'DE',
      'Deutschland': 'DE',
    };
    return countryMap[countryName] || 'BR';
  }

  /**
   * Detectar idioma baseado no país
   */
  private detectLanguageFromCountry(countryName: string): string {
    const countryCode = this.detectCountryCode(countryName);
    const languageMap: Record<string, string> = {
      'BR': 'pt-BR',
      'US': 'en',
      'CN': 'zh-CN',
      'DE': 'de',
    };
    return languageMap[countryCode] || 'pt-BR';
  }

  /**
   * Setup inicial dos webhooks necessários
   */
  async setupWebhooks(baseUrl: string) {
    const webhooksToCreate = [
      {
        topic: 'orders/create',
        address: `${baseUrl}/api/webhooks/shopify/orders/create`,
      },
      {
        topic: 'orders/updated',
        address: `${baseUrl}/api/webhooks/shopify/orders/updated`,
      },
      {
        topic: 'orders/paid',
        address: `${baseUrl}/api/webhooks/shopify/orders/paid`,
      },
      {
        topic: 'orders/cancelled',
        address: `${baseUrl}/api/webhooks/shopify/orders/cancelled`,
      },
      {
        topic: 'orders/fulfilled',
        address: `${baseUrl}/api/webhooks/shopify/orders/fulfilled`,
      },
    ];

    const results = [];
    for (const webhook of webhooksToCreate) {
      try {
        const result = await this.createWebhook(webhook);
        results.push(result);
        logger.info(`Webhook criado: ${webhook.topic}`);
      } catch (error) {
        logger.error(`Erro ao criar webhook ${webhook.topic}:`, error);
      }
    }

    return results;
  }
}

export default ShopifyRealService;