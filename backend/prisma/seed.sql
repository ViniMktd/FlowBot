-- Seed data para desenvolvimento
-- Inserir dados de teste para customers, suppliers e orders

-- Customers
INSERT INTO "customers"
  (
  "id",
  "name",
  "email",
  "phone",
  "cpf_cnpj",
  "address_cep",
  "address_street",
  "address_number",
  "address_city",
  "address_state",
  "created_at",
  "updated_at"
  )
VALUES
  (
    'customer-1',
    'João Silva',
    'joao.silva@email.com',
    '+55 11 99999-1234',
    '123.456.789-00',
    '01234-567',
    'Rua das Flores',
    '123',
    'São Paulo',
    'SP',
    NOW(),
    NOW()
),
  (
    'customer-2',
    'Maria Santos',
    'maria.santos@email.com',
    '+55 21 88888-5678',
    '987.654.321-00',
    '98765-432',
    'Avenida Brasil',
    '456',
    'Rio de Janeiro',
    'RJ',
    NOW(),
    NOW()
);

-- Suppliers
INSERT INTO "suppliers"
  (
  "id",
  "company_name",
  "trade_name",
  "cnpj",
  "email",
  "phone",
  "contact_person",
  "api_endpoint",
  "api_key",
  "notification_email",
  "address_cep",
  "address_street",
  "address_number",
  "address_city",
  "address_state",
  "average_processing_time",
  "performance_rating",
  "active",
  "created_at",
  "updated_at"
  )
VALUES
  (
    'supplier-1',
    'Fornecedor ABC Ltda',
    'ABC Distribuidora',
    '12.345.678/0001-90',
    'vendas@abc.com.br',
    '+55 11 1234-5678',
    'João Vendas',
    'https://api.abc.com.br',
    'abc-api-key-123',
    'vendas@abc.com.br',
    '12345-678',
    'Rua Industrial',
    '789',
    'São Paulo',
    'SP',
    48,
    4.5,
    true,
    NOW(),
    NOW()
),
  (
    'supplier-2',
    'Distribuidora XYZ S.A.',
    'XYZ Logística',
    '98.765.432/0001-10',
    'pedidos@xyz.com.br',
    '+55 21 9876-5432',
    'Maria Pedidos',
    'https://api.xyz.com.br',
    'xyz-api-key-456',
    'pedidos@xyz.com.br',
    '98765-123',
    'Avenida Logística',
    '321',
    'Rio de Janeiro',
    'RJ',
    72,
    4.8,
    true,
    NOW(),
    NOW()
);

-- Orders
INSERT INTO "orders"
  (
  "id",
  "shopify_order_id",
  "shopify_order_number",
  "customer_id",
  "supplier_id",
  "status",
  "total_amount",
  "currency",
  "shipping_amount",
  "payment_status",
  "created_at",
  "updated_at"
  )
VALUES
  (
    'order-1',
    123456,
    'SHOP-001',
    'customer-1',
    'supplier-1',
    'PENDING',
    150.50,
    'BRL',
    10.00,
    'PAID',
    NOW(),
    NOW()
),
  (
    'order-2',
    123457,
    'SHOP-002',
    'customer-2',
    'supplier-2',
    'SENT_TO_SUPPLIER',
    299.99,
    'BRL',
    15.00,
    'PAID',
    NOW(),
    NOW()
);

-- Order Items
INSERT INTO "order_items"
  (
  "id",
  "order_id",
  "shopify_variant_id",
  "product_name",
  "variant_title",
  "quantity",
  "price",
  "sku",
  "created_at"
  )
VALUES
  (
    'item-1',
    'order-1',
    789123,
    'Camiseta Básica',
    'Azul / M',
    2,
    35.00,
    'CAM-BASIC-AZUL-M',
    NOW()
),
  (
    'item-2',
    'order-1',
    789124,
    'Calça Jeans',
    'Azul / 42',
    1,
    80.00,
    'CAL-JEANS-AZUL-42',
    NOW()
),
  (
    'item-3',
    'order-2',
    789125,
    'Tênis Esportivo',
    'Branco / 40',
    1,
    250.00,
    'TEN-ESPORT-BRANCO-40',
    NOW()
);
