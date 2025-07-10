import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis';
import { ApiResponse, PaginatedResponse, PaginationParams } from '../types';
import { BrazilianCodeGenerator, BrazilianTimeUtils } from '../utils/brazilian';
import { BaseService, HandleServiceErrors } from './base.service';

// Tipos do Prisma
type Pedido = {
  id: string;
  numeroPedido: string;
  shopifyOrderId: string;
  clienteId: string;
  status: string;
  valorTotal: number;
  enderecoEntrega: any;
  observacoes?: string | null;
  codigoRastreamento?: string | null;
  dataEntregaPrevista?: Date | null;
  dataCriacao: Date;
  dataAtualizacao?: Date | null;
};

type Cliente = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento: string;
  tipoDocumento: string;
};

type Produto = {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  peso: number;
  categoria: string;
  fornecedorId: string;
  ativo: boolean;
};

enum StatusPedido {
  PENDENTE = 'PENDENTE',
  CONFIRMADO = 'CONFIRMADO',
  PROCESSANDO = 'PROCESSANDO',
  ENVIADO = 'ENVIADO',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO'
}

export interface CreatePedidoData {
  shopifyOrderId: string;
  clienteId: string;
  items: Array<{
    produtoId: string;
    quantidade: number;
    precoUnitario: number;
  }>;
  enderecoEntrega: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  observacoes?: string;
}

export interface UpdatePedidoData {
  status?: StatusPedido;
  codigoRastreamento?: string;
  observacoes?: string;
  dataEntregaPrevista?: Date;
}

export interface PedidoFilters {
  status?: StatusPedido;
  clienteId?: string;
  startDate?: Date;
  endDate?: Date;
  shopifyOrderId?: string;
}

export interface PedidoWithRelations extends Pedido {
  cliente: Cliente;
  items: Array<{
    id: string;
    quantidade: number;
    precoUnitario: number;
    produto: Produto;
  }>;
}

/**
 * Service para gerenciamento de pedidos
 */
export class PedidoService extends BaseService {
  protected entityName = 'Pedido';
  private prisma: PrismaClient;

  constructor() {
    super();
    this.prisma = new PrismaClient();
  }

  /**
   * Criar novo pedido
   */
  @HandleServiceErrors
  async createPedido(data: CreatePedidoData): Promise<ApiResponse<PedidoWithRelations>> {
    this.logOperation('createPedido', { shopifyOrderId: data.shopifyOrderId });

    // Verificar se pedido já existe
    // const existingPedido = await this.prisma.pedido.findUnique({
    //   where: { shopifyOrderId: data.shopifyOrderId }
    // });

    // if (existingPedido) {
    //   return this.createErrorResponse('Pedido já existe para este ID do Shopify');
    // }

    // Verificar se cliente existe
    // const cliente = await this.prisma.cliente.findUnique({
    //   where: { id: data.clienteId }
    // });

    // if (!cliente) {
    //   return this.createErrorResponse('Cliente não encontrado');
    // }

    // Verificar se produtos existem
    // const produtos = await this.prisma.produto.findMany({
    //   where: {
    //     id: { in: data.items.map(item => item.produtoId) }
    //   }
    // });

    // if (produtos.length !== data.items.length) {
    //   return this.createErrorResponse('Um ou mais produtos não foram encontrados');
    // }

    // Calcular totais
    const valorTotal = data.items.reduce((total, item) => {
      return total + (item.quantidade * item.precoUnitario);
    }, 0);

    // Gerar número do pedido
    const numeroPedido = BrazilianCodeGenerator.generateOrderNumber();

    // Criar pedido com transação
    const pedido = await this.prisma.$transaction(async (tx: any) => {
      // Criar pedido
      const novoPedido = await tx.pedido.create({
        data: {
          numeroPedido,
          shopifyOrderId: data.shopifyOrderId,
          clienteId: data.clienteId,
          status: StatusPedido.PENDENTE,
          valorTotal,
          enderecoEntrega: data.enderecoEntrega,
          observacoes: data.observacoes,
          dataCriacao: BrazilianTimeUtils.now().toDate()
        }
      });

      // Criar items do pedido
      await tx.itemPedido.createMany({
        data: data.items.map(item => ({
          pedidoId: novoPedido.id,
          produtoId: item.produtoId,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario
        }))
      });

      return novoPedido;
    });

    // Buscar pedido completo
    const pedidoCompleto = await this.getPedidoById(pedido.id);

    if (!pedidoCompleto.success || !pedidoCompleto.data) {
      return this.createErrorResponse('Erro ao criar pedido');
    }

    // Adicionar job para processar pedido
    // await orderQueue.add('processPedido', {
    //   pedidoId: pedido.id,
    //   timestamp: BrazilianTimeUtils.now().toISOString()
    // });

    // Cache do pedido
    await redisClient.setEx(
      `pedido:${pedido.id}`,
      3600, // 1 hora
      JSON.stringify(pedidoCompleto.data)
    );

    this.logOperation('pedidoCriado', { pedidoId: pedido.id, numeroPedido });

    return this.createSuccessResponse(
      pedidoCompleto.data,
      'Pedido criado com sucesso'
    );
  }

