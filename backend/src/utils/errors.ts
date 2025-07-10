/**
 * Classe customizada para erros da aplicação
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Classe para erros de validação
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400);
    this.name = 'ValidationError';

    if (field) {
      this.message = `${field}: ${message}`;
    }
  }
}

/**
 * Classe para erros de autenticação
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Classe para erros de autorização
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Classe para erros de recurso não encontrado
 */
export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Classe para erros de conflito
 */
export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Classe para erros de integração externa
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(message: string, service: string, statusCode = 502) {
    super(message, statusCode);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Classe para erros de rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message = 'Muitas tentativas. Tente novamente mais tarde') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Classe para erros de dados inválidos
 */
export class BadRequestError extends AppError {
  constructor(message = 'Dados inválidos') {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

/**
 * Classe para erros internos do servidor
 */
export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500);
    this.name = 'InternalServerError';
  }
}

/**
 * Função para verificar se um erro é operacional
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Função para formatar erro para resposta da API
 */
export function formatErrorResponse(error: Error) {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        type: error.name
      }
    };
  }

  return {
    success: false,
    error: {
      message: 'Erro interno do servidor',
      statusCode: 500,
      type: 'InternalServerError'
    }
  };
}
