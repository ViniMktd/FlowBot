import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
import dayjs from 'dayjs';

const prisma = new PrismaClient();

/**
 * Analytics Controller
 * Fornece métricas e dados para dashboard e relatórios
 */
export class AnalyticsController {
  /**
   * @desc    Get dashboard overview statistics
   * @route   GET /api/analytics/overview
   * @access  Private
   */
  static getOverviewStats = asyncHandler(async (req: Request, res: Response) => {
    const today = dayjs().startOf('day').toDate();
    const thisMonth = dayjs().startOf('month').toDate();
    const lastMonth = dayjs().subtract(1, 'month').startOf('month').toDate();
    const thisMonthEnd = dayjs().endOf('month').toDate();

    // Buscar estatísticas básicas
    const [
      totalOrders,
      todayOrders,
      thisMonthOrders,
      lastMonthOrders,
      totalRevenue,
      thisMonthRevenue,
      lastMonthRevenue,
      activeSuppliers,
      totalCustomers,
      orderStatusDistribution
    ] = await Promise.all([
      // Total de pedidos
      prisma.order.count(),
      
      // Pedidos de hoje
      prisma.order.count({
        where: {
          dataCriacao: {
            gte: today
          }
        }
      }),
      
      // Pedidos deste mês
      prisma.order.count({
        where: {
          dataCriacao: {
            gte: thisMonth,
            lte: thisMonthEnd
          }
        }
      }),
      
      // Pedidos do mês passado
      prisma.order.count({
        where: {
          dataCriacao: {
            gte: lastMonth,
            lt: thisMonth
          }
        }
      }),
      
      // Receita total
      prisma.order.aggregate({
        _sum: {
          valorTotal: true
        },
        where: {
          status: {
            in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE']
          }
        }
      }),
      
      // Receita deste mês
      prisma.order.aggregate({
        _sum: {
          valorTotal: true
        },
        where: {
          dataCriacao: {
            gte: thisMonth,
            lte: thisMonthEnd
          },
          status: {
            in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE']
          }
        }
      }),
      
      // Receita do mês passado
      prisma.order.aggregate({
        _sum: {
          valorTotal: true
        },
        where: {
          dataCriacao: {
            gte: lastMonth,
            lt: thisMonth
          },
          status: {
            in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE']
          }
        }
      }),
      
      // Fornecedores ativos
      prisma.supplier.count({
        where: {
          ativo: true
        }
      }),
      
      // Total de clientes
      prisma.customer.count(),
      
      // Distribuição por status
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      })
    ]);

    // Calcular crescimento percentual
    const ordersGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;

    const revenueGrowth = (lastMonthRevenue._sum.valorTotal || 0) > 0
      ? (((thisMonthRevenue._sum.valorTotal || 0) - (lastMonthRevenue._sum.valorTotal || 0)) / (lastMonthRevenue._sum.valorTotal || 0)) * 100
      : 0;

    // Formatar distribuição de status
    const statusDistribution = orderStatusDistribution.map(item => ({
      status: item.status,
      count: item._count.status,
      percentage: totalOrders > 0 ? (item._count.status / totalOrders) * 100 : 0
    }));

    const overview = {
      totalOrders,
      todayOrders,
      thisMonthOrders,
      totalRevenue: totalRevenue._sum.valorTotal || 0,
      thisMonthRevenue: thisMonthRevenue._sum.valorTotal || 0,
      activeSuppliers,
      totalCustomers,
      growth: {
        orders: ordersGrowth,
        revenue: revenueGrowth
      },
      statusDistribution
    };

    logger.info('Overview stats retrieved successfully');