  /**
   * Buscar pedido por ID
   */
  @HandleServiceErrors
  async getPedidoById(id: string): Promise<ApiResponse<PedidoWithRelations | null>> {
    // Verificar cache
    const cached = await redisClient.get(`pedido:${id}`);
    if (cached) {
      return this.createSuccessResponse(JSON.parse(cached));
    }

    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: true,
        items: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!pedido) {
      return this.createErrorResponse('Pedido não encontrado');
    }

    // Cache do resultado
    await redisClient.setEx(
      `pedido:${id}`,
      3600,
      JSON.stringify(pedido)
    );

    return this.createSuccessResponse(pedido as PedidoWithRelations);
  }

  /**
   * Buscar pedido por ID do Shopify
   */
  @HandleServiceErrors
  async getPedidoByShopifyId(shopifyOrderId: string): Promise<ApiResponse<PedidoWithRelations | null>> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { shopifyOrderId },
      include: {
        cliente: true,
        items: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!pedido) {
      return this.createErrorResponse('Pedido não encontrado');
    }

    return this.createSuccessResponse(pedido as PedidoWithRelations);
  }

  /**
   * Listar pedidos com filtros e paginação
   */
  @HandleServiceErrors
  async listPedidos(
    filters: PedidoFilters = {},
    pagination: PaginationParams = {}
  ): Promise<ApiResponse<PaginatedResponse<PedidoWithRelations>>> {
    const { skip, take } = this.getPaginationOptions(pagination);

    // Construir filtros
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clienteId) {
      where.clienteId = filters.clienteId;
    }

    if (filters.shopifyOrderId) {
      where.shopifyOrderId = filters.shopifyOrderId;
    }

    if (filters.startDate || filters.endDate) {
      where.dataCriacao = {};
      if (filters.startDate) {
        where.dataCriacao.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.dataCriacao.lte = filters.endDate;
      }
    }

    // Buscar pedidos e total
    const [pedidos, total] = await this.prisma.$transaction([
      this.prisma.pedido.findMany({
        where,
        skip,
        take,
        include: {
          cliente: true,
          items: {
            include: {
              produto: true
            }
          }
        },
        orderBy: {
          dataCriacao: 'desc'
        }
      }),
      this.prisma.pedido.count({ where })
    ]);

    const paginatedResponse = this.createPaginatedResponse(
      pedidos as PedidoWithRelations[],
      total,
      pagination
    );

    return this.createSuccessResponse(paginatedResponse);
  }

  /**
   * Atualizar status do pedido
   */
  @HandleServiceErrors
  async updatePedido(id: string, data: UpdatePedidoData): Promise<ApiResponse<PedidoWithRelations>> {
    this.logOperation('updatePedido', { pedidoId: id, ...data });

    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id }
    });

    if (!existingPedido) {
      return this.createErrorResponse('Pedido não encontrado');
    }

    // Atualizar pedido
    const updatedPedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        ...data,
        dataAtualizacao: BrazilianTimeUtils.now().toDate()
      },
      include: {
        cliente: true,
        items: {
          include: {
            produto: true
          }
        }
      }
    });

    // Invalidar cache
    await redisClient.del(`pedido:${id}`);

    // Se mudança de status, adicionar job
    if (data.status && data.status !== existingPedido.status) {
      // await orderQueue.add('statusChanged', {
      //   pedidoId: id,
      //   oldStatus: existingPedido.status,
      //   newStatus: data.status,
      //   timestamp: BrazilianTimeUtils.now().toISOString()
      // });
    }

    this.logOperation('pedidoAtualizado', {
      pedidoId: id,
      statusAnterior: existingPedido.status,
      novoStatus: data.status
    });

    return this.createSuccessResponse(
      updatedPedido as PedidoWithRelations,
      'Pedido atualizado com sucesso'
    );
  }

  /**
   * Cancelar pedido
   */
  @HandleServiceErrors
  async cancelPedido(id: string, motivo?: string): Promise<ApiResponse<PedidoWithRelations>> {
    this.logOperation('cancelPedido', { pedidoId: id, motivo });

    const pedido = await this.prisma.pedido.findUnique({
      where: { id }
    });

    if (!pedido) {
      return this.createErrorResponse('Pedido não encontrado');
    }

    if (pedido.status === StatusPedido.CANCELADO) {
      return this.createErrorResponse('Pedido já está cancelado');
    }

    if (pedido.status === StatusPedido.ENTREGUE) {
      return this.createErrorResponse('Não é possível cancelar pedido já entregue');
    }

    const canceledPedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: StatusPedido.CANCELADO,
        observacoes: motivo ? `${pedido.observacoes || ''}\n\nCancelado: ${motivo}` : pedido.observacoes,
        dataAtualizacao: BrazilianTimeUtils.now().toDate()
      },
      include: {
        cliente: true,
        items: {
          include: {
            produto: true
          }
        }
      }
    });

    // Invalidar cache
    await redisClient.del(`pedido:${id}`);

    // Adicionar job para processar cancelamento
    // await orderQueue.add('pedidoCancelado', {
    //   pedidoId: id,
    //   motivo,
    //   timestamp: BrazilianTimeUtils.now().toISOString()
    // });

    this.logOperation('pedidoCancelado', { pedidoId: id, motivo });

    return this.createSuccessResponse(
      canceledPedido as PedidoWithRelations,
      'Pedido cancelado com sucesso'
    );
  }

  /**
   * Buscar estatísticas de pedidos
   */
  @HandleServiceErrors
  async getEstatisticas(): Promise<ApiResponse<any>> {
    const cacheKey = 'pedidos:estatisticas';
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      return this.createSuccessResponse(JSON.parse(cached));
    }

    const hoje = BrazilianTimeUtils.now().startOf('day').toDate();
    const inicioMes = BrazilianTimeUtils.now().startOf('month').toDate();

    const [
      totalPedidos,
      pedidosHoje,
      pedidosMes,
      statusStats,
      valorTotalMes
    ] = await this.prisma.$transaction([
      this.prisma.pedido.count(),
      this.prisma.pedido.count({
        where: { dataCriacao: { gte: hoje } }
      }),
      this.prisma.pedido.count({
        where: { dataCriacao: { gte: inicioMes } }
      }),
      this.prisma.pedido.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.pedido.aggregate({
        where: { dataCriacao: { gte: inicioMes } },
        _sum: { valorTotal: true }
      })
    ]);

    const estatisticas = {
      totalPedidos,
      pedidosHoje,
      pedidosMes,
      valorTotalMes: valorTotalMes._sum.valorTotal || 0,
      statusDistribution: statusStats.reduce((acc: Record<string, number>, item: any) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>)
    };

    // Cache por 5 minutos
    await redisClient.setEx(cacheKey, 300, JSON.stringify(estatisticas));

    return this.createSuccessResponse(estatisticas);
  }
}
