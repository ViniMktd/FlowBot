-- Basic translations for international support
INSERT INTO translations (id, key, language, value, context) VALUES
-- Order confirmations
('t001', 'order.confirmed', 'pt-BR', 'Pedido confirmado com sucesso!', 'whatsapp'),
('t002', 'order.confirmed', 'en', 'Order confirmed successfully!', 'whatsapp'),
('t003', 'order.confirmed', 'zh-CN', '订单确认成功！', 'whatsapp'),

-- Shipping notifications
('t004', 'order.shipped', 'pt-BR', 'Seu pedido foi enviado!', 'whatsapp'),
('t005', 'order.shipped', 'en', 'Your order has been shipped!', 'whatsapp'),
('t006', 'order.shipped', 'zh-CN', '您的订单已发货！', 'whatsapp'),

-- Tracking codes
('t007', 'tracking.code', 'pt-BR', 'Código de rastreamento: {{code}}', 'whatsapp'),
('t008', 'tracking.code', 'en', 'Tracking code: {{code}}', 'whatsapp'),
('t009', 'tracking.code', 'zh-CN', '追踪代码：{{code}}', 'whatsapp'),

-- Delivery notifications
('t010', 'order.delivered', 'pt-BR', 'Seu pedido foi entregue!', 'whatsapp'),
('t011', 'order.delivered', 'en', 'Your order has been delivered!', 'whatsapp'),
('t012', 'order.delivered', 'zh-CN', '您的订单已送达！', 'whatsapp'),

-- Supplier communication
('t013', 'supplier.new_order', 'pt-BR', 'Novo pedido recebido', 'email'),
('t014', 'supplier.new_order', 'en', 'New order received', 'email'),
('t015', 'supplier.new_order', 'zh-CN', '收到新订单', 'email'),

-- Order status
('t016', 'status.processing', 'pt-BR', 'Processando', 'system'),
('t017', 'status.processing', 'en', 'Processing', 'system'),
('t018', 'status.processing', 'zh-CN', '处理中', 'system'),

('t019', 'status.shipped', 'pt-BR', 'Enviado', 'system'),
('t020', 'status.shipped', 'en', 'Shipped', 'system'),
('t021', 'status.shipped', 'zh-CN', '已发货', 'system'),

('t022', 'status.delivered', 'pt-BR', 'Entregue', 'system'),
('t023', 'status.delivered', 'en', 'Delivered', 'system'),
('t024', 'status.delivered', 'zh-CN', '已送达', 'system'),

-- Common phrases
('t025', 'greeting', 'pt-BR', 'Olá {{name}}!', 'whatsapp'),
('t026', 'greeting', 'en', 'Hello {{name}}!', 'whatsapp'),
('t027', 'greeting', 'zh-CN', '您好 {{name}}！', 'whatsapp'),

('t028', 'thank_you', 'pt-BR', 'Obrigado pela preferência!', 'whatsapp'),
('t029', 'thank_you', 'en', 'Thank you for your business!', 'whatsapp'),
('t030', 'thank_you', 'zh-CN', '感谢您的惠顾！', 'whatsapp'),

-- Payment methods
('t031', 'payment.pix', 'pt-BR', 'PIX', 'system'),
('t032', 'payment.credit_card', 'pt-BR', 'Cartão de Crédito', 'system'),
('t033', 'payment.credit_card', 'en', 'Credit Card', 'system'),
('t034', 'payment.credit_card', 'zh-CN', '信用卡', 'system'),

('t035', 'payment.bank_transfer', 'pt-BR', 'Transferência Bancária', 'system'),
('t036', 'payment.bank_transfer', 'en', 'Bank Transfer', 'system'),
('t037', 'payment.bank_transfer', 'zh-CN', '银行转账', 'system'),

-- Shipping methods
('t038', 'shipping.standard', 'pt-BR', 'Entrega Padrão', 'system'),
('t039', 'shipping.standard', 'en', 'Standard Shipping', 'system'),
('t040', 'shipping.standard', 'zh-CN', '标准配送', 'system'),

('t041', 'shipping.express', 'pt-BR', 'Entrega Expressa', 'system'),
('t042', 'shipping.express', 'en', 'Express Shipping', 'system'),
('t043', 'shipping.express', 'zh-CN', '快递', 'system'),

('t044', 'shipping.international', 'pt-BR', 'Entrega Internacional', 'system'),
('t045', 'shipping.international', 'en', 'International Shipping', 'system'),
('t046', 'shipping.international', 'zh-CN', '国际配送', 'system'),

-- Customer service
('t047', 'support.help', 'pt-BR', 'Como posso ajudá-lo?', 'whatsapp'),
('t048', 'support.help', 'en', 'How can I help you?', 'whatsapp'),
('t049', 'support.help', 'zh-CN', '我可以为您提供什么帮助？', 'whatsapp'),

