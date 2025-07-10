-- Supplier communication translations
INSERT INTO translations (id, key, language, value, context) VALUES
-- Payment status
('t100', 'payment.status.paid', 'pt-BR', 'Pago', 'supplier'),
('t101', 'payment.status.paid', 'en', 'Paid', 'supplier'),
('t102', 'payment.status.paid', 'zh-CN', '已付款', 'supplier'),

('t103', 'payment.status.pending', 'pt-BR', 'Pendente', 'supplier'),
('t104', 'payment.status.pending', 'en', 'Pending', 'supplier'),
('t105', 'payment.status.pending', 'zh-CN', '待付款', 'supplier'),

('t106', 'payment.status.processing', 'pt-BR', 'Processando', 'supplier'),
('t107', 'payment.status.processing', 'en', 'Processing', 'supplier'),
('t108', 'payment.status.processing', 'zh-CN', '处理中', 'supplier'),

-- Shipping methods
('t109', 'shipping.method.standard', 'pt-BR', 'Padrão', 'supplier'),
('t110', 'shipping.method.standard', 'en', 'Standard', 'supplier'),
('t111', 'shipping.method.standard', 'zh-CN', '标准配送', 'supplier'),

('t112', 'shipping.method.express', 'pt-BR', 'Expressa', 'supplier'),
('t113', 'shipping.method.express', 'en', 'Express', 'supplier'),
('t114', 'shipping.method.express', 'zh-CN', '快递', 'supplier'),

('t115', 'shipping.method.economy', 'pt-BR', 'Econômica', 'supplier'),
('t116', 'shipping.method.economy', 'en', 'Economy', 'supplier'),
('t117', 'shipping.method.economy', 'zh-CN', '经济配送', 'supplier'),

-- Order communication
('t118', 'supplier.order.new', 'pt-BR', 'Novo pedido recebido', 'supplier'),
('t119', 'supplier.order.new', 'en', 'New order received', 'supplier'),
('t120', 'supplier.order.new', 'zh-CN', '收到新订单', 'supplier'),

('t121', 'supplier.order.urgent', 'pt-BR', 'URGENTE: Pedido prioritário', 'supplier'),
('t122', 'supplier.order.urgent', 'en', 'URGENT: Priority order', 'supplier'),
('t123', 'supplier.order.urgent', 'zh-CN', '紧急：优先订单', 'supplier'),

('t124', 'supplier.order.details', 'pt-BR', 'Detalhes do pedido', 'supplier'),
('t125', 'supplier.order.details', 'en', 'Order details', 'supplier'),
('t126', 'supplier.order.details', 'zh-CN', '订单详情', 'supplier'),

('t127', 'supplier.customer.info', 'pt-BR', 'Informações do cliente', 'supplier'),
('t128', 'supplier.customer.info', 'en', 'Customer information', 'supplier'),
('t129', 'supplier.customer.info', 'zh-CN', '客户信息', 'supplier'),

('t130', 'supplier.shipping.address', 'pt-BR', 'Endereço de entrega', 'supplier'),
('t131', 'supplier.shipping.address', 'en', 'Shipping address', 'supplier'),
('t132', 'supplier.shipping.address', 'zh-CN', '收货地址', 'supplier'),

('t133', 'supplier.payment.total', 'pt-BR', 'Total do pagamento', 'supplier'),
('t134', 'supplier.payment.total', 'en', 'Payment total', 'supplier'),
('t135', 'supplier.payment.total', 'zh-CN', '付款总额', 'supplier'),

('t136', 'supplier.request.confirmation', 'pt-BR', 'Por favor, confirme o recebimento deste pedido', 'supplier'),
('t137', 'supplier.request.confirmation', 'en', 'Please confirm receipt of this order', 'supplier'),
('t138', 'supplier.request.confirmation', 'zh-CN', '请确认收到此订单', 'supplier'),

('t139', 'supplier.request.tracking', 'pt-BR', 'Favor enviar código de rastreamento quando disponível', 'supplier'),
('t140', 'supplier.request.tracking', 'en', 'Please send tracking code when available', 'supplier'),
('t141', 'supplier.request.tracking', 'zh-CN', '请在有跟踪代码时发送', 'supplier'),

-- Chinese specific terms
('t142', 'china.factory', 'zh-CN', '工厂', 'supplier'),
('t143', 'china.manufacturer', 'zh-CN', '制造商', 'supplier'),
('t144', 'china.supplier', 'zh-CN', '供应商', 'supplier'),
('t145', 'china.contact_person', 'zh-CN', '联系人', 'supplier'),
('t146', 'china.wechat', 'zh-CN', '微信', 'supplier'),
('t147', 'china.qq', 'zh-CN', 'QQ', 'supplier'),
('t148', 'china.alibaba', 'zh-CN', '阿里巴巴', 'supplier'),
('t149', 'china.business_license', 'zh-CN', '营业执照', 'supplier'),
('t150', 'china.customs_declaration', 'zh-CN', '海关申报', 'supplier'),
('t151', 'china.export_license', 'zh-CN', '出口许可证', 'supplier'),
('t152', 'china.shipping_fee', 'zh-CN', '运费', 'supplier'),
('t153', 'china.processing_time', 'zh-CN', '处理时间', 'supplier'),
('t154', 'china.delivery_time', 'zh-CN', '交货时间', 'supplier'),
('t155', 'china.quality_check', 'zh-CN', '质量检查', 'supplier'),

-- Email templates
('t156', 'email.subject.new_order', 'pt-BR', 'Novo Pedido - {{orderNumber}}', 'supplier'),
('t157', 'email.subject.new_order', 'en', 'New Order - {{orderNumber}}', 'supplier'),
('t158', 'email.subject.new_order', 'zh-CN', '新订单 - {{orderNumber}}', 'supplier'),

('t159', 'email.greeting', 'pt-BR', 'Prezado fornecedor', 'supplier'),
('t160', 'email.greeting', 'en', 'Dear supplier', 'supplier'),
('t161', 'email.greeting', 'zh-CN', '亲爱的供应商', 'supplier'),

('t162', 'email.order_intro', 'pt-BR', 'Recebemos um novo pedido que requer sua atenção', 'supplier'),
('t163', 'email.order_intro', 'en', 'We have received a new order that requires your attention', 'supplier'),
('t164', 'email.order_intro', 'zh-CN', '我们收到了一个需要您关注的新订单', 'supplier'),

('t165', 'email.closing', 'pt-BR', 'Atenciosamente, Equipe FlowBot', 'supplier'),
('t166', 'email.closing', 'en', 'Best regards, FlowBot Team', 'supplier'),
('t167', 'email.closing', 'zh-CN', '此致敬礼，FlowBot团队', 'supplier'),

-- Special instructions
('t168', 'order.special_instructions', 'pt-BR', 'Instruções especiais: {{instructions}}', 'supplier'),
('t169', 'order.special_instructions', 'en', 'Special instructions: {{instructions}}', 'supplier'),
('t170', 'order.special_instructions', 'zh-CN', '特殊说明：{{instructions}}', 'supplier'),

-- Time formats
('t171', 'time.business_days', 'pt-BR', 'dias úteis', 'supplier'),
('t172', 'time.business_days', 'en', 'business days', 'supplier'),
('t173', 'time.business_days', 'zh-CN', '工作日', 'supplier'),

('t174', 'time.processing', 'pt-BR', 'tempo de processamento', 'supplier'),
('t175', 'time.processing', 'en', 'processing time', 'supplier'),
('t176', 'time.processing', 'zh-CN', '处理时间', 'supplier')

ON CONFLICT (key, language) DO NOTHING;