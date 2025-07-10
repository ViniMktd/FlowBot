import { Request, Response } from 'express';
import { MercadoPagoService, PaymentData, PIXPaymentData, PreferenceData } from '../services/mercadopago.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';
// import { prisma } from '../config/database'; // Uncomment when Prisma is configured

/**
 * Controller para gerenciar pagamentos via MercadoPago
 */
export class MercadoPagoController {
  private static mercadoPagoService: MercadoPagoService;

  static init() {
    try {
      this.mercadoPagoService = new MercadoPagoService();
      logger.info('✅ MercadoPago service inicializado');
    } catch (error) {
      logger.error('❌ Erro ao inicializar MercadoPago service:', error);
    }
  }

  /**
   * @desc    Create PIX payment
   * @route   POST /api/payments/pix
   * @access  Private
   */
  static createPIXPayment = asyncHandler(async (req: Request, res: Response) => {
    const {
      orderId,
      amount,
      description,
      customerEmail,
      customerName,
    } = req.body;

    if (!orderId || !amount || !customerEmail) {
      throw new ApiError(400, 'Dados obrigatórios: orderId, amount, customerEmail');
    }

    try {
      const paymentData: PIXPaymentData = {
        transaction_amount: Number(amount),
        description: description || `Pagamento pedido #${orderId}`,
        payer: {
          email: customerEmail,
          first_name: customerName?.split(' ')[0],
          last_name: customerName?.split(' ').slice(1).join(' '),
        },
        external_reference: `order_${orderId}`,
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      };

      const payment = await this.mercadoPagoService.createPIXPayment(paymentData);

      // TODO: Salvar pagamento no banco de dados
      /*
      await prisma.payment.create({
        data: {
          id: payment.id.toString(),
          orderId: Number(orderId),
          method: 'PIX',
          status: MercadoPagoService.mapPaymentStatus(payment.status),
          amount: Number(amount),
          externalReference: `order_${orderId}`,
          mpPaymentId: payment.id.toString(),
          createdAt: new Date(),
        },
      });
      */

      logger.info('Pagamento PIX criado com sucesso:', {
        paymentId: payment.id,
        orderId,
        amount,
      });

      res.status(201).json({
        success: true,
        message: 'Pagamento PIX criado com sucesso',
        data: {
          paymentId: payment.id,
          status: payment.status,
          qrCode: payment.point_of_interaction?.transaction_data?.qr_code,
          qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
          ticketUrl: payment.point_of_interaction?.transaction_data?.ticket_url,
          expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
        },
      });

    } catch (error: any) {
      logger.error('Erro ao criar pagamento PIX:', error);
      throw new ApiError(500, `Erro ao criar pagamento PIX: ${error.message}`);
    }
  });

