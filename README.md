# 🤖 **FlowBot - Sistema de Fulfillment Internacional**

Sistema completo de fulfillment para e-commerce com automação total do processo de pedidos, desde a recepção até a entrega final.

## 🎯 **Visão Geral**

O FlowBot é uma plataforma completa que automatiza todo o fluxo de e-commerce internacional:

- 🛍️ **Integração Shopify** - Sincronização automática de pedidos
- 💳 **Gateway MercadoPago** - PIX, cartão, checkout completo
- 📦 **APIs Correios** - Cálculo de frete e rastreamento
- 💬 **Comunicação WhatsApp** - Notificações automáticas
- 🌍 **Suporte Internacional** - PT-BR, EN, ZH-CN
- 📊 **Analytics Avançado** - Dashboard em tempo real

## ✨ **Funcionalidades Principais**

### 🔄 **Automação Completa**
- ✅ Recepção automática de pedidos do Shopify
- ✅ Despacho automatizado com fulfillment
- ✅ Notificações email + WhatsApp simultâneas
- ✅ Rastreamento automático de encomendas
- ✅ Atualizações de status em tempo real

### 🌐 **Integrações Reais**
- 🛍️ **Shopify API 2024-01** - Webhooks + Fulfillment
- 💳 **MercadoPago** - PIX, Cartão, Checkout Pro
- 📦 **Correios + China Post** - Frete e rastreamento
- 💬 **WhatsApp Business API** - Mensagens automáticas

### 📱 **Interface Moderna**
- ⚡ React + TypeScript + Material-UI
- 📊 Dashboard com métricas em tempo real
- 🔍 Analytics avançado com gráficos
- 💬 Central de comunicações unificada
- 🌍 Suporte a múltiplos idiomas

## 🚀 **Como Funciona - Despacho Automático**

```
1. 🛒 Cliente compra no Shopify
2. 📨 Shopify envia webhook para FlowBot
3. 💾 FlowBot sincroniza pedido no sistema
4. 📢 Fornecedor recebe notificação
5. 📦 Fornecedor clica "Despachar Pedido"
6. 🔄 FlowBot automaticamente:
   - Cria fulfillment no Shopify
   - Shopify envia email para cliente
   - FlowBot envia WhatsApp personalizado
   - Status atualizado em tempo real
```

**Zero trabalho manual!** ⚡

## 🛠️ **Tecnologias**

### **Backend:**
- 🟦 **Node.js + TypeScript**
- ⚡ **Express.js**
- 🗄️ **PostgreSQL + Prisma**
- 📮 **Redis + Bull**
- 🔐 **JWT + bcrypt**

### **Frontend:**
- ⚛️ **React 18 + TypeScript**
- 🎨 **Material-UI v5**
- 🔄 **React Query**
- 📊 **Recharts**
- 🌐 **React i18next**

## 📁 **Estrutura do Projeto**

```
FlowBot/
├── 📁 backend/                 # API Node.js + TypeScript
│   ├── 📁 src/
│   │   ├── 📁 controllers/     # Controllers REST
│   │   ├── 📁 services/        # Integrações (Shopify, MercadoPago, etc)
│   │   ├── 📁 routes/          # Rotas da API
│   │   ├── 📁 workers/         # Jobs assíncronos
│   │   └── 📁 middleware/      # Auth, CORS, Rate limiting
│   └── 📄 package.json
├── 📁 frontend/                # React + TypeScript
│   ├── 📁 src/
│   │   ├── 📁 pages/           # Páginas principais
│   │   ├── 📁 components/      # Componentes reutilizáveis
│   │   ├── 📁 layouts/         # Layouts da aplicação
│   │   └── 📁 services/        # APIs e integrações
│   └── 📄 package.json
└── 📄 README.md
```

## 🚦 **Instalação**

### **1. Clone o repositório:**
```bash
git clone https://github.com/yago16x/FlowBot.git
cd FlowBot
```

### **2. Backend Setup:**
```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente
npm run dev
```

### **3. Frontend Setup:**
```bash
cd frontend
npm install
npm start
```

## ⚙️ **Configuração**

### **Variáveis de Ambiente:**
```env
# Shopify
SHOPIFY_SHOP=sua-loja.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_API_KEY=xxxxx

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/flowbot
```

## 🔧 **API Principal - Despacho Automático**

### **Endpoint de Despacho:**
```http
POST /api/shipping/order/:orderId/dispatch
```

### **Request:**
```json
{
  "trackingCode": "BR123456789",
  "carrier": "Correios",
  "estimatedDelivery": "2025-01-20",
  "notes": "Entrega expressa"
}
```

### **Response:**
```json
{
  "success": true,
  "message": "Pedido despachado com sucesso! Cliente será notificado automaticamente.",
  "data": {
    "orderId": "1",
    "trackingCode": "BR123456789",
    "shopifyFulfilled": true,
    "customerNotified": true
  }
}
```

## 📊 **Features Implementadas**

### ✅ **Backend Completo:**
- 8 Controllers principais
- 5 Services de integração
- 3 Workers para jobs assíncronos
- Sistema de rotas completo
- Middleware de segurança

### ✅ **Frontend Funcional:**
- Dashboard com métricas
- Sistema de pedidos completo
- Analytics avançado
- Central de comunicações
- Layout responsivo

### ✅ **Integrações Reais:**
- Shopify API + Webhooks
- MercadoPago PIX + Cartão
- Correios frete + rastreamento
- WhatsApp Business API

## 🌍 **Suporte Internacional**

### **Idiomas:**
- 🇧🇷 **Português** (Brasil)
- 🇺🇸 **English** (Estados Unidos)
- 🇨🇳 **中文** (China)

### **Detecção Automática:**
- Por país do cliente
- Mensagens personalizadas
- Timezones corretos
- Moedas locais

## 🎯 **Status do Projeto**

### ✅ **Implementado (80%):**
- Backend completo com integrações
- Frontend funcional
- Despacho automático
- Comunicações internacionais

### 🔄 **Em Desenvolvimento (20%):**
- Database schema
- Autenticação de produção
- Testes automatizados
- Deploy e infraestrutura

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 👨‍💻 **Autor**

**Yago Vinícius** - [@yago16x](https://github.com/yago16x)

---

⭐ **Se este projeto te ajudou, deixe uma estrela!** ⭐
