import { z } from 'zod';

// Validação de CPF brasileiro
export const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00')
  .refine((cpf) => {
    const digits = cpf.replace(/\D/g, '');

    // Verifica se não é uma sequência repetida
    if (/^(\d)\1{10}$/.test(digits)) return false;

    // Calcula primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(digits.charAt(i)) * (10 - i);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    // Calcula segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(digits.charAt(i)) * (11 - i);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return digits.charAt(9) === digit1.toString() && digits.charAt(10) === digit2.toString();
  }, 'CPF inválido');

// Validação de CNPJ brasileiro
export const cnpjSchema = z.string()
  .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'CNPJ deve estar no formato 00.000.000/0000-00')
  .refine((cnpj) => {
    const digits = cnpj.replace(/\D/g, '');

    // Verifica se não é uma sequência repetida
    if (/^(\d)\1{13}$/.test(digits)) return false;

    // Calcula primeiro dígito verificador
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(digits.charAt(i)) * (weights1[i] || 0);
    }
    let digit1 = 11 - (sum % 11);
    if (digit1 > 9) digit1 = 0;

    // Calcula segundo dígito verificador
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(digits.charAt(i)) * (weights2[i] || 0);
    }
    let digit2 = 11 - (sum % 11);
    if (digit2 > 9) digit2 = 0;

    return digits.charAt(12) === digit1.toString() && digits.charAt(13) === digit2.toString();
  }, 'CNPJ inválido');

// Validação de CEP brasileiro
export const cepSchema = z.string()
  .regex(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato 00000-000 ou 00000000')
  .transform((cep) => cep.replace('-', ''));

// Validação de telefone brasileiro
export const telefoneSchema = z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (00) 00000-0000');

// Schema para endereço brasileiro
export const enderecoSchema = z.object({
  cep: cepSchema,
  logradouro: z.string().min(1, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres'),
  pais: z.string().default('Brasil')
});

// Schema para dados de cliente brasileiro
export const clienteBrasileiroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: telefoneSchema,
  documento: z.union([cpfSchema, cnpjSchema]),
  tipoDocumento: z.enum(['CPF', 'CNPJ']),
  endereco: enderecoSchema
});

// Schema para produto
export const produtoSchema = z.object({
  nome: z.string().min(1, 'Nome do produto é obrigatório'),
  descricao: z.string().optional(),
  sku: z.string().min(1, 'SKU é obrigatório'),
  preco: z.number().positive('Preço deve ser positivo'),
  peso: z.number().positive('Peso deve ser positivo'),
  dimensoes: z.object({
    altura: z.number().positive(),
    largura: z.number().positive(),
    comprimento: z.number().positive()
  }).optional(),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  fornecedorId: z.string().uuid('ID do fornecedor inválido'),
  ativo: z.boolean().default(true)
});

// Schema para pedido
export const pedidoSchema = z.object({
  shopifyOrderId: z.string().min(1, 'ID do pedido Shopify é obrigatório'),
  clienteId: z.string().uuid('ID do cliente inválido'),
  items: z.array(z.object({
    produtoId: z.string().uuid('ID do produto inválido'),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
    precoUnitario: z.number().positive('Preço unitário deve ser positivo')
  })).min(1, 'Pedido deve ter pelo menos um item'),
  enderecoEntrega: enderecoSchema,
  observacoes: z.string().optional()
});

// Schema para fornecedor
export const fornecedorSchema = z.object({
  nome: z.string().min(1, 'Nome do fornecedor é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: telefoneSchema,
  cnpj: cnpjSchema,
  endereco: enderecoSchema,
  tipoIntegracao: z.enum(['API', 'EMAIL', 'WEBHOOK']),
  configIntegracao: z.record(z.any()).optional(),
  ativo: z.boolean().default(true)
});

// Schema para webhook do Shopify
export const shopifyWebhookSchema = z.object({
  id: z.string(),
  topic: z.string(),
  shop_domain: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  api_version: z.string()
});

// Schema para rastreamento
export const rastreamentoSchema = z.object({
  codigo: z.string().min(1, 'Código de rastreamento é obrigatório'),
  transportadora: z.string().min(1, 'Transportadora é obrigatória'),
  status: z.string().min(1, 'Status é obrigatório'),
  previsaoEntrega: z.string().datetime().optional(),
  eventos: z.array(z.object({
    data: z.string().datetime(),
    status: z.string(),
    localizacao: z.string(),
    descricao: z.string()
  })).default([])
});

// Schema para paginação
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

// Schema para filtros de busca
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  fornecedorId: z.string().uuid().optional(),
  clienteId: z.string().uuid().optional()
});

// Schemas de validação para autenticação
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Nova senha deve conter ao menos uma letra minúscula, uma maiúscula e um número'),
});

// Schemas de validação para fornecedores
export const supplierSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  tradeName: z.string().optional(),
  cnpj: cnpjSchema,
  email: z.string().email('Email inválido'),
  phone: telefoneSchema.optional(),
  contactPerson: z.string().min(2, 'Nome do contato deve ter pelo menos 2 caracteres').optional(),
  apiEndpoint: z.string().url('URL da API inválida').optional(),
  apiKey: z.string().optional(),
  notificationEmail: z.string().email('Email de notificação inválido').optional(),
  addressCep: cepSchema.optional(),
  addressStreet: z.string().min(1, 'Endereço é obrigatório').optional(),
  addressNumber: z.string().min(1, 'Número é obrigatório').optional(),
  addressCity: z.string().min(1, 'Cidade é obrigatória').optional(),
  addressState: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  averageProcessingTime: z.number().int().min(0, 'Tempo de processamento deve ser positivo').optional(),
});

export const updateSupplierSchema = z.object({
  companyName: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres').optional(),
  tradeName: z.string().optional(),
  cnpj: cnpjSchema.optional(),
  email: z.string().email('Email inválido').optional(),
  phone: telefoneSchema.optional(),
  contactPerson: z.string().min(2, 'Nome do contato deve ter pelo menos 2 caracteres').optional(),
  apiEndpoint: z.string().url('URL da API inválida').optional(),
  apiKey: z.string().optional(),
  notificationEmail: z.string().email('Email de notificação inválido').optional(),
  addressCep: cepSchema.optional(),
  addressStreet: z.string().min(1, 'Endereço é obrigatório').optional(),
  addressNumber: z.string().min(1, 'Número é obrigatório').optional(),
  addressCity: z.string().min(1, 'Cidade é obrigatória').optional(),
  addressState: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  averageProcessingTime: z.number().int().min(0, 'Tempo de processamento deve ser positivo').optional(),
});

export const performanceRatingSchema = z.object({
  rating: z.number().min(1, 'Rating deve ser no mínimo 1').max(5, 'Rating deve ser no máximo 5'),
});
