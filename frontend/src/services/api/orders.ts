import { api, ApiResponse } from './client';

// Types
export interface Order {
  id: string;
  shopifyOrderId: string;
  shopifyOrderNumber?: string;
  status: 'PENDING' | 'SENT_TO_SUPPLIER' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'FAILED';
  totalAmount: number;
  currency: string;
  shippingAmount?: number;
  paymentStatus?: string;
  trackingCode?: string;
  carrier?: string;
  estimatedDelivery?: string;
  customerLanguage?: string;
  supplierLanguage?: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    countryId?: string;
  };
  supplier?: {
    id: string;
    companyName: string;
    tradeName?: string;
    email: string;
    phone?: string;
    countryId?: string;
  };
  items: Array<{
    id: string;
    productName: string;
    variantTitle?: string;
    quantity: number;
    price: number;
    sku?: string;
  }>;
}

export interface OrderFilters {
  status?: string;
  customerId?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
}

export interface DispatchOrderRequest {
  trackingCode: string;
  carrier: string;
  estimatedDelivery?: string;
  notes?: string;
}

// Orders API service
export const ordersApi = {
  // Get orders with pagination and filters
  getOrders: async (params: {
    page?: number;
    limit?: number;
    filters?: OrderFilters;
  } = {}): Promise<ApiResponse<Order[]>> => {
    const { page = 1, limit = 10, filters = {} } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    
    return api.get(`/orders?${queryParams}`);
  },

  // Get order by ID
  getOrderById: async (orderId: string): Promise<ApiResponse<Order>> => {
    return api.get(`/orders/${orderId}`);
  },

  // Update order status
  updateOrderStatus: async (orderId: string, status: string): Promise<ApiResponse<Order>> => {
    return api.put(`/orders/${orderId}/status`, { status });
  },

  // Dispatch order
  dispatchOrder: async (orderId: string, data: DispatchOrderRequest): Promise<ApiResponse<{
    orderId: string;
    trackingCode: string;
    shopifyFulfilled: boolean;
    customerNotified: boolean;
  }>> => {
    return api.post(`/shipping/order/${orderId}/dispatch`, data);
  },

  // Cancel order
  cancelOrder: async (orderId: string, reason?: string): Promise<ApiResponse<Order>> => {
    return api.post(`/orders/${orderId}/cancel`, { reason });
  },

  // Get order stats
  getOrderStats: async (): Promise<ApiResponse<OrderStats>> => {
    return api.get('/orders/stats');
  },

  // Get order timeline/history
  getOrderHistory: async (orderId: string): Promise<ApiResponse<Array<{
    id: string;
    action: string;
    description: string;
    userId?: string;
    userName?: string;
    createdAt: string;
  }>>> => {
    return api.get(`/orders/${orderId}/history`);
  },

  // Resend order to supplier
  resendToSupplier: async (orderId: string): Promise<ApiResponse<{ message: string }>> => {
    return api.post(`/orders/${orderId}/resend-supplier`);
  },

  // Update tracking information
  updateTracking: async (orderId: string, data: {
    trackingCode?: string;
    carrier?: string;
    status?: string;
    location?: string;
    notes?: string;
  }): Promise<ApiResponse<Order>> => {
    return api.put(`/orders/${orderId}/tracking`, data);
  },

  // Export orders
  exportOrders: async (filters?: OrderFilters, format: 'csv' | 'xlsx' = 'csv'): Promise<void> => {
    const queryParams = new URLSearchParams({
      format,
      ...filters,
    });
    
    return api.download(`/orders/export?${queryParams}`, `orders.${format}`);
  },
};

export default ordersApi;