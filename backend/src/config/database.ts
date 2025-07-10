import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Configuração global do Prisma para ambiente brasileiro
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  datasources: {
    db: {
      url: process.env['DATABASE_URL'],
    },
  },
});

// Log das queries em desenvolvimento
if (process.env['NODE_ENV'] === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Query executada', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      component: 'database'
    });
  });
}

// Log de erros do banco
prisma.$on('error', (e) => {
  logger.error('Erro no banco de dados', {
    error: e.message,
    target: e.target,
    component: 'database'
  });
});

// Log de informações do banco
prisma.$on('info', (e) => {
  logger.info('Informação do banco', {
    message: e.message,
    target: e.target,
    component: 'database'
  });
});

// Log de warnings do banco
prisma.$on('warn', (e) => {
  logger.warn('Warning do banco', {
    message: e.message,
    target: e.target,
    component: 'database'
  });
});

// Função para conectar ao banco de dados
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('✅ Conectado ao banco PostgreSQL');

    // Verificar se a conexão está funcionando
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Teste de conexão com banco realizado com sucesso');

  } catch (error) {
    logger.error('❌ Erro ao conectar com o banco de dados', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

// Função para desconectar do banco de dados
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info('Desconectado do banco PostgreSQL');
  } catch (error) {
    logger.error('Erro ao desconectar do banco de dados', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Função para verificar a saúde do banco
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Verificação de saúde do banco falhou', {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

// Função para obter estatísticas do banco
export async function getDatabaseStats() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
      LIMIT 10
    `;

    return stats;
  } catch (error) {
    logger.error('Erro ao obter estatísticas do banco', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

// Middleware para transações com retry automático
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        logger.error(`Operação falhou após ${maxRetries} tentativas`, {
          error: lastError.message,
          attempts: maxRetries
        });
        throw lastError;
      }

      logger.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms`, {
        error: lastError.message,
        attempt,
        maxRetries
      });

      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}

// Função para executar migrations de forma segura
export async function runMigrations(): Promise<void> {
  try {
    // Em produção, usar migrate deploy
    if (process.env['NODE_ENV'] === 'production') {
      logger.info('Executando migrations de produção...');
      // Aqui normalmente executaríamos: npx prisma migrate deploy
      // Mas como estamos em código TypeScript, apenas logamos
      logger.info('⚠️  Execute: npx prisma migrate deploy');
    } else {
      logger.info('Modo desenvolvimento - usar: npx prisma migrate dev');
    }
  } catch (error) {
    logger.error('Erro ao executar migrations', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

// Exportar instância do Prisma
export { prisma };
export default prisma;
