import { Request, Response } from 'express';
import { OrderService } from '../services/order.service';
import { logger } from '../config/logger';
import { PaginationParams } from '../types';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * Criar novo pedido
   * POST /api/orders
   */
  async createOrder(req: Request, res: Response) {
    try {
      logger.info('Criando novo pedido', {
        userId: req.user?.id,
        shopifyOrderId: req.body.shopifyOrderId
      });

      const result = await this.orderService.createOrder(req.body);

      logger.info('Pedido criado com sucesso', {
        orderId: result.id,
        shopifyOrderId: req.body.shopifyOrderId,
        userId: req.user?.id
      });

      return res.status(201).json({
        success: true,
        data: result,
        orderId: result.id,
        message: 'Pedido criado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao criar pedido', { error, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Listar pedidos com filtros e paginação
   * GET /api/orders
   */
  async getOrders(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const params: PaginationParams = {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      // Filtros opcionais
      const filters: any = {};
      if (req.query['status']) filters.status = req.query['status'];
      if (req.query['supplierId']) filters.supplierId = req.query['supplierId'];
      if (req.query['customerId']) filters.customerId = req.query['customerId'];

      logger.info('Listando pedidos', {
        params,
        filters,
        userId: req.user?.id
      });

      const result = await this.orderService.getOrders(params, filters);

      return res.json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro ao listar pedidos', { error, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedido por ID
   * GET /api/orders/:id
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      logger.info('Buscando pedido por ID', {
        orderId: id,
        userId: req.user?.id
      });

      const result = await this.orderService.getOrderById(id!);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Erro ao buscar pedido', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar pedido
   * PUT /api/orders/:id
   */
  async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;

      logger.info('Atualizando pedido', {
        orderId: id,
        updateData: req.body,
        userId: req.user?.id
      });

      const result = await this.orderService.updateOrder(id!, req.body);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      logger.info('Pedido atualizado com sucesso', {
        orderId: id,
        userId: req.user?.id
      });

      return res.json({
        success: true,
        data: result,
        message: 'Pedido atualizado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atualizar pedido', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cancelar pedido
   * POST /api/orders/:id/cancel
   */
  async cancelOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      logger.info('Cancelando pedido', {
        orderId: id,
        reason,
        userId: req.user?.id
      });

      const result = await this.orderService.cancelOrder(id!, reason);

      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Pedido não encontrado'
        });
      }

      return res.json({
        success: true,
        data: result,
        message: 'Pedido cancelado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao cancelar pedido', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Atualizar status do pedido
   * PUT /api/orders/:id/status
   */
  async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      logger.info('Atualizando status do pedido', {
        orderId: id,
        status,
        userId: req.user?.id
      });

      const result = await this.orderService.updateOrderStatus(id!, status);

      return res.json({
        success: true,
        data: result,
        message: 'Status do pedido atualizado com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao atualizar status do pedido', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Definir código de rastreamento
   * PUT /api/orders/:id/tracking
   */
  async setTrackingCode(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { trackingCode, carrier } = req.body;

      logger.info('Definindo código de rastreamento', {
        orderId: id,
        trackingCode,
        carrier,
        userId: req.user?.id
      });

      const result = await this.orderService.setTrackingCode(id!, trackingCode, carrier);

      return res.json({
        success: true,
        data: result,
        message: 'Código de rastreamento definido com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao definir código de rastreamento', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Obter estatísticas de pedidos
   * GET /api/orders/stats
   */
  async getOrderStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      logger.info('Obtendo estatísticas de pedidos', {
        startDate,
        endDate,
        userId: req.user?.id
      });

      const result = await this.orderService.getOrderStats();

      return res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas', { error, userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Reenviar notificação
   * POST /api/orders/:id/resend-notification
   */
  async resendNotification(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type } = req.body;

      logger.info('Reenviando notificação', {
        orderId: id,
        type,
        userId: req.user?.id
      });

      const result = await this.orderService.resendNotification(id!, type);

      return res.json({
        success: true,
        data: result,
        message: 'Notificação reenviada com sucesso'
      });

    } catch (error) {
      logger.error('Erro ao reenviar notificação', { error, orderId: req.params['id'], userId: req.user?.id });
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export const orderController = new OrderController();
export default OrderController;
