// Index principal do workspace shared

export * from './types';
export * from './utils';

// Re-export dos principais utilitários para facilitar o uso
export {
  BrazilianFormatters,
  BrazilianValidators,
  BrazilianTimeUtils,
  BrazilianCodeGenerator,
  BrazilianPriceUtils,
  StringUtils,
  ArrayUtils,
  PerformanceUtils
} from './utils';

// Re-export dos principais tipos
export type {
  User,
  UserRole,
  Order,
  OrderStatus,
  Customer,
  Product,
  Supplier,
  WhatsAppMessage,
  TrackingInfo,
  DashboardStats,
  ApiResponse,
  PaginatedResponse,
  Notification,
  AppConfig,
  AppError
} from './types';

// Re-export das constantes
export {
  ESTADOS_BRASILEIROS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  USER_ROLE_LABELS,
  WHATSAPP_MESSAGE_TEMPLATES,
  ERROR_CODES
} from './types';

// Re-export dos schemas Zod
export {
  cpfSchema,
  cnpjSchema,
  cepSchema,
  telefoneSchema,
  addressSchema,
  paginationSchema
} from './types';
