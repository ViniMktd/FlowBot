#!/bin/bash

# Script de setup inicial para o FlowBot
echo "🚀 Configurando FlowBot - Sistema de Automação de Fulfillment para E-commerce Brasileiro"

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[FlowBot]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    log "Verificando dependências do sistema..."

    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado. Instale Node.js 18+ para continuar."
        exit 1
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js versão 18+ é necessária. Versão atual: $(node -v)"
        exit 1
    fi

    # Docker
    if ! command -v docker &> /dev/null; then
        warning "Docker não encontrado. Docker é recomendado para desenvolvimento."
    fi

    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        warning "Docker Compose não encontrado. Docker Compose é recomendado para desenvolvimento."
    fi

    log "✅ Dependências verificadas"
}

# Criar arquivos de configuração
setup_config() {
    log "Configurando arquivos de ambiente..."

    # Backend .env
    if [ ! -f "backend/.env" ]; then
        cp backend/.env.example backend/.env
        info "Arquivo backend/.env criado. Configure suas variáveis de ambiente."
    fi

    # Frontend .env
    if [ ! -f "frontend/.env" ]; then
        cp frontend/.env.example frontend/.env
        info "Arquivo frontend/.env criado."
    fi

    log "✅ Configuração concluída"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências..."

    # Root
    npm install --legacy-peer-deps

    log "✅ Dependências instaladas"
}

# Configurar banco de dados
setup_database() {
    log "Configurando banco de dados..."

    # Gerar cliente Prisma
    cd backend
    npx prisma generate
    cd ..

    log "✅ Cliente Prisma gerado"

    info "Para aplicar migrations, execute: npm run prisma:migrate"
}

# Criar estrutura de diretórios
create_directories() {
    log "Criando estrutura de diretórios..."

    mkdir -p backend/logs
    mkdir -p backend/uploads
    mkdir -p frontend/public/assets

    log "✅ Diretórios criados"
}

# Função principal
main() {
    log "Iniciando setup do FlowBot..."

    check_dependencies
    setup_config
    install_dependencies
    setup_database
    create_directories

    echo ""
    log "🎉 Setup concluído com sucesso!"
    echo ""
    info "Próximos passos:"
    echo "1. Configure as variáveis de ambiente em backend/.env"
    echo "2. Inicie os serviços Docker: npm run docker:up"
    echo "3. Execute as migrations: npm run prisma:migrate"
    echo "4. Inicie o desenvolvimento: npm run dev"
    echo ""
    info "Documentação: README.md"
    info "Suporte: Entre em contato com a equipe de desenvolvimento"
    echo ""
}

# Executar função principal
main
