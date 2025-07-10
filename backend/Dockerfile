# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependências do sistema necessárias
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Stage de desenvolvimento
FROM base AS development

# Instalar todas as dependências (incluindo dev)
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Expor porta
EXPOSE 3001

# Comando para desenvolvimento
CMD ["npm", "run", "dev"]

# Stage de build
FROM base AS build

# Instalar todas as dependências para build
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar cliente Prisma
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Stage de produção
FROM node:18-alpine AS production

# Instalar dependências do sistema para produção
RUN apk add --no-cache \
    dumb-init \
    curl

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S flowbot -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Copiar build da aplicação
COPY --from=build --chown=flowbot:nodejs /app/dist ./dist
COPY --from=build --chown=flowbot:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Criar diretórios necessários
RUN mkdir -p logs uploads && chown -R flowbot:nodejs logs uploads

# Configurar usuário
USER flowbot

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Expor porta
EXPOSE 3001

# Usar dumb-init para signal handling
ENTRYPOINT ["dumb-init", "--"]

# Comando para produção
CMD ["node", "dist/index.js"]
