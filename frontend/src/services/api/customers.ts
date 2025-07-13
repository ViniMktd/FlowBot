import { api, ApiResponse } from './client';

// Types
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
  cpfCnpj?: string;
  documentType?: string;
  documentNumber?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  preferredLanguage?: string;
  whatsappConsent: boolean;
  lgpdConsentDate?: string;
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

export interface CustomerFilters {
  search?: string;
  countryId?: string;
  hasOrders?: boolean;
  whatsappConsent?: boolean;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
  cpfCnpj?: string;
  documentType?: string;
  documentNumber?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string;
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZipCode?: string;
  preferredLanguage?: string;
  whatsappConsent?: boolean;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

// Customers API service
export const customersApi = {
  // Get customers with pagination and filters
  getCustomers: async (params: {
    page?: number;
    limit?: number;
    filters?: CustomerFilters;
  } = {}): Promise<ApiResponse<Customer[]>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return api.get(`/customers?${queryParams}`);
  },

  // Get customer by ID
  getCustomerById: async (customerId: string): Promise<ApiResponse<Customer>> => {
    return api.get(`/customers/${customerId}`);
  },

  // Create customer
  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    return api.post('/customers', data);
  },

  // Update customer
  updateCustomer: async (customerId: string, data: Partial<CreateCustomerRequest>): Promise<ApiResponse<Customer>> => {
    return api.put(`/customers/${customerId}`, data);
  },

  // Delete customer
  deleteCustomer: async (customerId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.delete(`/customers/${customerId}`);
  },

  // Get customer orders
  getCustomerOrders: async (customerId: string, params: {
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<any[]>> => {
    const { page = 1, limit = 10 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return api.get(`/customers/${customerId}/orders?${queryParams}`);
  },

  // Update customer LGPD consent
  updateLgpdConsent: async (customerId: string, data: {
    consentType: 'WHATSAPP_MARKETING' | 'DATA_PROCESSING' | 'COOKIES';
    consentGiven: boolean;
    source: string;
    ipAddress?: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return api.post(`/customers/${customerId}/lgpd-consent`, data);
  },

  // Search customers
  searchCustomers: async (query: string): Promise<ApiResponse<Customer[]>> => {
    return api.get(`/customers/search?q=${encodeURIComponent(query)}`);
  },

  // Get customer stats
  getCustomerStats: async (): Promise<ApiResponse<{
    total: number;
    newThisMonth: number;
    withOrders: number;
    byCountry: Array<{
      countryCode: string;
      countryName: string;
      count: number;
    }>;
  }>> => {
    return api.get('/customers/stats');
  },

  // Export customers
  exportCustomers: async (filters?: CustomerFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams({
      format,
      ...filters,
    });
    
    return api.download(`/customers/export?${queryParams}`, `customers.${format}`);
  },

  // Validate customer document
  validateDocument: async (data: {
    documentType: string;
    documentNumber: string;
    countryCode: string;
  }): Promise<ApiResponse<{ valid: boolean; message?: string }>> => {
    return api.post('/customers/validate-document', data);
  },
};

export default customersApi;