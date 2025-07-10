import { WhatsAppController } from '@/controllers/whatsapp.controller';
import { authentication } from '@/middleware/auth';
import { validateRequest } from '@/middleware/validation';
import { Router } from 'express';
import { z } from 'zod';

const router = Router();
const whatsappController = new WhatsAppController();

// Schemas de validação para WhatsApp
const sendTextMessageSchema = z.object({
  to: z.string().min(1, 'Número do telefone é obrigatório'),
  message: z.string().min(1, 'Mensagem é obrigatória')
});

const sendTemplateMessageSchema = z.object({
  to: z.string().min(1, 'Número do telefone é obrigatório'),
  templateName: z.string().min(1, 'Nome do template é obrigatório'),
  parameters: z.array(z.string()).optional()
});

const sendOrderConfirmationSchema = z.object({
  to: z.string().min(1, 'Número do telefone é obrigatório'),
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  orderNumber: z.string().min(1, 'Número do pedido é obrigatório'),
  total: z.number().positive('Total deve ser positivo')
});

const sendShippingNotificationSchema = z.object({
  to: z.string().min(1, 'Número do telefone é obrigatório'),
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  orderNumber: z.string().min(1, 'Número do pedido é obrigatório'),
  trackingCode: z.string().min(1, 'Código de rastreamento é obrigatório')
});

const sendDeliveryNotificationSchema = z.object({
  to: z.string().min(1, 'Número do telefone é obrigatório'),
  customerName: z.string().min(1, 'Nome do cliente é obrigatório'),
  orderNumber: z.string().min(1, 'Número do pedido é obrigatório')
});

const markAsReadSchema = z.object({
  messageId: z.string().min(1, 'ID da mensagem é obrigatório')
});

// Rota pública para verificação do webhook
router.get('/webhook', whatsappController.verifyWebhook);

// Rota pública para receber webhooks
router.post('/webhook', whatsappController.processWebhook);

// Rotas protegidas (requerem autenticação)
router.use(authentication);

// Rotas para envio de mensagens
router.post('/send-text', validateRequest(sendTextMessageSchema), whatsappController.sendTextMessage);
router.post('/send-template', validateRequest(sendTemplateMessageSchema), whatsappController.sendTemplateMessage);

// Rotas para notificações de pedidos
router.post('/send-order-confirmation', validateRequest(sendOrderConfirmationSchema), whatsappController.sendOrderConfirmation);
router.post('/send-shipping-notification', validateRequest(sendShippingNotificationSchema), whatsappController.sendShippingNotification);
router.post('/send-delivery-notification', validateRequest(sendDeliveryNotificationSchema), whatsappController.sendDeliveryNotification);

// Rota para marcar mensagem como lida
router.post('/mark-as-read', validateRequest(markAsReadSchema), whatsappController.markAsRead);

export default router;