    res.status(200).json({
      success: true,
      data: overview
    });
  });

  /**
   * @desc    Get recent orders for dashboard
   * @route   GET /api/analytics/recent-orders
   * @access  Private
   */
  static getRecentOrders = asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const recentOrders = await prisma.order.findMany({
      take: limit,
      orderBy: {
        dataCriacao: 'desc'
      },
      include: {
        cliente: {
          select: {
            nome: true,
            email: true,
            telefone: true,
            country: true
          }
        },
        fornecedor: {
          select: {
            nome: true,
            country: true
          }
        },
        items: {
          include: {
            produto: {
              select: {
                nome: true,
                sku: true
              }
            }
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: recentOrders
    });
  });

  /**
   * @desc    Get order trends for charts
   * @route   GET /api/analytics/order-trends
   * @access  Private
   */
  static getOrderTrends = asyncHandler(async (req: Request, res: Response) => {
    const { period = '30d' } = req.query;
    
    let startDate: Date;
    let groupBy: string;

    switch (period) {
      case '7d':
        startDate = dayjs().subtract(7, 'days').startOf('day').toDate();
        groupBy = 'day';
        break;
      case '30d':
        startDate = dayjs().subtract(30, 'days').startOf('day').toDate();
        groupBy = 'day';
        break;
      case '12m':
        startDate = dayjs().subtract(12, 'months').startOf('month').toDate();
        groupBy = 'month';
        break;
      default:
        startDate = dayjs().subtract(30, 'days').startOf('day').toDate();
        groupBy = 'day';
    }

    // Buscar pedidos agrupados por período
    const orderTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC(${groupBy}, "dataCriacao") as date,
        COUNT(*)::int as orders,
        SUM("valorTotal")::float as revenue,
        COUNT(CASE WHEN status = 'ENTREGUE' THEN 1 END)::int as delivered_orders
      FROM "Order"
      WHERE "dataCriacao" >= ${startDate}
      GROUP BY DATE_TRUNC(${groupBy}, "dataCriacao")
      ORDER BY date ASC
    `;

    res.status(200).json({
      success: true,
      data: orderTrends
    });
  });

  /**
   * @desc    Get supplier performance metrics
   * @route   GET /api/analytics/supplier-performance
   * @access  Private
   */
  static getSupplierPerformance = asyncHandler(async (req: Request, res: Response) => {
    const { limit = '10' } = req.query;

    const supplierStats = await prisma.$queryRaw`
      SELECT 
        s.id,
        s.nome,
        s.country,
        s.language,
        COUNT(o.id)::int as total_orders,
        SUM(o."valorTotal")::float as total_revenue,
        COUNT(CASE WHEN o.status = 'ENTREGUE' THEN 1 END)::int as delivered_orders,
        ROUND(
          (COUNT(CASE WHEN o.status = 'ENTREGUE' THEN 1 END)::float / 
           NULLIF(COUNT(o.id), 0) * 100), 2
        ) as success_rate,
        AVG(
          CASE WHEN o.status = 'ENTREGUE' AND o."dataEntregaPrevista" IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (o."dataEntregaPrevista" - o."dataCriacao")) / 86400
          END
        )::float as avg_delivery_days
      FROM "Supplier" s
      LEFT JOIN "Order" o ON s.id = o."fornecedorId"
      WHERE s.ativo = true
      GROUP BY s.id, s.nome, s.country, s.language
      HAVING COUNT(o.id) > 0
      ORDER BY total_revenue DESC
      LIMIT ${parseInt(limit as string)}
    `;

    res.status(200).json({
      success: true,
      data: supplierStats
    });
  });

  /**
   * @desc    Get customer insights
   * @route   GET /api/analytics/customer-insights
   * @access  Private
   */
  static getCustomerInsights = asyncHandler(async (req: Request, res: Response) => {
    const [
      topCustomers,
      customersByCountry,
      customersByLanguage,
      lifetimeValueStats
    ] = await Promise.all([
      // Top customers por valor
      prisma.$queryRaw`
        SELECT 
          c.id,
          c.nome,
          c.email,
          c.country,
          c."preferredLanguage",
          COUNT(o.id)::int as total_orders,
          SUM(o."valorTotal")::float as lifetime_value,
          MAX(o."dataCriacao") as last_order_date
        FROM "Customer" c
        LEFT JOIN "Order" o ON c.id = o."clienteId"
        GROUP BY c.id, c.nome, c.email, c.country, c."preferredLanguage"
        HAVING COUNT(o.id) > 0
        ORDER BY lifetime_value DESC
        LIMIT 10
      `,
      
      // Clientes por país
      prisma.customer.groupBy({
        by: ['country'],
        _count: {
          country: true
        },
        where: {
          country: {
            not: null
          }
        }
      }),
      
      // Clientes por idioma
      prisma.customer.groupBy({
        by: ['preferredLanguage'],
        _count: {
          preferredLanguage: true
        },
        where: {
          preferredLanguage: {
            not: null
          }
        }
      }),
      
      // Estatísticas de lifetime value
      prisma.$queryRaw`
        SELECT 
          COUNT(*)::int as total_customers_with_orders,
          AVG(lifetime_value)::float as avg_lifetime_value,
          MAX(lifetime_value)::float as max_lifetime_value,
          MIN(lifetime_value)::float as min_lifetime_value
        FROM (
          SELECT 
            c.id,
            SUM(o."valorTotal") as lifetime_value
          FROM "Customer" c
          JOIN "Order" o ON c.id = o."clienteId"
          GROUP BY c.id
        ) customer_values
      `
    ]);

    res.status(200).json({
      success: true,
      data: {
        topCustomers,
        customersByCountry,
        customersByLanguage,
        lifetimeValueStats: lifetimeValueStats[0]
      }
    });
  });

  /**
   * @desc    Get geographic distribution
   * @route   GET /api/analytics/geographic-distribution
   * @access  Private
   */
  static getGeographicDistribution = asyncHandler(async (req: Request, res: Response) => {
    const [ordersByCountry, revenueByCountry] = await Promise.all([
      prisma.$queryRaw`
        SELECT 
          c.country,
          COUNT(o.id)::int as order_count,
          COUNT(DISTINCT c.id)::int as customer_count
        FROM "Customer" c
        LEFT JOIN "Order" o ON c.id = o."clienteId"
        WHERE c.country IS NOT NULL
        GROUP BY c.country
        ORDER BY order_count DESC
      `,
      
      prisma.$queryRaw`
        SELECT 
          c.country,
          SUM(o."valorTotal")::float as total_revenue,
          AVG(o."valorTotal")::float as avg_order_value
        FROM "Customer" c
        JOIN "Order" o ON c.id = o."clienteId"
        WHERE c.country IS NOT NULL
        GROUP BY c.country
        ORDER BY total_revenue DESC
      `
    ]);

    res.status(200).json({
      success: true,
      data: {
        ordersByCountry,
        revenueByCountry
      }
    });
  });

  /**
   * @desc    Get conversion metrics
   * @route   GET /api/analytics/conversion-metrics
   * @access  Private
   */
  static getConversionMetrics = asyncHandler(async (req: Request, res: Response) => {
    const thirtyDaysAgo = dayjs().subtract(30, 'days').toDate();

    const [
      totalVisitors, // Simulado - em produção viria do Google Analytics
      ordersLastMonth,
      conversionByStatus,
      avgOrderValue
    ] = await Promise.all([
      // Simulação de visitantes (seria integrado com GA)
      Promise.resolve(12500),
      
      prisma.order.count({
        where: {
          dataCriacao: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      prisma.order.groupBy({
        by: ['status'],
        _count: {
          status: true
        },
        where: {
          dataCriacao: {
            gte: thirtyDaysAgo
          }
        }
      }),
      
      prisma.order.aggregate({
        _avg: {
          valorTotal: true
        },
        where: {
          dataCriacao: {
            gte: thirtyDaysAgo
          },
          status: {
            in: ['CONFIRMADO', 'PROCESSANDO', 'ENVIADO', 'ENTREGUE']
          }
        }
      })
    ]);

    // Calcular métricas de conversão
    const conversionRate = totalVisitors > 0 ? (ordersLastMonth / totalVisitors) * 100 : 0;
    const completedOrders = conversionByStatus
      .filter(item => item.status === 'ENTREGUE')
      .reduce((sum, item) => sum + item._count.status, 0);
    
    const fulfillmentRate = ordersLastMonth > 0 ? (completedOrders / ordersLastMonth) * 100 : 0;

    res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        totalOrders: ordersLastMonth,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        fulfillmentRate: parseFloat(fulfillmentRate.toFixed(2)),
        avgOrderValue: avgOrderValue._avg.valorTotal || 0,
        conversionByStatus
      }
    });
  });

  /**
   * @desc    Get alerts and notifications for dashboard
   * @route   GET /api/analytics/alerts
   * @access  Private
   */
  static getAlerts = asyncHandler(async (req: Request, res: Response) => {
    const alerts = [];

    // Verificar pedidos pendentes há mais de 24h
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDENTE',
        dataCriacao: {
          lte: dayjs().subtract(24, 'hours').toDate()
        }
      }
    });

    if (pendingOrders > 0) {
      alerts.push({
        type: 'warning',
        title: 'Pedidos Pendentes',
        message: `${pendingOrders} pedidos pendentes há mais de 24 horas`,
        count: pendingOrders,
        action: '/pedidos?status=PENDENTE'
      });
    }

    // Verificar fornecedores inativos
    const inactiveSuppliers = await prisma.supplier.count({
      where: {
        ativo: false
      }
    });

    if (inactiveSuppliers > 0) {
      alerts.push({
        type: 'info',
        title: 'Fornecedores Inativos',
        message: `${inactiveSuppliers} fornecedores inativos`,
        count: inactiveSuppliers,
        action: '/fornecedores?status=inactive'
      });
    }

    // Verificar pedidos com problemas de entrega
    const deliveryIssues = await prisma.order.count({
      where: {
        status: 'ENVIADO',
        dataEntregaPrevista: {
          lte: dayjs().subtract(2, 'days').toDate()
        }
      }
    });

    if (deliveryIssues > 0) {
      alerts.push({
        type: 'error',
        title: 'Problemas de Entrega',
        message: `${deliveryIssues} pedidos com atraso na entrega`,
        count: deliveryIssues,
        action: '/pedidos?status=ENVIADO&late=true'
      });
    }

    res.status(200).json({
      success: true,
      data: alerts
    });
  });
}

export default AnalyticsController;