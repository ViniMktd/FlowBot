import { Request, Response } from 'express';
import { z } from 'zod';
// import { PedidoService } from '../services/pedido.service';
import { logger } from '../config/logger';
import { authentication } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
    paginationSchema,
    pedidoSchema
} from '../schemas';
import { BrazilianTimeUtils } from '../utils/brazilian';

// Schema para atualização de pedido
const updatePedidoSchema = z.object({
  status: z.enum(['PENDENTE', 'CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE', 'CANCELADO']).optional(),
  codigoRastreamento: z.string().optional(),
  observacoes: z.string().optional(),
  dataEntregaPrevista: z.string().datetime().optional()
});

// Schema para cancelamento
const cancelPedidoSchema = z.object({
  motivo: z.string().optional()
});

/**
 * Controller para gerenciamento de pedidos
 */
export class PedidoController {
  // private pedidoService: PedidoService;

  constructor() {
    // this.pedidoService = new PedidoService();
  }

  /**
   * Criar novo pedido
   * POST /api/pedidos
   */
  async createPedido(req: Request, res: Response) {
    try {
      logger.info('Criando novo pedido', {
        userId: req.user?.id,
        shopifyOrderId: req.body.shopifyOrderId
      });

      const result = await this.pedidoService.createPedido(req.body);

      if (!result.success) {
        return res.status(400).json(result);
      }

      logger.info('Pedido criado com sucesso', {
        pedidoId: result.data?.id,
        userId: req.user?.id
      });

      return res.status(201).json(result);
    } catch (error) {
      logger.error('Erro ao criar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedido por ID
   * GET /api/pedidos/:id
   */
  async getPedidoById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      const result = await this.pedidoService.getPedidoById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedido por ID do Shopify
   * GET /api/pedidos/shopify/:shopifyOrderId
   */
  async getPedidoByShopifyId(req: Request, res: Response) {
    try {
      const { shopifyOrderId } = req.params;

      if (!shopifyOrderId) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido Shopify é obrigatório'
        });
      }

      const result = await this.pedidoService.getPedidoByShopifyId(shopifyOrderId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar pedido por ID Shopify:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar pedidos com filtros e paginação
   * GET /api/pedidos
   */
  async listPedidos(req: Request, res: Response) {
    try {
      // Validar parâmetros de paginação
      const pagination = paginationSchema.parse(req.query);

      // Construir filtros
      const filters: any = {};

      if (req.query['status']) {
        filters.status = req.query['status'];
      }

      if (req.query['clienteId']) {
        filters.clienteId = req.query['clienteId'] as string;
      }

      if (req.query['shopifyOrderId']) {
        filters.shopifyOrderId = req.query['shopifyOrderId'] as string;
      }

      if (req.query['startDate']) {
        filters.startDate = new Date(req.query['startDate'] as string);
      }

      if (req.query['endDate']) {
        filters.endDate = new Date(req.query['endDate'] as string);
      }

      const result = await this.pedidoService.listPedidos(filters, pagination);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao listar pedidos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar pedido
   * PUT /api/pedidos/:id
   */
  async updatePedido(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      // Validar dados de entrada
      const validatedData = updatePedidoSchema.parse(req.body);

      // Converter data se fornecida
      const updateData: any = { ...validatedData };
      if (validatedData.dataEntregaPrevista) {
        updateData.dataEntregaPrevista = new Date(validatedData.dataEntregaPrevista);
      }

      logger.info('Atualizando pedido', {
        pedidoId: id,
        userId: req.user?.id,
        changes: Object.keys(updateData)
      });

      const result = await this.pedidoService.updatePedido(id, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      logger.info('Pedido atualizado com sucesso', {
        pedidoId: id,
        userId: req.user?.id
      });

      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => err.message)
        });
      }

      logger.error('Erro ao atualizar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cancelar pedido
   * POST /api/pedidos/:id/cancel
   */
  async cancelPedido(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      // Validar dados de entrada
      const { motivo } = cancelPedidoSchema.parse(req.body);

      logger.info('Cancelando pedido', {
        pedidoId: id,
        userId: req.user?.id,
        motivo
      });

      const result = await this.pedidoService.cancelPedido(id, motivo);

      if (!result.success) {
        return res.status(400).json(result);
      }

      logger.info('Pedido cancelado com sucesso', {
        pedidoId: id,
        userId: req.user?.id
      });

      return res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dados inválidos',
          errors: error.errors.map(err => err.message)
        });
      }

      logger.error('Erro ao cancelar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar estatísticas de pedidos
   * GET /api/pedidos/stats
   */
  async getEstatisticas(_req: Request, res: Response) {
    try {
      const result = await this.pedidoService.getEstatisticas();

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Health check específico do serviço de pedidos
   * GET /api/pedidos/health
   */
  async healthCheck(_req: Request, res: Response) {
    try {
      // Verificar se é possível conectar ao banco
      const testResult = await this.pedidoService.getEstatisticas();

      return res.json({
        success: true,
        service: 'PedidoService',
        timestamp: BrazilianTimeUtils.now().toISOString(),
        database: testResult.success ? 'healthy' : 'unhealthy'
      });
    } catch (error) {
      logger.error('Health check falhou:', error);
      return res.status(503).json({
        success: false,
        service: 'PedidoService',
        timestamp: BrazilianTimeUtils.now().toISOString(),
        database: 'unhealthy',
        error: 'Service unavailable'
      });
    }
  }
}

// Instância do controller
const pedidoController = new PedidoController();

// Middleware para validação de criação de pedido
export const validateCreatePedido = validateRequest(pedidoSchema);

// Middleware para validação de atualização de pedido
export const validateUpdatePedido = validateRequest(updatePedidoSchema);

// Middleware para validação de cancelamento
export const validateCancelPedido = validateRequest(cancelPedidoSchema);

// Exportar métodos do controller com bind para manter contexto
export const createPedido = [
  authentication,
  validateCreatePedido,
  pedidoController.createPedido.bind(pedidoController)
];

export const getPedidoById = [
  authentication,
  pedidoController.getPedidoById.bind(pedidoController)
];

export const getPedidoByShopifyId = [
  authentication,
  pedidoController.getPedidoByShopifyId.bind(pedidoController)
];

export const listPedidos = [
  authentication,
  pedidoController.listPedidos.bind(pedidoController)
];

export const updatePedido = [
  authentication,
  validateUpdatePedido,
  pedidoController.updatePedido.bind(pedidoController)
];

export const cancelPedido = [
  authentication,
  validateCancelPedido,
  pedidoController.cancelPedido.bind(pedidoController)
];

export const getEstatisticas = [
  authentication,
  pedidoController.getEstatisticas.bind(pedidoController)
];

export const healthCheck = [
  pedidoController.healthCheck.bind(pedidoController)
];
