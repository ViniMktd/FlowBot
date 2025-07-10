# Use Node.js 18 Alpine como base
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache git

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Stage de desenvolvimento
FROM base AS development

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento
CMD ["npm", "start"]

# Stage de build
FROM base AS build

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação React
RUN npm run build

# Stage de produção com nginx
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar configuração customizada do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build da aplicação React
COPY --from=build /app/build /usr/share/nginx/html

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx
RUN adduser -S flowbot -u 1001 -G nginx

# Configurar permissões
RUN chown -R flowbot:nginx /usr/share/nginx/html
RUN chown -R flowbot:nginx /var/cache/nginx
RUN chown -R flowbot:nginx /var/log/nginx
RUN chown -R flowbot:nginx /etc/nginx/conf.d

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expor porta
EXPOSE 80

# Usar usuário não-root
USER flowbot

# Comando para produção
CMD ["nginx", "-g", "daemon off;"]
