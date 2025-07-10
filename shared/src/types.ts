// Tipos compartilhados entre backend e frontend do FlowBot

import { z } from 'zod';

/* ==========================================
   TIPOS DE AUTENTICAÇÃO E USUÁRIOS
   ========================================== */

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER' | 'READONLY';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

/* ==========================================
   TIPOS DE PEDIDOS
   ========================================== */

export interface Order {
  id: string;
  numeroPedido: string;
  shopifyOrderId: string;
  clienteId: string;
  status: OrderStatus;
  valorTotal: number;
  enderecoEntrega: Address;
  observacoes?: string;
  codigoRastreamento?: string;
  dataEntregaPrevista?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
  cliente: Customer;
  items: OrderItem[];
  fornecedor?: Supplier;
}

export type OrderStatus =
  | 'PENDENTE'
  | 'CONFIRMADO'
  | 'PROCESSANDO'
  | 'ENVIADO'
  | 'ENTREGUE'
  | 'CANCELADO';

export interface OrderItem {
  id: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto: Product;
}

export interface OrderFilters {
  status?: OrderStatus;
  clienteId?: string;
  startDate?: string;
  endDate?: string;
  shopifyOrderId?: string;
  fornecedorId?: string;
}

/* ==========================================
   TIPOS DE CLIENTES
   ========================================== */

export interface Customer {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipoDocumento: DocumentType;
  endereco: Address;
  dataCriacao: string;
  dataAtualizacao?: string;
  // Campos internacionais
  country?: string;
  countryName?: string;
  city?: string;
  preferredLanguage?: string;
  documents?: Record<string, string>;
  totalOrders?: number;
  lastOrder?: string;
  lifetimeValue?: number;
  active?: boolean;
  notes?: string;
  birthDate?: string;
  occupation?: string;
  marketingConsent?: boolean;
}

export type DocumentType = 'CPF' | 'CNPJ';

/* ==========================================
   TIPOS DE ENDEREÇOS
   ========================================== */

export interface Address {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

/* ==========================================
   TIPOS DE PRODUTOS
   ========================================== */

export interface Product {
  id: string;
  nome: string;
  descricao?: string;
  sku: string;
  preco: number;
  peso: number;
  dimensoes?: ProductDimensions;
  categoria: string;
  fornecedorId: string;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao?: string;
}

export interface ProductDimensions {
  altura: number;
  largura: number;
  comprimento: number;
}

/* ==========================================
   TIPOS DE FORNECEDORES
   ========================================== */

export interface Supplier {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cnpj: string;
  endereco: Address;
  tipoIntegracao: SupplierIntegrationType;
  configIntegracao?: Record<string, any>;
  ativo: boolean;
  dataCriacao: string;
  dataAtualizacao?: string;
  // Campos internacionais
  companyName?: string;
  tradeName?: string;
  contact?: string;
  country?: string;
  countryName?: string;
  language?: string;
  city?: string;
  documents?: Record<string, string>;
  rating?: number;
  activeOrders?: number;
  totalOrders?: number;
  successRate?: number;
  processingTime?: string;
  active?: boolean;
  notes?: string;
  integrationType?: string;
  apiEndpoint?: string;
  apiKey?: string;
  webhookUrl?: string;
}

export type SupplierIntegrationType = 'API' | 'EMAIL' | 'WEBHOOK';

/* ==========================================
   TIPOS DE WHATSAPP
   ========================================== */

export interface WhatsAppMessage {
  id: string;
  to: string;
  from: string;
  type: WhatsAppMessageType;
  content: string;
  status: WhatsAppMessageStatus;
  timestamp: string;
  orderId?: string;
  templateName?: string;
}

export type WhatsAppMessageType = 'text' | 'template' | 'media' | 'location';
export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';

export interface WhatsAppTemplate {
  name: string;
  language: string;
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'footer' | 'buttons';
  parameters?: WhatsAppTemplateParameter[];
}

export interface WhatsAppTemplateParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: {
    fallback_value: string;
    code: string;
    amount_1000: number;
  };
  date_time?: {
    fallback_value: string;
  };
}

/* ==========================================
   TIPOS DE RASTREAMENTO
   ========================================== */