  /**
   * @desc    Create card payment
   * @route   POST /api/payments/card
   * @access  Private
   */
  static createCardPayment = asyncHandler(async (req: Request, res: Response) => {
    const {
      orderId,
      amount,
      description,
      paymentMethodId,
      token,
      installments,
      issuer,
      customerEmail,
      customerName,
      customerCPF,
    } = req.body;

    if (!orderId || !amount || !customerEmail || !token || !paymentMethodId) {
      throw new ApiError(400, 'Dados obrigatórios: orderId, amount, customerEmail, token, paymentMethodId');
    }

    try {
      const paymentData: PaymentData = {
        transaction_amount: Number(amount),
        description: description || `Pagamento pedido #${orderId}`,
        payment_method_id: paymentMethodId,
        token,
        installments,
        issuer_id: issuer,
        payer: {
          email: customerEmail,
          first_name: customerName?.split(' ')[0],
          last_name: customerName?.split(' ').slice(1).join(' '),
          identification: customerCPF ? {
            type: 'CPF',
            number: customerCPF.replace(/\D/g, ''),
          } : undefined,
        },
        external_reference: `order_${orderId}`,
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      };

      const payment = await this.mercadoPagoService.createCardPayment(paymentData);

      // TODO: Salvar pagamento no banco de dados
      /*
      await prisma.payment.create({
        data: {
          id: payment.id.toString(),
          orderId: Number(orderId),
          method: 'CARTAO',
          status: MercadoPagoService.mapPaymentStatus(payment.status),
          amount: Number(amount),
          externalReference: `order_${orderId}`,
          mpPaymentId: payment.id.toString(),
          installments,
          createdAt: new Date(),
        },
      });
      */

      logger.info('Pagamento com cartão criado:', {
        paymentId: payment.id,
        orderId,
        amount,
        status: payment.status,
      });

      res.status(201).json({
        success: true,
        message: 'Pagamento processado com sucesso',
        data: {
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          approvedAt: payment.date_approved,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao criar pagamento com cartão:', error);
      throw new ApiError(500, `Erro ao processar pagamento: ${error.message}`);
    }
  });

  /**
   * @desc    Create checkout preference (Checkout Pro)
   * @route   POST /api/payments/checkout
   * @access  Private
   */
  static createCheckoutPreference = asyncHandler(async (req: Request, res: Response) => {
    const {
      orderId,
      items,
      customerEmail,
      customerName,
      customerPhone,
      backUrls,
    } = req.body;

    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      throw new ApiError(400, 'Dados obrigatórios: orderId, items (array)');
    }

    try {
      const preferenceData: PreferenceData = {
        items: items.map((item: any) => ({
          title: item.title || item.name,
          quantity: Number(item.quantity),
          unit_price: Number(item.unit_price || item.price),
          description: item.description,
        })),
        external_reference: `order_${orderId}`,
        notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
        back_urls: backUrls || {
          success: `${process.env.FRONTEND_URL}/payment/success`,
          failure: `${process.env.FRONTEND_URL}/payment/failure`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
        auto_return: 'approved',
        payer: customerEmail ? {
          email: customerEmail,
          name: customerName?.split(' ')[0],
          surname: customerName?.split(' ').slice(1).join(' '),
          phone: customerPhone ? {
            area_code: customerPhone.substring(0, 2),
            number: customerPhone.substring(2),
          } : undefined,
        } : undefined,
      };

      const preference = await this.mercadoPagoService.createPreference(preferenceData);

      logger.info('Preferência de checkout criada:', {
        preferenceId: preference.id,
        orderId,
        totalItems: items.length,
      });

      res.status(201).json({
        success: true,
        message: 'Preferência de checkout criada com sucesso',
        data: {
          preferenceId: preference.id,
          checkoutUrl: preference.init_point,
          sandboxUrl: preference.sandbox_init_point,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao criar preferência de checkout:', error);
      throw new ApiError(500, `Erro ao criar checkout: ${error.message}`);
    }
  });

  /**
   * @desc    Get payment status
   * @route   GET /api/payments/:paymentId
   * @access  Private
   */
  static getPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(400, 'Payment ID é obrigatório');
    }

    try {
      const payment = await this.mercadoPagoService.getPayment(paymentId);

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          amount: payment.transaction_amount,
          createdAt: payment.date_created,
          approvedAt: payment.date_approved,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao buscar status do pagamento:', error);
      throw new ApiError(500, `Erro ao buscar pagamento: ${error.message}`);
    }
  });

  /**
   * @desc    Cancel payment
   * @route   PUT /api/payments/:paymentId/cancel
   * @access  Private (Admin, Manager)
   */
  static cancelPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      throw new ApiError(400, 'Payment ID é obrigatório');
    }

    try {
      const payment = await this.mercadoPagoService.cancelPayment(paymentId);

      // TODO: Atualizar status no banco de dados
      /*
      await prisma.payment.update({
        where: { mpPaymentId: paymentId },
        data: { 
          status: MercadoPagoService.mapPaymentStatus(payment.status),
          updatedAt: new Date(),
        },
      });
      */

      logger.info('Pagamento cancelado:', {
        paymentId,
        status: payment.status,
      });

      res.status(200).json({
        success: true,
        message: 'Pagamento cancelado com sucesso',
        data: {
          paymentId: payment.id,
          status: payment.status,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao cancelar pagamento:', error);
      throw new ApiError(500, `Erro ao cancelar pagamento: ${error.message}`);
    }
  });

  /**
   * @desc    Refund payment
   * @route   POST /api/payments/:paymentId/refund
   * @access  Private (Admin, Manager)
   */
  static refundPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentId } = req.params;
    const { amount } = req.body;

    if (!paymentId) {
      throw new ApiError(400, 'Payment ID é obrigatório');
    }

    try {
      const refund = await this.mercadoPagoService.refundPayment(
        paymentId, 
        amount ? Number(amount) : undefined
      );

      // TODO: Registrar reembolso no banco de dados
      /*
      await prisma.refund.create({
        data: {
          id: refund.id.toString(),
          paymentId,
          amount: refund.amount,
          status: refund.status,
          createdAt: new Date(),
        },
      });
      */

      logger.info('Reembolso processado:', {
        paymentId,
        refundId: refund.id,
        amount: refund.amount,
      });

      res.status(200).json({
        success: true,
        message: 'Reembolso processado com sucesso',
        data: {
          refundId: refund.id,
          paymentId,
          amount: refund.amount,
          status: refund.status,
        },
      });

    } catch (error: any) {
      logger.error('Erro ao processar reembolso:', error);
      throw new ApiError(500, `Erro ao processar reembolso: ${error.message}`);
    }
  });

  /**
   * @desc    Get payments by order
   * @route   GET /api/payments/order/:orderId
   * @access  Private
   */
  static getPaymentsByOrder = asyncHandler(async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      throw new ApiError(400, 'Order ID é obrigatório');
    }

    try {
      const payments = await this.mercadoPagoService.getPaymentsByExternalReference(`order_${orderId}`);

      res.status(200).json({
        success: true,
        data: payments.map(payment => ({
          paymentId: payment.id,
          status: payment.status,
          statusDetail: payment.status_detail,
          amount: payment.transaction_amount,
          method: payment.payment_method_id,
          createdAt: payment.date_created,
          approvedAt: payment.date_approved,
        })),
        count: payments.length,
      });

    } catch (error: any) {
      logger.error('Erro ao buscar pagamentos do pedido:', error);
      throw new ApiError(500, `Erro ao buscar pagamentos: ${error.message}`);
    }
  });

  /**
   * @desc    Get payment methods
   * @route   GET /api/payments/methods
   * @access  Public
   */
  static getPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    // Esta seria uma lista estática ou obtida da API do MercadoPago
    const paymentMethods = {
      creditCards: [
        { id: 'visa', name: 'Visa', thumbnail: '/images/visa.png' },
        { id: 'master', name: 'Mastercard', thumbnail: '/images/mastercard.png' },
        { id: 'amex', name: 'American Express', thumbnail: '/images/amex.png' },
        { id: 'elo', name: 'Elo', thumbnail: '/images/elo.png' },
      ],
      bankTransfer: [
        { id: 'pix', name: 'PIX', thumbnail: '/images/pix.png' },
      ],
      tickets: [
        { id: 'bolbradesco', name: 'Boleto Bradesco', thumbnail: '/images/boleto.png' },
      ],
    };

    res.status(200).json({
      success: true,
      data: paymentMethods,
    });
  });
}

// Inicializar o controller
MercadoPagoController.init();

export default MercadoPagoController;