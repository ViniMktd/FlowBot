import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { OrderService } from '../services/order-real.service';
import { formatCurrency } from '../utils/brazilian';

const orderService = new OrderService();

export class OrderRealController {
  /**
   * Listar todos os pedidos
   */
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const status = req.query['status'] as string;

      let result;

      if (status) {
        result = await orderService.findByStatus(status, { page, limit });
      } else {
        result = await orderService.findAll({ page, limit });
      }

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Formatar valores monetários para exibição
      const formattedOrders = result.data.data.map((order: any) => ({
        ...order,
        totalAmountFormatted: formatCurrency(order.totalAmount),
        shippingAmountFormatted: formatCurrency(order.shippingAmount)
      }));

      return res.json({
        ...result,
        data: {
          ...result.data,
          data: formattedOrders
        }
      });
    } catch (error) {
      logger.error('Erro no controller de pedidos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedido por ID
   */
  async findById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      const result = await orderService.findById(id);

      if (!result.success) {
        return res.status(404).json(result);
      }

      // Formatar valores monetários
      const formattedOrder = {
        ...result.data,
        totalAmountFormatted: formatCurrency(result.data.totalAmount),
        shippingAmountFormatted: formatCurrency(result.data.shippingAmount)
      };

      return res.json({
        ...result,
        data: formattedOrder
      });
    } catch (error) {
      logger.error('Erro ao buscar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Criar novo pedido
   */
  async create(req: Request, res: Response) {
    try {
      const orderData = req.body;

      const result = await orderService.create(orderData);

      if (!result.success) {
        return res.status(400).json(result);
      }

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
   * Atualizar pedido
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      const result = await orderService.update(id, updateData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao atualizar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Cancelar pedido
   */
  async cancel(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID do pedido é obrigatório'
        });
      }

      const result = await orderService.cancel(id, reason);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao cancelar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedidos por cliente
   */
  async findByCustomer(req: Request, res: Response) {
    try {
      const { customerId } = req.params;
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 20;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: 'ID do cliente é obrigatório'
        });
      }

      const result = await orderService.findByCustomer(customerId, { page, limit });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar pedidos por cliente:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}
