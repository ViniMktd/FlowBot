import { Job } from 'bull';
import { logger } from '../config/logger';
import { WhatsAppService } from '../services/whatsapp.service';
import { BrazilianTimeUtils } from '../utils/brazilian';
import { templateService } from '../services/template.service';
import { i18nService } from '../services/i18n.service';
import { prisma } from '../config/database';

/**
 * Worker para processamento de notificações
 */
export class NotificationWorker {
  private whatsappService: WhatsAppService;

  constructor() {
    this.whatsappService = new WhatsAppService();
  }

  /**
   * Enviar notificação push
   */
  async sendPushNotification(job: Job): Promise<void> {
    const { userId, title, message, data } = job.data;

    try {
      logger.info(`📱 Enviando notificação push`, {
        jobId: job.id,
        userId,
        title
      });

      // TODO: Implementar envio de push notification
      await this.sendPushToUser(userId, {
        title,
        message,
        data,
        timestamp: BrazilianTimeUtils.now().toDate()
      });

      await job.progress(100);

      logger.info(`✅ Notificação push enviada`, {
        jobId: job.id,
        userId
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar notificação push`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação por email com suporte internacional
   */
  async sendEmailNotification(job: Job): Promise<void> {
    const { to, subject, templateId, data, language = 'pt-BR', context } = job.data;

    try {
      logger.info(`📧 Enviando notificação por email`, {
        jobId: job.id,
        to,
        subject,
        templateId,
        language
      });

      // Usar template service se templateId for fornecido
      if (templateId && context) {
        const template = await templateService.getFormattedTemplate(templateId, 'email', {
          language,
          ...context
        });

        if (template) {
          await this.sendEmailToUser(to, {
            subject: template.subject || subject,
            content: template.content,
            data,
            language,
            timestamp: BrazilianTimeUtils.now().toDate()
          });
        } else {
          // Fallback para email simples
          await this.sendEmailToUser(to, {
            subject,
            content: data.message || '',
            data,
            language,
            timestamp: BrazilianTimeUtils.now().toDate()
          });
        }
      } else {
        // Envio de email simples
        await this.sendEmailToUser(to, {
          subject,
          content: data.message || '',
          data,
          language,
          timestamp: BrazilianTimeUtils.now().toDate()
        });
      }

      await job.progress(100);

      logger.info(`✅ Email enviado`, {
        jobId: job.id,
        to,
        language
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar email`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Enviar notificação por SMS
   */
  async sendSMSNotification(job: Job): Promise<void> {
    const { phone, message } = job.data;

    try {
      logger.info(`📱 Enviando SMS`, {
        jobId: job.id,
        phone
      });

      // TODO: Implementar envio de SMS
      await this.sendSMSToPhone(phone, message);

      await job.progress(100);

      logger.info(`✅ SMS enviado`, {
        jobId: job.id,
        phone
      });

    } catch (error) {
      logger.error(`❌ Erro ao enviar SMS`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar notificação agendada com suporte internacional
   */
  async processScheduledNotification(job: Job): Promise<void> {
    const { notificationId, type, data, language = 'pt-BR', context } = job.data;

    try {
      logger.info(`⏰ Processando notificação agendada`, {
        jobId: job.id,
        notificationId,
        type,
        language
      });

      // Verificar se a notificação ainda é válida
      const notification = await this.getScheduledNotification(notificationId);
      if (!notification) {
        logger.warn(`⚠️ Notificação não encontrada: ${notificationId}`);
        return;
      }

      if (notification.cancelled) {
        logger.info(`❌ Notificação cancelada: ${notificationId}`);
        return;
      }

      // Detectar idioma do cliente se não fornecido
      const customerLanguage = await this.detectCustomerLanguage(data.customerId, data.phone);
      const finalLanguage = language || customerLanguage || 'pt-BR';

      // Processar baseado no tipo
      switch (type) {
        case 'whatsapp':
          // Usar template service se templateId for fornecido
          if (data.templateId && context) {
            const template = await templateService.getFormattedTemplate(data.templateId, 'whatsapp', {
              language: finalLanguage,
              ...context
            });

            if (template) {
              await this.whatsappService.sendMessage({
                customerId: data.customerId || 'unknown',
                phone: data.phone,
                messageType: 'text',
                data: { message: template.content }
              });
            }
          } else {
            await this.whatsappService.sendMessage({
              customerId: data.customerId || 'unknown',
              phone: data.phone,
              messageType: 'text',
              data: { message: data.message }
            });
          }
          break;
          
        case 'email':
          await this.sendEmailToUser(data.to, {
            ...data,
            language: finalLanguage
          });
          break;
          
        case 'sms':
          await this.sendSMSToPhone(data.phone, data.message);
          break;
          
        case 'push':
          await this.sendPushToUser(data.userId, data);
          break;
          
        default:
          throw new Error(`Tipo de notificação desconhecido: ${type}`);
      }

      // Marcar como enviada
      await this.markNotificationAsSent(notificationId);

      await job.progress(100);

      logger.info(`✅ Notificação agendada processada`, {
        jobId: job.id,
        notificationId,
        type,
        language: finalLanguage
      });

    } catch (error) {
      logger.error(`❌ Erro ao processar notificação agendada`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Processar notificação em lote com suporte internacional
   */
  async processBatchNotification(job: Job): Promise<void> {
    const { batchId, type, recipients, template, data, templateId } = job.data;

    try {
      logger.info(`📦 Processando lote de notificações`, {
        jobId: job.id,
        batchId,
        type,
        recipientCount: recipients.length
      });

      let sentCount = 0;
      let errorCount = 0;

      // Processar cada destinatário
      for (const recipient of recipients) {
        try {
          // Detectar idioma do destinatário
          const recipientLanguage = await this.detectCustomerLanguage(recipient.customerId, recipient.phone);
          
          // Personalizar dados para o destinatário
          const personalizedData = {
            ...data,
            ...recipient.data,
            language: recipientLanguage || 'pt-BR'
          };

          // Enviar notificação baseada no tipo
          switch (type) {
            case 'whatsapp':
              if (templateId) {
                // Usar template service para mensagem formatada
                const formattedTemplate = await templateService.getFormattedTemplate(templateId, 'whatsapp', {
                  language: personalizedData.language,
                  ...personalizedData
                });

                if (formattedTemplate) {
                  await this.whatsappService.sendMessage({
                    customerId: recipient.customerId || 'unknown',
                    phone: recipient.phone,
                    messageType: 'text',
                    data: { message: formattedTemplate.content }
                  });
                }
              } else {
                await this.whatsappService.sendMessage({
                  customerId: recipient.customerId || 'unknown',
                  phone: recipient.phone,
                  messageType: 'text',
                  data: { message: this.personalizeTemplate(template, personalizedData) }
                });
              }
              break;
              
            case 'email':
              await this.sendEmailToUser(recipient.email, {
                ...personalizedData,
                templateId: templateId || template,
                language: personalizedData.language
              });
              break;
              
            case 'sms':
              await this.sendSMSToPhone(
                recipient.phone,
                this.personalizeTemplate(template, personalizedData)
              );
              break;
              
            case 'push':
              await this.sendPushToUser(recipient.userId, {
                ...personalizedData,
                template
              });
              break;
          }

          sentCount++;
        } catch (error) {
          errorCount++;
          logger.error(`❌ Erro ao enviar para ${recipient.id}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }

        // Atualizar progresso
        await job.progress((sentCount + errorCount) / recipients.length * 100);
      }

      // Registrar estatísticas do lote
      await this.recordBatchStats(batchId, {
        total: recipients.length,
        sent: sentCount,
        errors: errorCount
      });

      logger.info(`✅ Lote processado`, {
        jobId: job.id,
        batchId,
        sent: sentCount,
        errors: errorCount
      });

    } catch (error) {
      logger.error(`❌ Erro ao processar lote`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Limpar notificações antigas
   */
  async cleanupOldNotifications(job: Job): Promise<void> {
    const { olderThanDays = 30 } = job.data;

    try {
      logger.info(`🧹 Limpando notificações antigas`, {
        jobId: job.id,
        olderThanDays
      });

      const cutoffDate = BrazilianTimeUtils.now()
        .subtract(olderThanDays, 'day')
        .toDate();

      // Buscar notificações antigas
      const oldNotifications = await this.findOldNotifications(cutoffDate);

      let deletedCount = 0;
      for (const notification of oldNotifications) {
        try {
          await this.deleteNotification(notification.id);
          deletedCount++;
        } catch (error) {
          logger.error(`❌ Erro ao deletar notificação: ${notification.id}`, {
            error: error instanceof Error ? error.message : String(error)
          });
        }

        await job.progress(deletedCount / oldNotifications.length * 100);
      }

      logger.info(`✅ Limpeza concluída`, {
        jobId: job.id,
        deletedCount,
        totalFound: oldNotifications.length
      });

    } catch (error) {
      logger.error(`❌ Erro na limpeza`, {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /* ==========================================
     MÉTODOS AUXILIARES PRIVADOS
     ========================================== */

  private async sendPushToUser(userId: string, data: any): Promise<void> {
    // TODO: Implementar envio de push notification
    logger.info(`📱 Push enviado para usuário: ${userId}`, {
      title: data.title,
      message: data.message
    });
  }

  private async sendEmailToUser(to: string, data: any): Promise<void> {
    // TODO: Implementar envio de email real
    logger.info(`📧 Email enviado para: ${to}`, {
      subject: data.subject,
      templateId: data.templateId,
      language: data.language,
      content: data.content ? data.content.substring(0, 100) + '...' : 'N/A'
    });
  }

  private async sendSMSToPhone(phone: string, message: string): Promise<void> {
    // TODO: Implementar envio de SMS
    logger.info(`📱 SMS enviado para: ${phone}`, {
      message: message.substring(0, 50) + '...'
    });
  }

  private async getScheduledNotification(notificationId: string): Promise<any> {
    // TODO: Implementar busca de notificação agendada
    return {
      id: notificationId,
      cancelled: false,
      scheduledAt: new Date(),
      data: {}
    };
  }

  private async markNotificationAsSent(notificationId: string): Promise<void> {
    // TODO: Implementar marcação como enviada
    logger.info(`✅ Notificação marcada como enviada: ${notificationId}`);
  }

  private personalizeTemplate(template: string, data: any): string {
    let personalized = template;

    // Substituir placeholders
    Object.keys(data).forEach(key => {
      const placeholder = `{${key}}`;
      personalized = personalized.replace(new RegExp(placeholder, 'g'), data[key]);
    });

    return personalized;
  }

  private async recordBatchStats(batchId: string, stats: any): Promise<void> {
    // TODO: Implementar registro de estatísticas
    logger.info(`📊 Estatísticas do lote: ${batchId}`, stats);
  }

  private async findOldNotifications(cutoffDate: Date): Promise<any[]> {
    // TODO: Implementar busca de notificações antigas
    logger.info(`🔍 Buscando notificações anteriores a: ${cutoffDate}`);
    return [];
  }

  private async deleteNotification(notificationId: string): Promise<void> {
    // TODO: Implementar exclusão de notificação
    logger.info(`🗑️ Notificação deletada: ${notificationId}`);
  }

  /**
   * Detectar idioma do cliente baseado no ID ou telefone
   */
  private async detectCustomerLanguage(customerId?: string, phone?: string): Promise<string | null> {
    try {
      // Tentar buscar pelo ID do cliente
      if (customerId) {
        const customer = await prisma.customer.findUnique({
          where: { id: customerId }
        });

        if (customer) {
          // Usar idioma preferido do cliente se disponível
          if (customer.preferredLanguage) {
            return customer.preferredLanguage;
          }
          
          // Usar idioma baseado no país (se tiver countryId)
          if (customer.countryId) {
            const country = await prisma.country.findUnique({
              where: { id: customer.countryId }
            });
            if (country) {
              return country.language;
            }
          }
        }
      }

      // Tentar detectar pelo telefone
      if (phone) {
        const phoneLanguage = i18nService.getLanguageByPhoneNumber(phone);
        if (phoneLanguage) {
          return phoneLanguage;
        }
      }

      return null;
    } catch (error) {
      logger.error('Erro ao detectar idioma do cliente', { customerId, phone, error });
      return null;
    }
  }
}

// Instância singleton do worker
export const notificationWorker = new NotificationWorker();