('t050', 'support.contact', 'pt-BR', 'Entre em contato conosco', 'whatsapp'),
('t051', 'support.contact', 'en', 'Contact us', 'whatsapp'),
('t052', 'support.contact', 'zh-CN', '联系我们', 'whatsapp'),

-- Auto responses
('t053', 'auto_response.tracking', 'pt-BR', '📦 Para consultar o rastreamento, acesse o site da transportadora com o código enviado. Se não recebeu, informe o número do pedido!', 'whatsapp'),
('t054', 'auto_response.tracking', 'en', '📦 To track your order, visit the carrier website with the code we sent. If you didn't receive it, please provide your order number!', 'whatsapp'),
('t055', 'auto_response.tracking', 'zh-CN', '📦 要跟踪您的订单，请使用我们发送的代码访问承运商网站。如果您没有收到，请提供您的订单号！', 'whatsapp'),

('t056', 'auto_response.delivery', 'pt-BR', '🚚 O prazo varia conforme sua região. Após o envio, você receberá o código de rastreamento!', 'whatsapp'),
('t057', 'auto_response.delivery', 'en', '🚚 Delivery time varies by region. After shipping, you will receive the tracking code!', 'whatsapp'),
('t058', 'auto_response.delivery', 'zh-CN', '🚚 送货时间因地区而异。发货后，您将收到跟踪代码！', 'whatsapp'),

('t059', 'auto_response.cancel', 'pt-BR', '❌ Para cancelamentos, envie o número do pedido e motivo. Nossa equipe analisará!', 'whatsapp'),
('t060', 'auto_response.cancel', 'en', '❌ For cancellations, send your order number and reason. Our team will review!', 'whatsapp'),
('t061', 'auto_response.cancel', 'zh-CN', '❌ 如需取消，请发送订单号和原因。我们的团队将审查！', 'whatsapp'),

('t062', 'auto_response.return', 'pt-BR', '🔄 Para trocas e devoluções, temos 7 dias. Envie fotos do produto e número do pedido!', 'whatsapp'),
('t063', 'auto_response.return', 'en', '🔄 For returns and exchanges, we have 7 days. Send photos of the product and order number!', 'whatsapp'),
('t064', 'auto_response.return', 'zh-CN', '🔄 退货和换货，我们有7天时间。请发送产品照片和订单号！', 'whatsapp'),

('t065', 'auto_response.thanks', 'pt-BR', '😊 Fico feliz em ajudar! Estamos sempre à disposição. Tenha um ótimo dia!', 'whatsapp'),
('t066', 'auto_response.thanks', 'en', '😊 Happy to help! We are always at your service. Have a great day!', 'whatsapp'),
('t067', 'auto_response.thanks', 'zh-CN', '😊 很高兴为您服务！我们随时为您服务。祝您愉快！', 'whatsapp'),

('t068', 'auto_response.greeting', 'pt-BR', '👋 Olá! Sou o assistente virtual da FlowBot. Como posso ajudá-lo hoje?', 'whatsapp'),
('t069', 'auto_response.greeting', 'en', '👋 Hello! I am FlowBot virtual assistant. How can I help you today?', 'whatsapp'),
('t070', 'auto_response.greeting', 'zh-CN', '👋 您好！我是FlowBot虚拟助手。今天我可以为您做些什么？', 'whatsapp'),

('t071', 'auto_response.default', 'pt-BR', '👋 Obrigado pelo contato! Nossa equipe analisará sua mensagem em breve.', 'whatsapp'),
('t072', 'auto_response.default', 'en', '👋 Thank you for contacting us! Our team will review your message shortly.', 'whatsapp'),
('t073', 'auto_response.default', 'zh-CN', '👋 感谢您联系我们！我们的团队将很快审查您的消息。', 'whatsapp'),

-- Additional order fields
('t074', 'order.total', 'pt-BR', 'Total', 'system'),
('t075', 'order.total', 'en', 'Total', 'system'),
('t076', 'order.total', 'zh-CN', '总计', 'system'),

('t077', 'order.preparing', 'pt-BR', 'Estamos preparando seu pedido com carinho', 'whatsapp'),
('t078', 'order.preparing', 'en', 'We are carefully preparing your order', 'whatsapp'),
('t079', 'order.preparing', 'zh-CN', '我们正在精心准备您的订单', 'whatsapp'),

('t080', 'tracking.instructions', 'pt-BR', 'Acompanhe sua entrega', 'whatsapp'),
('t081', 'tracking.instructions', 'en', 'Track your delivery', 'whatsapp'),
('t082', 'tracking.instructions', 'zh-CN', '跟踪您的送货', 'whatsapp'),

('t083', 'order.see_you_soon', 'pt-BR', 'Aguardamos você em breve', 'whatsapp'),
('t084', 'order.see_you_soon', 'en', 'We look forward to seeing you soon', 'whatsapp'),
('t085', 'order.see_you_soon', 'zh-CN', '我们期待很快见到您', 'whatsapp')

ON CONFLICT (key, language) DO NOTHING;