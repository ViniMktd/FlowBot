import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';

/**
 * Classe base para services com funcionalidades comuns
 */
export abstract class BaseService {
  protected abstract entityName: string;

  /**
   * Criar resposta de sucesso padronizada
   */
  protected createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
    const response: ApiResponse<T> = {
      success: true,
      data
    };

    if (message) {
      response.message = message;
    }

    return response;
  }

  /**
   * Criar resposta de erro padronizada
   */
  protected createErrorResponse(message: string, errors?: string[]): ApiResponse {
    const response: ApiResponse = {
      success: false,
      message
    };

    if (errors) {
      response.errors = errors;
    }

    return response;
  }

  /**
   * Criar resposta paginada
   */
  protected createPaginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Tratar erros do Prisma
   */
  protected handlePrismaError(error: any): ApiResponse {
    logger.error(`Erro no ${this.entityName}:`, error);

    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          return this.createErrorResponse('Registro já existe com estes dados únicos');
        case 'P2025':
          return this.createErrorResponse('Registro não encontrado');
        case 'P2003':
          return this.createErrorResponse('Violação de chave estrangeira');
        case 'P2016':
          return this.createErrorResponse('Erro de interpretação da query');
        default:
          return this.createErrorResponse('Erro de banco de dados');
      }
    }

    if (error instanceof PrismaClientValidationError) {
      return this.createErrorResponse('Dados inválidos fornecidos');
    }

    return this.createErrorResponse('Erro interno do servidor');
  }

  /**
   * Aplicar filtros de paginação
   */
  protected getPaginationOptions(params: PaginationParams) {
    const page = params.page || 1;
    const limit = Math.min(params.limit || 20, 100);
    const skip = (page - 1) * limit;

    return {
      skip,
      take: limit
    };
  }

  /**
   * Log de operação realizada
   */
  protected logOperation(operation: string, data?: any) {
    logger.info(`${this.entityName} - ${operation}`, {
      operation,
      entityName: this.entityName,
      data: data ? JSON.stringify(data) : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Middleware para tratamento global de erros de service
 */
export const serviceErrorHandler = (
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error('Service Error:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: Object.values(error.errors).map((err: any) => err.message)
    });
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Serviço temporariamente indisponível'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
};

/**
 * Decorator para tratamento automático de erros em métodos de service
 */
export function HandleServiceErrors(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      logger.error('Service method error:', error);
      throw error;
    }
  };

  return descriptor;
}
