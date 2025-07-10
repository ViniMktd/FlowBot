# 📦 **API DE DESPACHO AUTOMÁTICO - EXEMPLO DE USO**

## 🎯 **Endpoint Principal**

```
POST /api/shipping/order/:orderId/dispatch
```

## 🔐 **Autenticação**
```
Authorization: Bearer <jwt_token>
Roles: USER (Supplier), MANAGER, ADMIN
```

## 📋 **Request Body**
```json
{
  "trackingCode": "BR123456789",
  "carrier": "Correios",
  "estimatedDelivery": "2025-01-20",
  "notes": "Entrega expressa - cuidado frágil"
}
```

## ✅ **Response Success (200)**
```json
{
  "success": true,
  "message": "Pedido despachado com sucesso! Cliente será notificado automaticamente.",
  "data": {
    "orderId": "1",
    "orderNumber": "FLW-001",
    "trackingCode": "BR123456789",
    "carrier": "Correios",
    "dispatchedAt": "2025-01-10T14:30:00.000Z",
    "shopifyFulfilled": true,
    "customerNotified": true,
    "estimatedDelivery": "2025-01-20"
  }
}
```

## ❌ **Response Error (400/500)**
```json
{
  "success": false,
  "message": "Código de rastreamento é obrigatório",
  "error": "VALIDATION_ERROR"
}
```

---

## 🚀 **O QUE ACONTECE AUTOMATICAMENTE**

### **1. SHOPIFY FULFILLMENT**
```javascript
// Criado automaticamente no Shopify:
{
  "fulfillment": {
    "order_id": 12345678901234,
    "status": "success",
    "tracking_number": "BR123456789",
    "tracking_company": "Correios",
    "tracking_urls": ["https://www2.correios.com.br/..."],
    "notify_customer": true  // Shopify envia email automático
  }
}
```

### **2. WHATSAPP AUTOMÁTICO**
```
🚀 Seu pedido foi enviado!

📦 Pedido: FLW-001
🚚 Transportadora: Correios
📋 Código de Rastreamento: BR123456789
💰 Total: R$ 259.90
📅 Previsão de Entrega: 20/01/2025

🔗 Rastreie seu pedido: https://www2.correios.com.br/...

Obrigado pela preferência! 🛍️
```

### **3. STATUS UPDATES**
- ✅ Pedido local: `CONFIRMADO` → `ENVIADO`
- ✅ Shopify: `unfulfilled` → `fulfilled`
- ✅ Cliente: Notificado via email + WhatsApp
- ✅ Dashboard: Evento em tempo real via WebSocket

---

## 📱 **EXEMPLO DE USO NO FRONTEND**

### **Componente React:**
```tsx
import DispatchOrderDialog from '../components/DispatchOrderDialog';

// No componente:
const [openDispatch, setOpenDispatch] = useState(false);

// JSX:
{order.status === 'CONFIRMADO' && (
  <Button 
    onClick={() => setOpenDispatch(true)}
    startIcon={<LocalShipping />}
  >
    📦 Despachar Pedido
  </Button>
)}

<DispatchOrderDialog
  open={openDispatch}
  orderId={order.id}
  orderNumber={order.numeroPedido}
  customerName={order.cliente.nome}
  totalValue={order.valorTotal}
  onClose={() => setOpenDispatch(false)}
  onSuccess={(data) => {
    console.log('Despachado:', data);
    refetchOrder();
  }}
/>
```

### **API Call Direto:**
```typescript
const dispatchOrder = async (orderId: string, data: any) => {
  const response = await fetch(`/api/shipping/order/${orderId}/dispatch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      trackingCode: 'BR123456789',
      carrier: 'Correios',
      estimatedDelivery: '2025-01-20',
      notes: 'Entrega expressa'
    }),
  });

  const result = await response.json();
  console.log('Resultado:', result);
};
```

---

## 🌍 **SUPORTE INTERNACIONAL**

### **Mensagens por Idioma:**
```typescript
// Português (BR)
"🚀 Seu pedido foi enviado!"

// English (US)
"🚀 Your order has been shipped!"

// 中文 (CN)
"🚀 您的订单已发货！"
```

### **Transportadoras Suportadas:**
- 📮 **Correios** (Brasil)
- 🇨🇳 **China Post** (China)
- 🚀 **DHL Express** (Internacional)
- 📦 **FedEx** (Internacional)
- 🚚 **UPS** (Internacional)

---

## 📊 **LOGS GERADOS**

```json
{
  "level": "info",
  "message": "Pedido despachado com sucesso",
  "orderId": "1",
  "trackingCode": "BR123456789",
  "carrier": "Correios",
  "shopifyOrderId": "12345678901234",
  "shopifyFulfilled": true,
  "customerNotified": true,
  "timestamp": "2025-01-10T14:30:00.000Z"
}
```

---

## 🔧 **CONFIGURAÇÃO NECESSÁRIA**

### **Variáveis de Ambiente:**
```env
# Shopify
SHOPIFY_SHOP=minha-loja.myshopify.com
SHOPIFY_ACCESS_TOKEN=shpat_xxxxx
SHOPIFY_API_KEY=xxxxx
SHOPIFY_API_SECRET=xxxxx

# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=xxxxx
WHATSAPP_ACCESS_TOKEN=xxxxx

# Backend
BACKEND_URL=https://api.flowbot.com
FRONTEND_URL=https://app.flowbot.com
```

---

## ✅ **RESULTADO FINAL**

**Uma ação simples do fornecedor:**
1. 👤 Fornecedor clica "Despachar Pedido"
2. ✍️ Preenche código de rastreamento
3. 🔄 Sistema faz TUDO automaticamente

**Cliente recebe:**
- 📧 Email automático do Shopify
- 📱 WhatsApp automático do FlowBot
- 🔗 Links de rastreamento funcionais
- 📊 Status atualizado na loja

**Zero trabalho manual!** 🎉