export interface TrackingInfo {
  codigo: string;
  transportadora: string;
  status: TrackingStatus;
  previsaoEntrega?: string;
  eventos: TrackingEvent[];
  dataAtualizacao: string;
}

export type TrackingStatus =
  | 'POSTADO'
  | 'EM_TRANSITO'
  | 'SAIU_PARA_ENTREGA'
  | 'ENTREGUE'
  | 'TENTATIVA_ENTREGA'
  | 'DEVOLVIDO';

export interface TrackingEvent {
  data: string;
  status: string;
  localizacao: string;
  descricao: string;
}

/* ==========================================
   TIPOS DE ANALYTICS
   ========================================== */

export interface DashboardStats {
  totalPedidos: number;
  pedidosHoje: number;
  pedidosMes: number;
  valorTotalMes: number;
  statusDistribution: StatusDistribution[];
  topFornecedores: TopSupplier[];
  crescimentoMensal: MonthlyGrowth;
}

export interface StatusDistribution {
  status: OrderStatus;
  count: number;
  percentage: number;
}

export interface TopSupplier {
  id: string;
  nome: string;
  totalPedidos: number;
  valorTotal: number;
}

export interface MonthlyGrowth {
  pedidos: number;
  valor: number;
  percentualPedidos: number;
  percentualValor: number;
}

/* ==========================================
   TIPOS DE API E PAGINAÇÃO
   ========================================== */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/* ==========================================
   TIPOS DE WEBHOOKS
   ========================================== */

export interface ShopifyWebhook {
  id: string;
  topic: string;
  shop_domain: string;
  created_at: string;
  updated_at: string;
  api_version: string;
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  source: WebhookSource;
  data: Record<string, any>;
  timestamp: string;
  processed: boolean;
  retryCount: number;
}

export type WebhookEventType =
  | 'order_created'
  | 'order_updated'
  | 'order_cancelled'
  | 'payment_updated'
  | 'fulfillment_created'
  | 'customer_created';

export type WebhookSource = 'shopify' | 'whatsapp' | 'supplier' | 'payment';

/* ==========================================
   TIPOS DE NOTIFICAÇÕES
   ========================================== */

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'order_created'
  | 'order_status_updated'
  | 'payment_received'
  | 'stock_low'
  | 'system_alert'
  | 'supplier_response';

/* ==========================================
   SCHEMAS ZOD PARA VALIDAÇÃO
   ========================================== */

// Schema para CPF
export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00');

// Schema para CNPJ
export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato 00.000.000/0000-00');

// Schema para CEP
export const cepSchema = z.string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000');

// Schema para telefone brasileiro
export const telefoneSchema = z.string()
  .regex(/^\(\d{2}\) 9?\d{4}-\d{4}$/, 'Telefone deve estar no formato (00) 90000-0000');

// Schema para endereço
export const addressSchema = z.object({
  cep: cepSchema,
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  pais: z.string().default('Brasil')
});

// Schema para paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

/* ==========================================
   CONSTANTES BRASILEIRAS
   ========================================== */

export const ESTADOS_BRASILEIROS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
] as const;

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  PROCESSANDO: 'Processando',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDENTE: '#f59e0b',
  CONFIRMADO: '#3b82f6',
  PROCESSANDO: '#8b5cf6',
  ENVIADO: '#06b6d4',
  ENTREGUE: '#10b981',
  CANCELADO: '#ef4444'
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  USER: 'Usuário',
  READONLY: 'Somente Leitura'
};

export const WHATSAPP_MESSAGE_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation_pt_br',
  ORDER_SHIPPED: 'order_shipped_pt_br',
  ORDER_DELIVERED: 'order_delivered_pt_br',
  PAYMENT_CONFIRMATION: 'payment_confirmation_pt_br',
  CUSTOMER_SUPPORT: 'customer_support_pt_br'
} as const;

/* ==========================================
   TIPOS DE CONFIGURAÇÃO
   ========================================== */

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    timezone: string;
    locale: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  features: {
    whatsapp: boolean;
    shopify: boolean;
    analytics: boolean;
    notifications: boolean;
  };
  limits: {
    maxOrdersPerPage: number;
    maxFileSize: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };
}

/* ==========================================
   TIPOS DE ERRO
   ========================================== */

export interface AppError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, any>;
}

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR'
} as const;
