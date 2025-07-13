import { api, ApiResponse } from './client';

// Types
export interface Supplier {
  id: string;
  companyName: string;
  tradeName?: string;
  countryId?: string;
  cnpj?: string;
  businessLicense?: string;
  taxId?: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  preferredLanguage?: string;
  timeZone?: string;
  apiEndpoint?: string;
  apiKey?: string;
  notificationEmail?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  averageProcessingTime?: number;
  performanceRating: number;
  active: boolean;
  minimumOrderValue?: number;
  shippingMethods: string[];
  createdAt: string;
  updatedAt: string;
  country?: {
    id: string;
    code: string;
    name: string;
    currency: string;
    language: string;
  };
  orders?: Array<{
    id: string;
    shopifyOrderNumber?: string;
    status: string;
    totalAmount: number;
    createdAt: string;
  }>;
}

export interface SupplierFilters {
  search?: string;
  countryId?: string;
  active?: boolean;
  hasOrders?: boolean;
  performanceRating?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateSupplierRequest {
  companyName: string;
  tradeName?: string;
  countryId?: string;
  cnpj?: string;
  businessLicense?: string;
  taxId?: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  preferredLanguage?: string;
  timeZone?: string;
  apiEndpoint?: string;
  apiKey?: string;
  notificationEmail?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  averageProcessingTime?: number;
  performanceRating?: number;
  active?: boolean;
  minimumOrderValue?: number;
  shippingMethods?: string[];
}

export interface SupplierPerformance {
  supplierId: string;
  orderCount: number;
  averageProcessingTime: number;
  onTimeDeliveryRate: number;
  qualityRating: number;
  responseTime: number;
  period: {
    from: string;
    to: string;
  };
}

// Suppliers API service
export const suppliersApi = {
  // Get suppliers with pagination and filters
  getSuppliers: async (params: {
    page?: number;
    limit?: number;
    filters?: SupplierFilters;
  } = {}): Promise<ApiResponse<Supplier[]>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return api.get(`/suppliers?${queryParams}`);
  },

  // Get supplier by ID
  getSupplierById: async (supplierId: string): Promise<ApiResponse<Supplier>> => {
    return api.get(`/suppliers/${supplierId}`);
  },

  // Create supplier
  createSupplier: async (data: CreateSupplierRequest): Promise<ApiResponse<Supplier>> => {
    return api.post('/suppliers', data);
  },

  // Update supplier
  updateSupplier: async (supplierId: string, data: Partial<CreateSupplierRequest>): Promise<ApiResponse<Supplier>> => {
    return api.put(`/suppliers/${supplierId}`, data);
  },

  // Delete supplier
  deleteSupplier: async (supplierId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.delete(`/suppliers/${supplierId}`);
  },

  // Toggle supplier active status
  toggleSupplierStatus: async (supplierId: string, active: boolean): Promise<ApiResponse<Supplier>> => {
    return api.patch(`/suppliers/${supplierId}/status`, { active });
  },

  // Get supplier orders
  getSupplierOrders: async (supplierId: string, params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<any[]>> => {
    const { page = 1, limit = 10, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });
    
    return api.get(`/suppliers/${supplierId}/orders?${queryParams}`);
  },

  // Get supplier performance metrics
  getSupplierPerformance: async (supplierId: string, params: {
    fromDate?: string;
    toDate?: string;
  } = {}): Promise<ApiResponse<SupplierPerformance>> => {
    const queryParams = new URLSearchParams(params);
    return api.get(`/suppliers/${supplierId}/performance?${queryParams}`);
  },

  // Update supplier performance rating
  updatePerformanceRating: async (supplierId: string, rating: number): Promise<ApiResponse<Supplier>> => {
    return api.patch(`/suppliers/${supplierId}/rating`, { rating });
  },

  // Test supplier API connection
  testSupplierConnection: async (supplierId: string): Promise<ApiResponse<{
    connected: boolean;
    responseTime: number;
    message: string;
  }>> => {
    return api.post(`/suppliers/${supplierId}/test-connection`);
  },

  // Send order to supplier
  sendOrderToSupplier: async (supplierId: string, orderId: string): Promise<ApiResponse<{
    sent: boolean;
    message: string;
    trackingInfo?: any;
  }>> => {
    return api.post(`/suppliers/${supplierId}/send-order`, { orderId });
  },

  // Get supplier communications
  getSupplierCommunications: async (supplierId: string, params: {
    page?: number;
    limit?: number;
    type?: string;
  } = {}): Promise<ApiResponse<Array<{
    id: string;
    orderId: string;
    type: string;
    messageContent?: string;
    status: string;
    sentAt?: string;
    responseReceivedAt?: string;
    createdAt: string;
  }>>> => {
    const { page = 1, limit = 10, type } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(type && { type }),
    });
    
    return api.get(`/suppliers/${supplierId}/communications?${queryParams}`);
  },

  // Search suppliers
  searchSuppliers: async (query: string): Promise<ApiResponse<Supplier[]>> => {
    return api.get(`/suppliers/search?q=${encodeURIComponent(query)}`);
  },

  // Get supplier stats
  getSupplierStats: async (): Promise<ApiResponse<{
    total: number;
    active: number;
    byCountry: Array<{
      countryCode: string;
      countryName: string;
      count: number;
    }>;
    topPerformers: Array<{
      id: string;
      companyName: string;
      performanceRating: number;
      orderCount: number;
    }>;
  }>> => {
    return api.get('/suppliers/stats');
  },

  // Export suppliers
  exportSuppliers: async (filters?: SupplierFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams({
      format,
      ...filters,
    });
    
    return api.download(`/suppliers/export?${queryParams}`, `suppliers.${format}`);
  },
};

export default suppliersApi;