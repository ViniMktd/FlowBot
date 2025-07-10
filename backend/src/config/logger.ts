import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Configuração do logger para ambiente brasileiro
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: () => {
      return new Date().toLocaleString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Arquivo de log rotativo diário
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'flowbot-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d', // Manter logs por 30 dias
  maxSize: '20m',  // Máximo 20MB por arquivo
  format: logFormat
});

// Arquivo de log para erros
const errorFileTransport = new DailyRotateFile({
  filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxFiles: '30d',
  maxSize: '20m',
  format: logFormat
});

// Configuração do logger principal
export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'flowbot-backend',
    environment: process.env['NODE_ENV'] || 'development',
    timezone: 'America/Sao_Paulo'
  },
  transports: [
    // Arquivo de logs normais
    fileRotateTransport,

    // Arquivo de logs de erro
    errorFileTransport
  ],

  // Tratar exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: logFormat
    })
  ],

  // Tratar promises rejeitadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: logFormat
    })
  ]
});

// Adicionar console transport apenas em desenvolvimento
if (process.env['NODE_ENV'] !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${service}] ${level}: ${message} ${metaStr}`;
      })
    )
  }));
}

// Função auxiliar para logs de ordem específicos
export const orderLogger = {
  info: (orderId: string, message: string, meta?: any) => {
    logger.info(message, { orderId, ...meta });
  },

  error: (orderId: string, message: string, error?: any, meta?: any) => {
    logger.error(message, {
      orderId,
      error: error?.message || error,
      stack: error?.stack,
      ...meta
    });
  },

  warn: (orderId: string, message: string, meta?: any) => {
    logger.warn(message, { orderId, ...meta });
  }
};

// Função auxiliar para logs de WhatsApp
export const whatsappLogger = {
  info: (phone: string, messageType: string, message: string, meta?: any) => {
    logger.info(`WhatsApp ${messageType}`, {
      phone,
      messageType,
      message,
      component: 'whatsapp',
      ...meta
    });
  },

  error: (phone: string, messageType: string, error: any, meta?: any) => {
    logger.error(`WhatsApp Error - ${messageType}`, {
      phone,
      messageType,
      error: error?.message || error,
      stack: error?.stack,
      component: 'whatsapp',
      ...meta
    });
  }
};

// Função auxiliar para logs de Shopify
export const shopifyLogger = {
  info: (action: string, message: string, meta?: any) => {
    logger.info(`Shopify ${action}`, {
      action,
      message,
      component: 'shopify',
      ...meta
    });
  },

  error: (action: string, error: any, meta?: any) => {
    logger.error(`Shopify Error - ${action}`, {
      action,
      error: error?.message || error,
      stack: error?.stack,
      component: 'shopify',
      ...meta
    });
  }
};

export default logger;
