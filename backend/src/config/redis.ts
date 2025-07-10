import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

// Cliente Redis global
let redisClient: RedisClientType | null = null;
let isConnected = false;

// Configuração do Redis para ambiente brasileiro
const redisConfig = {
  url: process.env['REDIS_URL'] || 'redis://localhost:6379',
  socket: {
    connectTimeout: 10000,
    commandTimeout: 5000,
    reconnectDelay: 1000,
  },
  database: 0, // Usar database 0 por padrão
};

// Função para conectar ao Redis
export async function connectRedis(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient(redisConfig);
  }
  try {
    if (isConnected && redisClient) {
      return redisClient;
    }

    redisClient = createClient(redisConfig);

    // Event listeners para logs
    redisClient.on('connect', () => {
      logger.info('Conectando ao Redis...');
    });

    redisClient.on('ready', () => {
      isConnected = true;
      logger.info('✅ Redis conectado e pronto para uso');
    });

    redisClient.on('error', (error) => {
      isConnected = false;
      logger.error('❌ Erro no Redis', {
        error: error.message,
        component: 'redis'
      });
    });

    redisClient.on('end', () => {
      isConnected = false;
      logger.info('Conexão Redis encerrada');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Reconectando ao Redis...');
    });

    await redisClient.connect();

    // Teste de conexão
    await redisClient.ping();
    logger.info('✅ Teste de ping Redis realizado com sucesso');

    return redisClient;
  } catch (error) {
    isConnected = false;
    logger.error('❌ Erro ao conectar ao Redis', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Função para desconectar do Redis
export async function disconnectRedis(): Promise<void> {
  try {
    if (redisClient && isConnected) {
      await redisClient.quit();
      isConnected = false;
      logger.info('Desconectado do Redis');
    }
  } catch (error) {
    logger.error('Erro ao desconectar do Redis', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Função para verificar a saúde do Redis
export async function checkRedisHealth(): Promise<boolean> {
  try {
    if (!redisClient || !isConnected) {
      return false;
    }

    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (error) {
    logger.error('Verificação de saúde do Redis falhou', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

// Cache helper functions com prefixos brasileiros
export const cache = {
  // Chaves para dados de pedidos
  orderKey: (orderId: string) => `flowbot:order:${orderId}`,
  customerKey: (customerId: string) => `flowbot:customer:${customerId}`,
  supplierKey: (supplierId: string) => `flowbot:supplier:${supplierId}`,

  // Chaves para sessões e autenticação
  sessionKey: (sessionId: string) => `flowbot:session:${sessionId}`,
  userKey: (userId: string) => `flowbot:user:${userId}`,

  // Chaves para WhatsApp
  whatsappLimitKey: (phone: string) => `flowbot:whatsapp:limit:${phone}`,
  whatsappMessageKey: (messageId: string) => `flowbot:whatsapp:msg:${messageId}`,

  // Chaves para Shopify
  shopifyWebhookKey: (orderId: string) => `flowbot:shopify:webhook:${orderId}`,
  shopifyRateLimitKey: () => `flowbot:shopify:ratelimit`,

  // CEP cache para otimização
  cepKey: (cep: string) => `flowbot:cep:${cep.replace(/\D/g, '')}`,

  // Cache geral com TTL
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      if (!redisClient || !isConnected) {
        throw new Error('Redis não conectado');
      }

      const serializedValue = JSON.stringify(value);
      await redisClient.setEx(key, ttlSeconds, serializedValue);

      logger.debug('Cache definido', { key, ttl: ttlSeconds });
    } catch (error) {
      logger.error('Erro ao definir cache', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (!redisClient || !isConnected) {
        return null;
      }

      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }

      const parsed = JSON.parse(value) as T;
      logger.debug('Cache recuperado', { key });
      return parsed;
    } catch (error) {
      logger.error('Erro ao recuperar cache', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  },

  async del(key: string): Promise<void> {
    try {
      if (!redisClient || !isConnected) {
        return;
      }

      await redisClient.del(key);
      logger.debug('Cache removido', { key });
    } catch (error) {
      logger.error('Erro ao remover cache', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  },

  async exists(key: string): Promise<boolean> {
    try {
      if (!redisClient || !isConnected) {
        return false;
      }

      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Erro ao verificar existência do cache', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  },

  // Rate limiting para APIs externas
  async checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
    try {
      if (!redisClient || !isConnected) {
        return true; // Allow if Redis is down
      }

      const current = await redisClient.incr(key);

      if (current === 1) {
        await redisClient.expire(key, windowSeconds);
      }

      const allowed = current <= limit;

      if (!allowed) {
        logger.warn('Rate limit excedido', {
          key,
          current,
          limit,
          windowSeconds
        });
      }

      return allowed;
    } catch (error) {
      logger.error('Erro ao verificar rate limit', {
        key,
        error: error instanceof Error ? error.message : String(error)
      });
      return true; // Allow if error occurs
    }
  }
};

// Função para obter estatísticas do Redis
export async function getRedisStats() {
  try {
    if (!redisClient || !isConnected) {
      return null;
    }

    const info = await redisClient.info();
    const memory = await redisClient.info('memory');
    const clients = await redisClient.info('clients');

    return {
      info,
      memory,
      clients,
      isConnected
    };
  } catch (error) {
    logger.error('Erro ao obter estatísticas do Redis', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

// Inicializar o cliente Redis
if (!redisClient) {
  try {
    redisClient = createClient(redisConfig);
  } catch (error) {
    logger.error('Erro ao criar cliente Redis:', error);
    throw error;
  }
}

// Exportar cliente Redis
export { redisClient };

export default redisClient;
