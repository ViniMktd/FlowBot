import { logger } from '@/config/logger';
import { WhatsAppService } from '@/services/whatsapp.service';
import { Request, Response } from 'express';

export class WhatsAppController {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Enviar mensagem de texto
   */
  public sendTextMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        res.status(400).json({
          success: false,
          message: 'Telefone e mensagem são obrigatórios'
        });
        return;
      }

      const result = await this.whatsappService.sendTextMessage(to, message);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Mensagem enviada com sucesso' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao enviar mensagem de texto', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Enviar mensagem usando template
   */
  public sendTemplateMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, templateName, parameters } = req.body;

      if (!to || !templateName) {
        res.status(400).json({
          success: false,
          message: 'Telefone e nome do template são obrigatórios'
        });
        return;
      }

      const result = await this.whatsappService.sendTemplateMessage(to, templateName, parameters || []);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Template enviado com sucesso' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao enviar template', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Enviar confirmação de pedido
   */
  public sendOrderConfirmation = async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, customerName, orderNumber, total } = req.body;

      if (!to || !customerName || !orderNumber || total === undefined) {
        res.status(400).json({
          success: false,
          message: 'Telefone, nome do cliente, número do pedido e total são obrigatórios'
        });
        return;
      }

      const result = await this.whatsappService.sendOrderConfirmation(to, customerName, orderNumber, total);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Confirmação de pedido enviada com sucesso' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao enviar confirmação de pedido', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Enviar notificação de envio
   */
  public sendShippingNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, customerName, orderNumber, trackingCode } = req.body;

      if (!to || !customerName || !orderNumber || !trackingCode) {
        res.status(400).json({
          success: false,
          message: 'Telefone, nome do cliente, número do pedido e código de rastreamento são obrigatórios'
        });
        return;
      }

      const result = await this.whatsappService.sendShippingNotification(to, customerName, orderNumber, trackingCode);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Notificação de envio enviada com sucesso' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de envio', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Enviar notificação de entrega
   */
  public sendDeliveryNotification = async (req: Request, res: Response): Promise<void> => {
    try {
      const { to, customerName, orderNumber } = req.body;

      if (!to || !customerName || !orderNumber) {
        res.status(400).json({
          success: false,
          message: 'Telefone, nome do cliente e número do pedido são obrigatórios'
        });
        return;
      }

      const result = await this.whatsappService.sendDeliveryNotification(to, customerName, orderNumber);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Notificação de entrega enviada com sucesso' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao enviar notificação de entrega', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Processar webhook do WhatsApp
   */
  public processWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const webhookData = req.body;

      // Verificar se é uma mensagem de entrada
      if (webhookData.entry && webhookData.entry.length > 0) {
        const entry = webhookData.entry[0];

        if (entry.changes && entry.changes.length > 0) {
          const change = entry.changes[0];

          if (change.value && change.value.messages && change.value.messages.length > 0) {
            const message = change.value.messages[0];

            const result = await this.whatsappService.processIncomingMessage(message);

            if (result.success) {
              // Marcar mensagem como lida
              await this.whatsappService.markAsRead(message.id);
            }
          }
        }
      }

      // Sempre responder com 200 para o webhook
      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao processar webhook', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      // Mesmo com erro, responder 200 para não reenviar webhook
      res.status(200).json({
        success: false,
        message: 'Erro ao processar webhook'
      });
    }
  };

  /**
   * Verificar webhook do WhatsApp (para configuração inicial)
   */
  public verifyWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env['WHATSAPP_VERIFY_TOKEN'];

      if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Webhook do WhatsApp verificado com sucesso');
        res.status(200).send(challenge);
        return;
      }

      logger.warn('Tentativa de verificação de webhook inválida', {
        mode,
        token: token ? 'fornecido' : 'não fornecido'
      });

      res.status(403).json({
        success: false,
        message: 'Token de verificação inválido'
      });
    } catch (error) {
      logger.error('Erro ao verificar webhook', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        query: req.query
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };

  /**
   * Marcar mensagem como lida
   */
  public markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
      const { messageId } = req.body;

      if (!messageId) {
        res.status(400).json({
          success: false,
          message: 'ID da mensagem é obrigatório'
        });
        return;
      }

      const result = await this.whatsappService.markAsRead(messageId);

      res.status(result.success ? 200 : 500).json({
        success: result.success,
        message: result.success ? 'Mensagem marcada como lida' : result.message,
        data: result.data
      });
    } catch (error) {
      logger.error('Erro ao marcar mensagem como lida', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        body: req.body
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  };
}
