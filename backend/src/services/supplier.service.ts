import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from '@/utils/errors';
import { validateCNPJ, formatCNPJ } from '@/utils/brazilian';

interface ISupplierData {
  companyName: string;
  tradeName?: string;
  cnpj: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  apiEndpoint?: string;
  apiKey?: string;
  notificationEmail?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  averageProcessingTime?: number;
}

interface ISupplierResponse {
  id: string;
  companyName: string;
  tradeName?: string;
  cnpj: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  apiEndpoint?: string;
  notificationEmail?: string;
  addressCep?: string;
  addressStreet?: string;
  addressNumber?: string;
  addressCity?: string;
  addressState?: string;
  averageProcessingTime?: number;
  performanceRating: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierService {
  /**
   * Criar novo fornecedor
   */
  async createSupplier(supplierData: ISupplierData): Promise<ISupplierResponse> {
    try {
      // Validar CNPJ
      if (!validateCNPJ(supplierData.cnpj)) {
        throw new AppError('CNPJ inválido', 400);
      }

      // Verificar se o CNPJ já existe
      const existingSupplier = await prisma.supplier.findUnique({
        where: { cnpj: formatCNPJ(supplierData.cnpj) }
      });

      if (existingSupplier) {
        throw new AppError('CNPJ já cadastrado', 409);
      }

      // Criar fornecedor
      const supplier = await prisma.supplier.create({
        data: {
          companyName: supplierData.companyName,
          tradeName: supplierData.tradeName,
          cnpj: formatCNPJ(supplierData.cnpj),
          email: supplierData.email,
          phone: supplierData.phone,
          contactPerson: supplierData.contactPerson,
          apiEndpoint: supplierData.apiEndpoint,
          apiKey: supplierData.apiKey,
          notificationEmail: supplierData.notificationEmail,
          addressCep: supplierData.addressCep,
          addressStreet: supplierData.addressStreet,
          addressNumber: supplierData.addressNumber,
          addressCity: supplierData.addressCity,
          addressState: supplierData.addressState,
          averageProcessingTime: supplierData.averageProcessingTime,
          active: true
        }
      });

      logger.info('Fornecedor criado com sucesso', {
        supplierId: supplier.id,
        companyName: supplier.companyName,
        cnpj: supplier.cnpj,
        action: 'create_supplier'
      });

      return this.formatSupplier(supplier);
    } catch (error) {
      logger.error('Erro ao criar fornecedor', {
        companyName: supplierData.companyName,
        cnpj: supplierData.cnpj,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter fornecedor por ID
   */
  async getSupplierById(id: string): Promise<ISupplierResponse> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          orders: {
            select: {
              id: true,
              status: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 10
          }
        }
      });

      if (!supplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      return this.formatSupplier(supplier);
    } catch (error) {
      logger.error('Erro ao buscar fornecedor', {
        supplierId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter fornecedor por CNPJ
   */
  async getSupplierByCNPJ(cnpj: string): Promise<ISupplierResponse> {
    try {
      const formattedCNPJ = formatCNPJ(cnpj);

      const supplier = await prisma.supplier.findUnique({
        where: { cnpj: formattedCNPJ }
      });

      if (!supplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      return this.formatSupplier(supplier);
    } catch (error) {
      logger.error('Erro ao buscar fornecedor por CNPJ', {
        cnpj: cnpj,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Listar fornecedores com paginação
   */
  async listSuppliers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    activeOnly: boolean = false
  ): Promise<{
    suppliers: ISupplierResponse[];
    total: number;
    pages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      // Montar filtros
      const where: any = {};

      if (activeOnly) {
        where.active = true;
      }

      if (search) {
        where.OR = [
          { companyName: { contains: search, mode: 'insensitive' } },
          { tradeName: { contains: search, mode: 'insensitive' } },
          { cnpj: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Buscar fornecedores
      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        prisma.supplier.count({ where })
      ]);

      const pages = Math.ceil(total / limit);

      return {
        suppliers: suppliers.map(supplier => this.formatSupplier(supplier)),
        total,
        pages,
        currentPage: page
      };
    } catch (error) {
      logger.error('Erro ao listar fornecedores', {
        page,
        limit,
        search,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar fornecedor
   */
  async updateSupplier(id: string, updateData: Partial<ISupplierData>): Promise<ISupplierResponse> {
    try {
      // Verificar se o fornecedor existe
      const existingSupplier = await prisma.supplier.findUnique({
        where: { id }
      });

      if (!existingSupplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      // Validar CNPJ se fornecido
      if (updateData.cnpj && !validateCNPJ(updateData.cnpj)) {
        throw new AppError('CNPJ inválido', 400);
      }

      // Verificar se o CNPJ já existe em outro fornecedor
      if (updateData.cnpj) {
        const formattedCNPJ = formatCNPJ(updateData.cnpj);
        const cnpjExists = await prisma.supplier.findFirst({
          where: {
            cnpj: formattedCNPJ,
            id: { not: id }
          }
        });

        if (cnpjExists) {
          throw new AppError('CNPJ já cadastrado em outro fornecedor', 409);
        }
      }

      // Preparar dados para atualização
      const updateFields: any = {};

      if (updateData.companyName) updateFields.companyName = updateData.companyName;
      if (updateData.tradeName !== undefined) updateFields.tradeName = updateData.tradeName;
      if (updateData.cnpj) updateFields.cnpj = formatCNPJ(updateData.cnpj);
      if (updateData.email) updateFields.email = updateData.email;
      if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
      if (updateData.contactPerson !== undefined) updateFields.contactPerson = updateData.contactPerson;
      if (updateData.apiEndpoint !== undefined) updateFields.apiEndpoint = updateData.apiEndpoint;
      if (updateData.apiKey !== undefined) updateFields.apiKey = updateData.apiKey;
      if (updateData.notificationEmail !== undefined) updateFields.notificationEmail = updateData.notificationEmail;
      if (updateData.addressCep !== undefined) updateFields.addressCep = updateData.addressCep;
      if (updateData.addressStreet !== undefined) updateFields.addressStreet = updateData.addressStreet;
      if (updateData.addressNumber !== undefined) updateFields.addressNumber = updateData.addressNumber;
      if (updateData.addressCity !== undefined) updateFields.addressCity = updateData.addressCity;
      if (updateData.addressState !== undefined) updateFields.addressState = updateData.addressState;
      if (updateData.averageProcessingTime !== undefined) updateFields.averageProcessingTime = updateData.averageProcessingTime;

      // Atualizar fornecedor
      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateFields
      });

      logger.info('Fornecedor atualizado com sucesso', {
        supplierId: supplier.id,
        companyName: supplier.companyName,
        action: 'update_supplier'
      });

      return this.formatSupplier(supplier);
    } catch (error) {
      logger.error('Erro ao atualizar fornecedor', {
        supplierId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Ativar/Desativar fornecedor
   */
  async toggleSupplierStatus(id: string): Promise<ISupplierResponse> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id }
      });

      if (!supplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
          active: !supplier.active
        }
      });

      logger.info('Status do fornecedor alterado', {
        supplierId: supplier.id,
        companyName: supplier.companyName,
        oldStatus: supplier.active,
        newStatus: updatedSupplier.active,
        action: 'toggle_supplier_status'
      });

      return this.formatSupplier(updatedSupplier);
    } catch (error) {
      logger.error('Erro ao alterar status do fornecedor', {
        supplierId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar rating de performance do fornecedor
   */
  async updatePerformanceRating(id: string, rating: number): Promise<ISupplierResponse> {
    try {
      if (rating < 1 || rating > 5) {
        throw new AppError('Rating deve estar entre 1 e 5', 400);
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id }
      });

      if (!supplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
          performanceRating: rating
        }
      });

      logger.info('Rating do fornecedor atualizado', {
        supplierId: supplier.id,
        companyName: supplier.companyName,
        oldRating: supplier.performanceRating,
        newRating: rating,
        action: 'update_performance_rating'
      });

      return this.formatSupplier(updatedSupplier);
    } catch (error) {
      logger.error('Erro ao atualizar rating do fornecedor', {
        supplierId: id,
        rating,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas do fornecedor
   */
  async getSupplierStats(id: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    averageProcessingTime: number;
    performanceRating: number;
  }> {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          orders: {
            select: {
              status: true,
              createdAt: true,
              updatedAt: true
            }
          }
        }
      });

      if (!supplier) {
        throw new AppError('Fornecedor não encontrado', 404);
      }

      const totalOrders = supplier.orders.length;
      const pendingOrders = supplier.orders.filter(order =>
        ['PENDING', 'SENT_TO_SUPPLIER', 'PROCESSING'].includes(order.status)
      ).length;
      const completedOrders = supplier.orders.filter(order =>
        order.status === 'DELIVERED'
      ).length;

      return {
        totalOrders,
        pendingOrders,
        completedOrders,
        averageProcessingTime: supplier.averageProcessingTime || 0,
        performanceRating: Number(supplier.performanceRating)
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do fornecedor', {
        supplierId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Formatar dados do fornecedor para resposta
   */
  private formatSupplier(supplier: any): ISupplierResponse {
    return {
      id: supplier.id,
      companyName: supplier.companyName,
      tradeName: supplier.tradeName,
      cnpj: supplier.cnpj,
      email: supplier.email,
      phone: supplier.phone,
      contactPerson: supplier.contactPerson,
      apiEndpoint: supplier.apiEndpoint,
      notificationEmail: supplier.notificationEmail,
      addressCep: supplier.addressCep,
      addressStreet: supplier.addressStreet,
      addressNumber: supplier.addressNumber,
      addressCity: supplier.addressCity,
      addressState: supplier.addressState,
      averageProcessingTime: supplier.averageProcessingTime,
      performanceRating: Number(supplier.performanceRating),
      active: supplier.active,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt
    };
  }
}
