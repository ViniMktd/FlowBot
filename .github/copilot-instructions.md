<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# FlowBot - Sistema de Automação de Fulfillment para E-commerce Brasileiro

## Contexto do Projeto

Este é um sistema completo de automação de fulfillment especificamente projetado para o mercado brasileiro. O sistema atua como intermediário inteligente entre lojas Shopify e fornecedores locais, com comunicação automática via WhatsApp em português brasileiro.

## Arquitetura do Sistema

### Backend (Node.js/TypeScript)
- **Framework**: Express.js com TypeScript
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Cache**: Redis para cache e filas de processamento
- **Filas**: Bull Queue para processamento assíncrono
- **Autenticação**: JWT com refresh tokens
- **Logging**: Winston com rotação diária
- **Validação**: Zod para validação de schemas

### Frontend (React/TypeScript)
- **Framework**: React 18+ com TypeScript
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Data Fetching**: React Query
- **Forms**: React Hook Form com Zod
- **Real-time**: Socket.IO client

### Integrações Principais
- **Shopify**: Admin API e GraphQL para gestão de pedidos
- **WhatsApp Business API**: Comunicação automatizada com clientes
- **APIs Brasileiras**: CEP (ViaCEP), validação CPF/CNPJ, Correios

## Diretrizes de Desenvolvimento

### 1. Conformidade Brasileira
- **LGPD**: Implementar conformidade total com a Lei Geral de Proteção de Dados
- **Timezone**: Sempre usar 'America/Sao_Paulo'
- **Idioma**: Todas as mensagens e interfaces em português brasileiro
- **Moeda**: Valores sempre em Real (BRL) com formatação brasileira
- **Documentos**: Validação de CPF, CNPJ e CEP

### 2. Padrões de Código
- **TypeScript**: Usar strict mode com tipos explícitos
- **Nomenclatura**: Variáveis e funções em português quando relacionadas ao domínio brasileiro
- **Comentários**: Em português brasileiro
- **Validação**: Usar Zod para todos os schemas de validação
- **Error Handling**: Mensagens de erro em português

### 3. APIs e Comunicação
- **WhatsApp**: Templates de mensagem em português brasileiro
- **Shopify**: Seguir rate limits e melhores práticas
- **Fornecedores**: Suporte a múltiplos canais (API, email, webhook)
- **Logs**: Estruturados com contexto brasileiro (timezone, idioma)

### 4. Segurança
- **Autenticação**: JWT com refresh tokens seguros
- **Validação**: Sanitização de todos os inputs
- **Rate Limiting**: Proteção contra abuso
- **Headers**: Configurações específicas para LGPD

### 5. Performance
- **Cache**: Redis para dados frequentemente acessados
- **Filas**: Processamento assíncrono para operações demoradas
- **Database**: Índices otimizados para queries brasileiras
- **Frontend**: Lazy loading e code splitting

### 6. Monitoramento
- **Logs**: Winston com rotação e estrutura brasileira
- **Métricas**: Tracking de KPIs específicos do mercado brasileiro
- **Health Checks**: Endpoints para monitoramento
- **Errors**: Captura e alertas de erros críticos

## Exemplos de Implementação

### Mensagens WhatsApp
```typescript
const orderConfirmationTemplate = {
  pt_BR: "Olá {customerName}! Seu pedido #{orderNumber} foi confirmado e enviado para nosso fornecedor. Em breve você receberá o código de rastreamento! 📦"
};
```

### Validação de Documentos
```typescript
const cpfSchema = z.string()
  .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato 000.000.000-00')
  .refine(validateCPF, 'CPF inválido');
```

### Formatação de Valores
```typescript
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
```

### Timezone Handling
```typescript
const brazilTime = dayjs().tz('America/Sao_Paulo');
```

## Estrutura de Arquivos

### Backend
```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── models/          # Modelos Prisma
├── routes/          # Rotas Express
├── middleware/      # Middlewares customizados
├── utils/           # Utilitários e helpers
├── workers/         # Jobs de background
└── config/          # Configurações (DB, Redis, etc)
```

### Frontend
```
src/
├── components/      # Componentes reutilizáveis
├── pages/           # Páginas da aplicação
├── services/        # Chamadas de API
├── hooks/           # Custom hooks
├── store/           # Redux store e slices
├── utils/           # Utilitários
└── types/           # Definições TypeScript
```

## Boas Práticas Específicas

1. **Sempre considerar o contexto brasileiro** ao implementar funcionalidades
2. **Usar libraries específicas** para validação de documentos brasileiros
3. **Implementar rate limiting** para APIs externas (Shopify, WhatsApp)
4. **Cachear dados** que não mudam frequentemente (CEP, fornecedores)
5. **Logar operações críticas** para auditoria e compliance
6. **Tratar erros graciosamente** com mensagens em português
7. **Implementar retry logic** para integrações externas
8. **Seguir padrões LGPD** para tratamento de dados pessoais

## Configurações de Desenvolvimento

- **Editor**: VSCode com extensões TypeScript, Prisma, ESLint
- **Debugging**: Configurações para Node.js e React
- **Testing**: Jest para backend, React Testing Library para frontend
- **Linting**: ESLint com regras específicas para TypeScript
- **Formatting**: Prettier com configurações padronizadas

Mantenha sempre o foco na experiência do usuário brasileiro e na conformidade com regulamentações locais.
