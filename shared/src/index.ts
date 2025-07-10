// Index principal do workspace shared

export * from './types';
export * from './utils';

// Re-export dos principais utilitários para facilitar o uso
export {
    ArrayUtils, BrazilianCodeGenerator, BrazilianFormatters, BrazilianPriceUtils, BrazilianTimeUtils, BrazilianValidators, PerformanceUtils, StringUtils
} from './utils';

// Re-export dos principais tipos
export type {
    ApiResponse, AppConfig,
    AppError, Customer, DashboardStats, Notification, Order,
    OrderStatus, PaginatedResponse, Product,
    Supplier, TrackingInfo, User,
    UserRole, WhatsAppMessage
} from './types';

// Re-export das constantes
export {
    ERROR_CODES, ESTADOS_BRASILEIROS, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS, USER_ROLE_LABELS,
    WHATSAPP_MESSAGE_TEMPLATES
} from './types';

// Re-export dos schemas Zod
export {
    addressSchema, cepSchema, cnpjSchema, cpfSchema, paginationSchema, telefoneSchema
} from './types';

