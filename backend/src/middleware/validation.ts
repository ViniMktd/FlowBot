import { logger } from '@/config/logger';
import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Middleware para validação de requests usando Zod
export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar o body da requisição
      schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validação de request falhou', {
          path: req.path,
          method: req.method,
          errors,
          body: req.body
        });

        return res.status(400).json({
          success: false,
          message: 'Dados inválidos fornecidos',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      logger.error('Erro inesperado na validação', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
        method: req.method
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// Middleware para validação de parâmetros da URL
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validação de parâmetros falhou', {
          path: req.path,
          method: req.method,
          params: req.params,
          errors
        });

        return res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// Middleware para validação de query parameters
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        logger.warn('Validação de query falhou', {
          path: req.path,
          method: req.method,
          query: req.query,
          errors
        });

        return res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          code: 'VALIDATION_ERROR',
          errors
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}
