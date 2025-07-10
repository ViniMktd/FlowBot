import { Request, Response } from 'express';
import { BrazilianTimeUtils } from '../utils/brazilian';
import { logger } from '../config/simple-logger';

/**
 * Controller simplificado para teste dos pedidos
 */
export class SimplePedidoController {
  /**
   * Health check do serviço de pedidos
   * GET /api/pedidos/health
   */
  async healthCheck(_req: Request, res: Response) {
    try {
      return res.json({
        success: true,
        service: 'PedidoService',
        timestamp: BrazilianTimeUtils.now().toISOString(),
        status: 'healthy'
      });
    } catch (error) {
      logger.error('Health check falhou:', error);
      return res.status(503).json({
        success: false,
        service: 'PedidoService',
        timestamp: BrazilianTimeUtils.now().toISOString(),
        status: 'unhealthy',
        error: 'Service unavailable'
      });
    }
  }

  /**
   * Listar pedidos mockados
   * GET /api/pedidos
   */
  async listPedidos(_req: Request, res: Response) {
    try {
      const mockPedidos = [
        {
          id: '1',
          numeroPedido: 'PED20250107001',
          shopifyOrderId: 'SHOP12345',
          status: 'PENDENTE',
          valorTotal: 150.50,
          dataCriacao: BrazilianTimeUtils.now().toISOString(),
          cliente: {
            nome: 'João Silva',
            email: 'joao@email.com'
          }
        },
        {
          id: '2',
          numeroPedido: 'PED20250107002',
          shopifyOrderId: 'SHOP12346',
          status: 'CONFIRMADO',
          valorTotal: 299.99,
          dataCriacao: BrazilianTimeUtils.now().subtract(1, 'hour').toISOString(),
          cliente: {
            nome: 'Maria Santos',
            email: 'maria@email.com'
          }
        }
      ];

      return res.json({
        success: true,
        data: {
          data: mockPedidos,
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    } catch (error) {
      logger.error('Erro ao listar pedidos:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar estatísticas mockadas
   * GET /api/pedidos/stats
   */
  async getEstatisticas(_req: Request, res: Response) {
    try {
      const mockStats = {
        totalPedidos: 150,
        pedidosHoje: 12,
        pedidosMes: 89,
        valorTotalMes: 15670.50,
        statusDistribution: {
          PENDENTE: 5,
          CONFIRMADO: 15,
          PROCESSANDO: 8,
          ENVIADO: 25,
          ENTREGUE: 95,
          CANCELADO: 2
        }
      };

      return res.json({
        success: true,
        data: mockStats
      });
    } catch (error) {
      logger.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  /**
   * Buscar pedido por ID mockado
   * GET /api/pedidos/:id
   */
  async getPedidoById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const mockPedido = {
        id: id || '1',
        numeroPedido: `PED20250107${(id || '1').padStart(3, '0')}`,
        shopifyOrderId: `SHOP${id || '1'}`,
        status: 'CONFIRMADO',
        valorTotal: 199.99,
        dataCriacao: BrazilianTimeUtils.now().toISOString(),
        cliente: {
          id: '1',
          nome: 'Cliente Teste',
          email: 'cliente@teste.com',
          telefone: '(11) 99999-9999',
          documento: '123.456.789-00'
        },
        items: [
          {
            id: '1',
            quantidade: 2,
            precoUnitario: 99.99,
            produto: {
              id: '1',
              nome: 'Produto Teste',
              sku: 'PROD001',
              categoria: 'Eletrônicos'
            }
          }
        ],
        enderecoEntrega: {
          cep: '01234-567',
          logradouro: 'Rua Teste',
          numero: '123',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          pais: 'Brasil'
        }
      };

      return res.json({
        success: true,
        data: mockPedido
      });
    } catch (error) {
      logger.error('Erro ao buscar pedido:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

// Instância do controller
const simplePedidoController = new SimplePedidoController();

// Exportar métodos
export const simpleHealthCheck = simplePedidoController.healthCheck.bind(simplePedidoController);
export const simpleListPedidos = simplePedidoController.listPedidos.bind(simplePedidoController);
export const simpleGetEstatisticas = simplePedidoController.getEstatisticas.bind(simplePedidoController);
export const simpleGetPedidoById = simplePedidoController.getPedidoById.bind(simplePedidoController);
