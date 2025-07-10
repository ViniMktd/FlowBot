import { logger } from '@/config/logger';
import { Request, Response } from 'express';

// Middleware para tratar rotas não encontradas
export function notFound(req: Request, res: Response) {
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
    suggestions: [
      'Verifique se a URL está correta',
      'Consulte a documentação da API',
      'Entre em contato com o suporte se o problema persistir'
    ]
  });
}
