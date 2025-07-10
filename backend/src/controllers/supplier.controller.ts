import { logger } from '@/config/logger';
import { SupplierService } from '@/services/supplier.service';
import { AppError } from '@/utils/errors';
import { Request, Response } from 'express';

export class SupplierController {
  private supplierService: SupplierService;

  constructor() {
    this.supplierService = new SupplierService();
  }

  /**
   * Criar novo fornecedor
   */
  public createSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
      const supplier = await this.supplierService.createSupplier(req.body);

      res.status(201).json({
        success: true,
        message: 'Fornecedor criado com sucesso',
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao criar fornecedor', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Obter fornecedor por ID
   */
  public getSupplierById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
        return;
      }

      const supplier = await this.supplierService.getSupplierById(id);

      res.status(200).json({
        success: true,
        message: 'Fornecedor encontrado',
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao buscar fornecedor', {
        supplierId: req.params['id'],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Obter fornecedor por CNPJ
   */
  public getSupplierByCNPJ = async (req: Request, res: Response): Promise<void> => {
    try {
      const { cnpj } = req.params;

      if (!cnpj) {
        res.status(400).json({
          success: false,
          message: 'CNPJ é obrigatório'
        });
        return;
      }

      const supplier = await this.supplierService.getSupplierByCNPJ(cnpj);

      res.status(200).json({
        success: true,
        message: 'Fornecedor encontrado',
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao buscar fornecedor por CNPJ', {
        cnpj: req.params['cnpj'],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Listar fornecedores
   */
  public listSuppliers = async (req: Request, res: Response): Promise<void> => {
    try {
      const page = parseInt(req.query['page'] as string) || 1;
      const limit = parseInt(req.query['limit'] as string) || 10;
      const search = req.query['search'] as string;
      const activeOnly = req.query['activeOnly'] === 'true';

      const result = await this.supplierService.listSuppliers(page, limit, search, activeOnly);

      res.status(200).json({
        success: true,
        message: 'Fornecedores listados com sucesso',
        data: result
      });
    } catch (error) {
      logger.error('Erro ao listar fornecedores', {
        query: req.query,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Atualizar fornecedor
   */
  public updateSupplier = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
        return;
      }

      const supplier = await this.supplierService.updateSupplier(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Fornecedor atualizado com sucesso',
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao atualizar fornecedor', {
        supplierId: req.params['id'],
        body: req.body,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Alterar status do fornecedor
   */
  public toggleSupplierStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
        return;
      }

      const supplier = await this.supplierService.toggleSupplierStatus(id);

      res.status(200).json({
        success: true,
        message: `Fornecedor ${supplier.active ? 'ativado' : 'desativado'} com sucesso`,
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao alterar status do fornecedor', {
        supplierId: req.params['id'],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Atualizar rating de performance
   */
  public updatePerformanceRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { rating } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
        return;
      }

      const supplier = await this.supplierService.updatePerformanceRating(id, rating);

      res.status(200).json({
        success: true,
        message: 'Rating de performance atualizado com sucesso',
        data: { supplier }
      });
    } catch (error) {
      logger.error('Erro ao atualizar rating de performance', {
        supplierId: req.params['id'],
        rating: req.body.rating,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: "Erro interno do servidor"
      });
    }
  };


  /**
   * Obter estatísticas do fornecedor
   */
  public getSupplierStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID do fornecedor é obrigatório'
        });
        return;
      }

      const stats = await this.supplierService.getSupplierStats(id);

      res.status(200).json({
        success: true,
        message: 'Estatísticas do fornecedor obtidas com sucesso',
        data: { stats }
      });
    } catch (error) {
      logger.error('Erro ao obter estatísticas do fornecedor', {
        supplierId: req.params['id'],
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          message: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
}
