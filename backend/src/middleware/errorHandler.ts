import { logger } from '@/config/logger';
import { NextFunction, Request, Response } from 'express';

// Classe para erros customizados da aplicação
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para capturar erros assíncronos
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Middleware global de tratamento de erros
export function errorHandler(
  error: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Erro interno do servidor';

  // Se é um erro customizado da aplicação
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  }

  // Erros específicos do Prisma
  if (error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;

    switch (prismaError.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'Este registro já existe no sistema';
        break;

      case 'P2025':
        statusCode = 404;
        code = 'RECORD_NOT_FOUND';
        message = 'Registro não encontrado';
        break;

      case 'P2003':
        statusCode = 400;
        code = 'FOREIGN_KEY_CONSTRAINT';
        message = 'Não é possível completar a operação devido a dependências';
        break;

      case 'P2014':
        statusCode = 400;
        code = 'REQUIRED_RELATION_VIOLATION';
        message = 'A operação falhou devido a uma relação obrigatória';
        break;

      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'Erro no banco de dados';
    }
  }

  // Erros de validação do Zod
  if (error.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Dados inválidos fornecidos';
  }

  // Erros de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Token inválido';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token expirado';
  }

  // Erros de sintaxe JSON
  if (error.name === 'SyntaxError' && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'JSON inválido fornecido';
  }

  // Log do erro
  if (statusCode >= 500) {
    logger.error('Erro interno do servidor', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      body: statusCode >= 500 ? undefined : req.body, // Não logar body em erros 500+
    });
  } else {
    logger.warn('Erro de cliente', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
      statusCode,
      code
    });
  }

  // Resposta de erro padronizada
  const errorResponse: any = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  // Em desenvolvimento, incluir stack trace para debugging
  if (process.env['NODE_ENV'] === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.originalError = error.message;
  }

  // Incluir ID de correlação para rastreamento
  if (req.headers['x-correlation-id']) {
    errorResponse.correlationId = req.headers['x-correlation-id'];
  }

  res.status(statusCode).json(errorResponse);
}

// Middleware para tratar rotas não encontradas
export function notFound(req: Request, res: Response, _next: NextFunction) {
  logger.warn('Rota não encontrada', {
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  res.status(404).json({
    success: false,
    message: `Rota ${req.method} ${req.path} não encontrada`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

// Middleware para timeout de requisições
export function requestTimeout(timeoutMs: number = 30000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.error('Timeout de requisição', {
          path: req.path,
          method: req.method,
          timeout: timeoutMs,
          ip: req.ip,
          userId: req.user?.id
        });

        res.status(408).json({
          success: false,
          message: 'Tempo limite da requisição excedido',
          code: 'REQUEST_TIMEOUT',
          timestamp: new Date().toISOString(),
        });
      }
    }, timeoutMs);

    // Limpar timeout quando a resposta for enviada
    res.on('finish', () => {
      clearTimeout(timeout);
    });

    res.on('close', () => {
      clearTimeout(timeout);
    });

    next();
  };
}

// Middleware para logging de requisições em português
export function requestLogger() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    // Log da requisição recebida
    logger.info('Requisição recebida', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      correlationId: req.headers['x-correlation-id']
    });

    // Log da resposta quando finalizada
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

      logger[logLevel]('Requisição finalizada', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
        correlationId: req.headers['x-correlation-id']
      });
    });

    next();
  };
}

// Middleware para adicionar headers de segurança específicos para Brasil
export function brazilianSecurityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Headers de segurança básicos
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Header específico para conformidade LGPD
    res.setHeader('X-LGPD-Compliant', 'true');

    // Header indicando timezone brasileiro
    res.setHeader('X-Timezone', 'America/Sao_Paulo');

    // Headers para indicar suporte a APIs brasileiras
    res.setHeader('X-Brazil-API-Support', 'CEP,CPF,CNPJ,PIX');

    next();
  };
}

// Middleware para validação de IP brasileiro (opcional)
export function validateBrazilianIP() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Lista de ranges de IP brasileiros (exemplo simplificado)
    // Em produção, usar uma biblioteca específica ou serviço de geolocalização
    const brazilianIPRanges = [
      '200.', // Exemplo de prefixo brasileiro
      '201.',
      '177.',
      // Adicionar mais ranges conforme necessário
    ];

    const clientIP = req.ip || req.connection.remoteAddress || '';
    const isBrazilianIP = brazilianIPRanges.some(range => clientIP.startsWith(range));

    // Em desenvolvimento, sempre permitir
    if (process.env['NODE_ENV'] === 'development') {
      return next();
    }

    if (!isBrazilianIP) {
      logger.warn('Acesso de IP não brasileiro detectado', {
        ip: clientIP,
        path: req.path,
        userAgent: req.get('User-Agent')
      });

      // Apenas logar, não bloquear (pode ser configurado conforme necessidade)
    }

    next();
  };
}
