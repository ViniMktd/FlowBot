// Export API client and types
export { api, apiClient } from './client';
export type { ApiResponse, ApiError } from './client';

// Export individual API services
export { authApi } from './auth';
export type { 
  LoginRequest, 
  LoginResponse, 
  RefreshTokenRequest, 
  RefreshTokenResponse,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from './auth';

export { ordersApi } from './orders';
export type { 
  Order, 
  OrderFilters, 
  OrderStats,
  DispatchOrderRequest 
} from './orders';

export { customersApi } from './customers';
export type { 
  Customer, 
  CustomerFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest 
} from './customers';

export { suppliersApi } from './suppliers';
export type { 
  Supplier, 
  SupplierFilters,
  CreateSupplierRequest,
  SupplierPerformance 
} from './suppliers';

// Combined API object for convenience
export const APIs = {
  auth: authApi,
  orders: ordersApi,
  customers: customersApi,
  suppliers: suppliersApi,
};

// Default export
export default APIs;