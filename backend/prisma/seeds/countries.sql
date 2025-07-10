-- Countries seed data for international support
INSERT INTO countries (id, code, name, name_en, name_local, timezone, currency, language, phone_prefix, active) VALUES
-- Brazil
('550e8400-e29b-41d4-a716-446655440000', 'BR', 'Brasil', 'Brazil', 'Brasil', 'America/Sao_Paulo', 'BRL', 'pt-BR', '+55', true),
-- China
('550e8400-e29b-41d4-a716-446655440001', 'CN', 'China', 'China', '中国', 'Asia/Shanghai', 'CNY', 'zh-CN', '+86', true),
-- United States
('550e8400-e29b-41d4-a716-446655440002', 'US', 'Estados Unidos', 'United States', 'United States', 'America/New_York', 'USD', 'en', '+1', true),
-- India
('550e8400-e29b-41d4-a716-446655440003', 'IN', 'Índia', 'India', 'भारत', 'Asia/Kolkata', 'INR', 'hi', '+91', true),
-- Mexico
('550e8400-e29b-41d4-a716-446655440004', 'MX', 'México', 'Mexico', 'México', 'America/Mexico_City', 'MXN', 'es', '+52', true),
-- Canada
('550e8400-e29b-41d4-a716-446655440005', 'CA', 'Canadá', 'Canada', 'Canada', 'America/Toronto', 'CAD', 'en', '+1', true),
-- Germany
('550e8400-e29b-41d4-a716-446655440006', 'DE', 'Alemanha', 'Germany', 'Deutschland', 'Europe/Berlin', 'EUR', 'de', '+49', true),
-- United Kingdom
('550e8400-e29b-41d4-a716-446655440007', 'GB', 'Reino Unido', 'United Kingdom', 'United Kingdom', 'Europe/London', 'GBP', 'en', '+44', true),
-- France
('550e8400-e29b-41d4-a716-446655440008', 'FR', 'França', 'France', 'France', 'Europe/Paris', 'EUR', 'fr', '+33', true),
-- Italy
('550e8400-e29b-41d4-a716-446655440009', 'IT', 'Itália', 'Italy', 'Italia', 'Europe/Rome', 'EUR', 'it', '+39', true),
-- Spain
('550e8400-e29b-41d4-a716-446655440010', 'ES', 'Espanha', 'Spain', 'España', 'Europe/Madrid', 'EUR', 'es', '+34', true),
-- Japan
('550e8400-e29b-41d4-a716-446655440011', 'JP', 'Japão', 'Japan', '日本', 'Asia/Tokyo', 'JPY', 'ja', '+81', true),
-- South Korea
('550e8400-e29b-41d4-a716-446655440012', 'KR', 'Coreia do Sul', 'South Korea', '대한민국', 'Asia/Seoul', 'KRW', 'ko', '+82', true),
-- Australia
('550e8400-e29b-41d4-a716-446655440013', 'AU', 'Austrália', 'Australia', 'Australia', 'Australia/Sydney', 'AUD', 'en', '+61', true),
-- Turkey
('550e8400-e29b-41d4-a716-446655440014', 'TR', 'Turquia', 'Turkey', 'Türkiye', 'Europe/Istanbul', 'TRY', 'tr', '+90', true),
-- Thailand
('550e8400-e29b-41d4-a716-446655440015', 'TH', 'Tailândia', 'Thailand', 'ประเทศไทย', 'Asia/Bangkok', 'THB', 'th', '+66', true)
ON CONFLICT (code) DO NOTHING;