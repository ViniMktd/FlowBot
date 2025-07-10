// Tipos compartilhados do backend FlowBot

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Extensão do Express Request para incluir usuário autenticado
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface WhatsAppMessage {
  to: string;
  templateName: string;
  parameters: Record<string, string>;
  language?: string;
}

export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  previousStatus: string;
  updatedBy: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPayload {
  type: 'email' | 'whatsapp' | 'webhook';
  recipient: string;
  subject?: string;
  message: string;
  metadata?: Record<string, any>;
}

export interface ShopifyWebhook {
  id: string;
  topic: string;
  shop_domain: string;
  created_at: string;
  updated_at: string;
  api_version: string;
}

export interface SupplierOrderRequest {
  supplierId: string;
  products: Array<{
    sku: string;
    quantity: number;
    unitPrice: number;
  }>;
  delivery: {
    address: string;
    cep: string;
    city: string;
    state: string;
    estimatedDays: number;
  };
  customerInfo: {
    name: string;
    document: string;
    email: string;
    phone: string;
  };
}

export interface TrackingInfo {
  code: string;
  status: string;
  carrier: string;
  estimatedDelivery?: Date;
  events: Array<{
    date: Date;
    status: string;
    location: string;
    description: string;
  }>;
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface BrazilianAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  pais: string;
}

export interface CPFValidation {
  valid: boolean;
  formatted?: string;
  message?: string;
}

export interface CNPJValidation {
  valid: boolean;
  formatted?: string;
  message?: string;
}
