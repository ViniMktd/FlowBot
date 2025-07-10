import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { cache } from '@/config/redis';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Middleware de autenticação
export async function authentication(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso obrigatório',
        code: 'ACCESS_TOKEN_REQUIRED'
      });
    }

    const token = authHeader.substring(7);

    // Verificar se o token está na blacklist (logout)
    const isBlacklisted = await cache.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'TOKEN_BLACKLISTED'
      });
    }

    // Verificar e decodificar token
    const decoded = jwt.verify(token, process.env['JWT_SECRET']!) as any;

    if (decoded.type !== 'access') {
      return res.status(401).json({
        success: false,
        message: 'Tipo de token inválido',
        code: 'INVALID_TOKEN_TYPE'
      });
    }

    // Verificar se existe uma sessão ativa no cache
    const sessionData = await cache.get(cache.sessionKey(decoded.userId));

    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: 'Sessão expirada',
        code: 'SESSION_EXPIRED'
      });
    }

    // Buscar dados atualizados do usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado ou inativo',
        code: 'USER_NOT_FOUND'
      });
    }

    // Adicionar dados do usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'MANAGER' | 'USER' | 'READONLY'
    };

    return next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Token JWT inválido', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        message: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    logger.error('Erro na autenticação', {
      error: error instanceof Error ? error.message : String(error),
      ip: req.ip,
      path: req.path
    });

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
}

// Middleware de autorização por role
export function authorize(roles: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação obrigatória',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Acesso negado por falta de permissão', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    return next();
  };
}

// Middleware para verificar se usuário pode acessar recurso específico
export function canAccessResource(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticação obrigatória',
        code: 'AUTHENTICATION_REQUIRED'
      });
    }

    try {
      const { id: resourceId } = req.params;

      // Administradores têm acesso total
      if (req.user.role === 'ADMIN') {
        return next();
      }

      // Verificações específicas por tipo de recurso
      switch (resourceType) {
        case 'order':
          // Verificar se o usuário pode acessar este pedido
          const order = await prisma.order.findUnique({
            where: { id: resourceId },
            select: { id: true }
          });

          if (!order) {
            return res.status(404).json({
              success: false,
              message: 'Pedido não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
          break;

        case 'supplier':
          // Verificar se o usuário pode acessar este fornecedor
          const supplier = await prisma.supplier.findUnique({
            where: { id: resourceId },
            select: { id: true, active: true }
          });

          if (!supplier) {
            return res.status(404).json({
              success: false,
              message: 'Fornecedor não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }

          // Usuários comuns só podem ver fornecedores ativos
          if (req.user.role === 'USER' && !supplier.active) {
            return res.status(403).json({
              success: false,
              message: 'Acesso negado a este recurso',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
          break;

        case 'customer':
          // Verificar se o usuário pode acessar este cliente
          const customer = await prisma.customer.findUnique({
            where: { id: resourceId },
            select: { id: true }
          });

          if (!customer) {
            return res.status(404).json({
              success: false,
              message: 'Cliente não encontrado',
              code: 'RESOURCE_NOT_FOUND'
            });
          }
          break;

        default:
          logger.warn('Tipo de recurso não reconhecido', {
            resourceType,
            userId: req.user.id,
            path: req.path
          });

          return res.status(400).json({
            success: false,
            message: 'Tipo de recurso inválido',
            code: 'INVALID_RESOURCE_TYPE'
          });
      }

      next();

    } catch (error) {
      logger.error('Erro na verificação de acesso ao recurso', {
        error: error instanceof Error ? error.message : String(error),
        resourceType,
        resourceId: req.params['id'],
        userId: req.user.id
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

// Middleware para rate limiting por usuário
export function userRateLimit(maxRequests: number, windowMinutes: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Deixar para o middleware de auth tratar
    }

    try {
      const rateLimitKey = `user:ratelimit:${req.user.id}`;
      const windowSeconds = windowMinutes * 60;

      const isAllowed = await cache.checkRateLimit(rateLimitKey, maxRequests, windowSeconds);

      if (!isAllowed) {
        logger.warn('Rate limit excedido por usuário', {
          userId: req.user.id,
          maxRequests,
          windowMinutes,
          path: req.path
        });

        return res.status(429).json({
          success: false,
          message: `Muitas requisições. Limite de ${maxRequests} por ${windowMinutes} minutos.`,
          code: 'USER_RATE_LIMIT_EXCEEDED'
        });
      }

      next();

    } catch (error) {
      logger.error('Erro no rate limiting de usuário', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user.id
      });

      // Permitir acesso em caso de erro para não bloquear o sistema
      next();
    }
  };
}
