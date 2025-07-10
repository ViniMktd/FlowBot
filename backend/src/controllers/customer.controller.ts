import { prisma } from '@/config/database';
import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { BaseService } from '../services/base.service';
import { PaginationParams } from '../types';

/**
 * Controller simplificado para gerenciamento de clientes
 */
export class CustomerController extends BaseService {
  protected entityName = 'customer';

  /**
   * Criar novo cliente
   * POST /api/customers
   */
  async createCustomer(req: Request, res: Response) {
    try {
      logger.info('Criando novo cliente', {
        userId: req.user?.id,
        customerData: { ...req.body, cpfCnpj: req.body.cpfCnpj ? '***' : undefined }
      });

      const customer = await prisma.customer.create({
        data: {
          name: req.body.name,
          email: req.body.email || null,
          phone: req.body.phone || null,
          cpfCnpj: req.body.cpfCnpj || null,
          whatsappConsent: req.body.whatsappConsent || false,
          lgpdConsentDate: req.body.lgpdConsentDate ? new Date(req.body.lgpdConsentDate) : null
        }
      });

      logger.info('Cliente criado com sucesso', {
        customerId: customer.id,
        userId: req.user?.id
      });

      return res.status(201).json(this.createSuccessResponse(customer, 'Cliente criado com sucesso'));

    } catch (error) {
      logger.error('Erro ao criar cliente', { error, userId: req.user?.id });
      return res.status(500).json(this.createErrorResponse('Erro interno do servidor'));
    }
  }

  /**
   * Listar clientes com paginação
   * GET /api/customers
   */
  async getCustomers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const skip = (page - 1) * limit;

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.customer.count()
      ]);

      const params: PaginationParams = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const response = this.createPaginatedResponse(customers, total, params);

      logger.info('Clientes listados com sucesso', {
        total,
        page,
        userId: req.user?.id
      });

      return res.status(200).json(response);

    } catch (error) {
      logger.error('Erro ao listar clientes', { error, userId: req.user?.id });
      return res.status(500).json(this.createErrorResponse('Erro interno do servidor'));
    }
  }

  /**
   * Buscar cliente por ID
   * GET /api/customers/:id
   */
  async getCustomerById(req: Request, res: Response) {
    try {
      const id = req.params['id'];
      if (!id) {
        return res.status(400).json(this.createErrorResponse('ID do cliente é obrigatório'));
      }

      const customer = await prisma.customer.findUnique({
        where: { id }
      });

      if (!customer) {
        return res.status(404).json(this.createErrorResponse('Cliente não encontrado'));
      }

      logger.info('Cliente encontrado', { customerId: id, userId: req.user?.id });

      return res.status(200).json(this.createSuccessResponse(customer));

    } catch (error) {
      logger.error('Erro ao buscar cliente', { error, customerId: req.params['id'], userId: req.user?.id });
      return res.status(500).json(this.createErrorResponse('Erro interno do servidor'));
    }
  }

  /**
   * Atualizar cliente
   * PUT /api/customers/:id
   */
  async updateCustomer(req: Request, res: Response) {
    try {
      const id = req.params['id'];
      if (!id) {
        return res.status(400).json(this.createErrorResponse('ID do cliente é obrigatório'));
      }

      const customer = await prisma.customer.update({
        where: { id },
        data: {
          name: req.body.name,
          email: req.body.email || null,
          phone: req.body.phone || null,
          cpfCnpj: req.body.cpfCnpj || null,
          whatsappConsent: req.body.whatsappConsent,
          lgpdConsentDate: req.body.lgpdConsentDate ? new Date(req.body.lgpdConsentDate) : null
        }
      });

      logger.info('Cliente atualizado com sucesso', {
        customerId: id,
        userId: req.user?.id
      });

      return res.status(200).json(this.createSuccessResponse(customer, 'Cliente atualizado com sucesso'));

    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json(this.createErrorResponse('Cliente não encontrado'));
      }
      logger.error('Erro ao atualizar cliente', { error, customerId: req.params['id'], userId: req.user?.id });
      return res.status(500).json(this.createErrorResponse('Erro interno do servidor'));
    }
  }

  /**
   * Deletar cliente
   * DELETE /api/customers/:id
   */
  async deleteCustomer(req: Request, res: Response) {
    try {
      const id = req.params['id'];
      if (!id) {
        return res.status(400).json(this.createErrorResponse('ID do cliente é obrigatório'));
      }

      await prisma.customer.delete({
        where: { id }
      });

      logger.info('Cliente deletado com sucesso', {
        customerId: id,
        userId: req.user?.id
      });

      return res.status(200).json(this.createSuccessResponse(null, 'Cliente deletado com sucesso'));

    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json(this.createErrorResponse('Cliente não encontrado'));
      }
      logger.error('Erro ao deletar cliente', { error, customerId: req.params['id'], userId: req.user?.id });
      return res.status(500).json(this.createErrorResponse('Erro interno do servidor'));
    }
  }
}

export default CustomerController;
