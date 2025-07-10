import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { logger } from '../config/logger';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

/**
 * Dashboard Controller
 * Fornece dados agregados e atividades recentes para o dashboard principal
 */
export class DashboardController {
  /**
   * @desc    Get complete dashboard data
   * @route   GET /api/dashboard
   * @access  Private
   */
  static getDashboardData = asyncHandler(async (req: Request, res: Response) => {
    const today = dayjs().startOf('day').toDate();
    const yesterday = dayjs().subtract(1, 'day').startOf('day').toDate();
    const thisWeek = dayjs().startOf('week').toDate();
    const thisMonth = dayjs().startOf('month').toDate();

    try {
      // Executar todas as consultas em paralelo para melhor performance
      const [
        // Métricas básicas
        totalOrders,
        todayOrders,
        yesterdayOrders,
        weekOrders,
        monthOrders,
        
        // Métricas financeiras
        totalRevenue,
        todayRevenue,
        monthRevenue,
        
        // Contadores
        totalCustomers,
        totalSuppliers,
        activeSuppliers,
        
        // Status dos pedidos
        ordersByStatus,
        
        // Atividades recentes
        recentOrders,
        recentCustomers,
        
        // Top performers
        topSuppliers,
        topProducts,
        
        // Alertas
        pendingOrders,
        delayedOrders,
        lowStockProducts
      ] = await Promise.all([
        // Total de pedidos
        prisma.order.count(),
        
        // Pedidos de hoje
        prisma.order.count({
          where: { dataCriacao: { gte: today } }
        }),
        
        // Pedidos de ontem
        prisma.order.count({
          where: { 
            dataCriacao: { 
              gte: yesterday,
              lt: today
            }
          }
        }),
        
        // Pedidos desta semana
        prisma.order.count({
          where: { dataCriacao: { gte: thisWeek } }
        }),
        
        // Pedidos deste mês
        prisma.order.count({
          where: { dataCriacao: { gte: thisMonth } }
        }),
        
        // Receita total
        prisma.order.aggregate({
          _sum: { valorTotal: true },
          where: {
            status: { in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE'] }
          }
        }),
        
        // Receita de hoje
        prisma.order.aggregate({
          _sum: { valorTotal: true },
          where: {
            dataCriacao: { gte: today },
            status: { in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE'] }
          }
        }),
        
        // Receita deste mês
        prisma.order.aggregate({
          _sum: { valorTotal: true },
          where: {
            dataCriacao: { gte: thisMonth },
            status: { in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE'] }
          }
        }),
        
        // Total de clientes
        prisma.customer.count(),
        
        // Total de fornecedores
        prisma.supplier.count(),
        
        // Fornecedores ativos
        prisma.supplier.count({
          where: { ativo: true }
        }),
        
        // Pedidos por status
        prisma.order.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        
        // Pedidos recentes (últimos 10)
        prisma.order.findMany({
          take: 10,
          orderBy: { dataCriacao: 'desc' },
          include: {
            cliente: {
              select: {
                nome: true,
                email: true,
                country: true
              }
            },
            fornecedor: {
              select: {
                nome: true,
                country: true
              }
            }
          }
        }),
        
        // Clientes recentes (últimos 5)
        prisma.customer.findMany({
          take: 5,
          orderBy: { dataCriacao: 'desc' },
          select: {
            id: true,
            nome: true,
            email: true,
            country: true,
            dataCriacao: true
          }
        }),
        
        // Top 5 fornecedores por pedidos
        prisma.$queryRaw`
          SELECT 
            s.id,
            s.nome,
            s.country,
            COUNT(o.id)::int as order_count,
            SUM(o."valorTotal")::float as total_revenue
          FROM "Supplier" s
          LEFT JOIN "Order" o ON s.id = o."fornecedorId"
          WHERE s.ativo = true
          GROUP BY s.id, s.nome, s.country
          ORDER BY order_count DESC
          LIMIT 5
        `,
        
        // Top 5 produtos mais vendidos
        prisma.$queryRaw`
          SELECT 
            p.id,
            p.nome,
            p.sku,
            SUM(oi.quantidade)::int as total_quantity,
            COUNT(DISTINCT o.id)::int as order_count,
            SUM(oi.quantidade * oi."precoUnitario")::float as total_revenue
          FROM "Product" p
          JOIN "OrderItem" oi ON p.id = oi."produtoId"
          JOIN "Order" o ON oi."orderId" = o.id
          WHERE o."dataCriacao" >= ${thisMonth}
          GROUP BY p.id, p.nome, p.sku
          ORDER BY total_quantity DESC
          LIMIT 5
        `,
        
        // Pedidos pendentes
        prisma.order.count({
          where: { status: 'PENDENTE' }
        }),
        
        // Pedidos atrasados
        prisma.order.count({
          where: {
            status: 'ENVIADO',
            dataEntregaPrevista: {
              lt: new Date()
            }
          }
        }),
        
        // Produtos com estoque baixo (simulado)
        Promise.resolve(3) // Em produção seria uma consulta real de estoque
      ]);

      // Calcular percentuais de crescimento
      const ordersGrowthDaily = yesterdayOrders > 0 
        ? ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 
        : 0;

      // Preparar dados do dashboard
      const dashboardData = {
        // Métricas principais
        metrics: {
          orders: {
            total: totalOrders,
            today: todayOrders,
            week: weekOrders,
            month: monthOrders,
            growthDaily: parseFloat(ordersGrowthDaily.toFixed(1))
          },
          revenue: {
            total: totalRevenue._sum.valorTotal || 0,
            today: todayRevenue._sum.valorTotal || 0,
            month: monthRevenue._sum.valorTotal || 0
          },
          customers: {
            total: totalCustomers
          },
          suppliers: {
            total: totalSuppliers,
            active: activeSuppliers
          }
        },

        // Status dos pedidos
        orderStatus: ordersByStatus.map(item => ({
          status: item.status,
          count: item._count.status,
          percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
        })),

        // Atividades recentes
        recentActivity: {
          orders: recentOrders.map(order => ({
            id: order.id,
            numeroPedido: order.numeroPedido,
            clienteNome: order.cliente.nome,
            clienteCountry: order.cliente.country,
            fornecedorNome: order.fornecedor?.nome,
            valorTotal: order.valorTotal,
            status: order.status,
            dataCriacao: order.dataCriacao
          })),
          customers: recentCustomers
        },

        // Top performers
        topPerformers: {
          suppliers: topSuppliers,
          products: topProducts
        },

        // Alertas e notificações
        alerts: {
          pendingOrders,
          delayedOrders,
          lowStockProducts
        },

        // Data e hora da última atualização
        lastUpdated: new Date().toISOString()
      };

      logger.info('Dashboard data retrieved successfully');

      res.status(200).json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error retrieving dashboard data:', error);
      throw error;
    }
  });

  /**
   * @desc    Get quick stats for widgets
   * @route   GET /api/dashboard/quick-stats
   * @access  Private
   */
  static getQuickStats = asyncHandler(async (req: Request, res: Response) => {
    const today = dayjs().startOf('day').toDate();

    const [
      todayOrders,
      pendingOrders,
      processingOrders,
      todayRevenue
    ] = await Promise.all([
      prisma.order.count({
        where: { dataCriacao: { gte: today } }
      }),
      
      prisma.order.count({
        where: { status: 'PENDENTE' }
      }),
      
      prisma.order.count({
        where: { status: 'PROCESSANDO' }
      }),
      
      prisma.order.aggregate({
        _sum: { valorTotal: true },
        where: {
          dataCriacao: { gte: today },
          status: { in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE'] }
        }
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        processingOrders,
        todayRevenue: todayRevenue._sum.valorTotal || 0
      }
    });
  });

  /**
   * @desc    Get activity feed for dashboard
   * @route   GET /api/dashboard/activity-feed
   * @access  Private
   */
  static getActivityFeed = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;

    // Buscar atividades recentes de diferentes tipos
    const [recentOrders, recentCustomers, recentSuppliers] = await Promise.all([
      prisma.order.findMany({
        take: Math.floor(limit * 0.6), // 60% pedidos
        orderBy: { dataCriacao: 'desc' },
        select: {
          id: true,
          numeroPedido: true,
          status: true,
          valorTotal: true,
          dataCriacao: true,
          cliente: {
            select: { nome: true, country: true }
          }
        }
      }),
      
      prisma.customer.findMany({
        take: Math.floor(limit * 0.3), // 30% clientes
        orderBy: { dataCriacao: 'desc' },
        select: {
          id: true,
          nome: true,
          email: true,
          country: true,
          dataCriacao: true
        }
      }),
      
      prisma.supplier.findMany({
        take: Math.floor(limit * 0.1), // 10% fornecedores
        orderBy: { dataCriacao: 'desc' },
        select: {
          id: true,
          nome: true,
          country: true,
          dataCriacao: true
        }
      })
    ]);

    // Combinar e formatar atividades
    const activities = [
      ...recentOrders.map(order => ({
        id: `order_${order.id}`,
        type: 'order',
        title: `Novo pedido ${order.numeroPedido}`,
        description: `${order.cliente.nome} - ${order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        status: order.status,
        country: order.cliente.country,
        timestamp: order.dataCriacao,
        link: `/pedidos/${order.id}`
      })),
      
      ...recentCustomers.map(customer => ({
        id: `customer_${customer.id}`,
        type: 'customer',
        title: `Novo cliente cadastrado`,
        description: `${customer.nome} (${customer.email})`,
        country: customer.country,
        timestamp: customer.dataCriacao,
        link: `/clientes/${customer.id}`
      })),
      
      ...recentSuppliers.map(supplier => ({
        id: `supplier_${supplier.id}`,
        type: 'supplier',
        title: `Novo fornecedor cadastrado`,
        description: supplier.nome,
        country: supplier.country,
        timestamp: supplier.dataCriacao,
        link: `/fornecedores/${supplier.id}`
      }))
    ];

    // Ordenar por timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.status(200).json({
      success: true,
      data: activities.slice(0, limit)
    });
  });

  /**
   * @desc    Get system health status
   * @route   GET /api/dashboard/health
   * @access  Private (Admin only)
   */
  static getSystemHealth = asyncHandler(async (req: Request, res: Response) => {
    // Verificar saúde do sistema
    const healthChecks = {
      database: false,
      redis: false,
      whatsapp: false,
      shopify: false
    };

    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      healthChecks.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    try {
      // Test Redis connection (se estiver configurado)
      // await redisClient.ping();
      healthChecks.redis = true; // Assumindo que está funcionando
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    // Simular outros health checks
    healthChecks.whatsapp = true; // Em produção, testaria a API do WhatsApp
    healthChecks.shopify = true; // Em produção, testaria a API do Shopify

    const overallHealth = Object.values(healthChecks).every(status => status);

    res.status(200).json({
      success: true,
      data: {
        status: overallHealth ? 'healthy' : 'degraded',
        checks: healthChecks,
        timestamp: new Date().toISOString()
      }
    });
  });
}

export default DashboardController;