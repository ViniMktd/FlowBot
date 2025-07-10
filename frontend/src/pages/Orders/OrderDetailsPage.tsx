import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Tabs,
  Tab,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Track as TrackIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import DispatchOrderDialog from '../../components/DispatchOrderDialog';

// Mock order data - em produção viria da API
const mockOrderDetails = {
  id: '1',
  numeroPedido: 'BR-001-2025',
  shopifyOrderId: '12345',
  status: 'CONFIRMADO',
  valorTotal: 259.90,
  observacoes: 'Cliente solicitou entrega expressa',
  codigoRastreamento: 'BR123456789',
  dataEntregaPrevista: '2025-01-15T00:00:00Z',
  dataCriacao: '2025-01-10T10:30:00Z',
  dataAtualizacao: '2025-01-10T11:00:00Z',
  
  cliente: {
    id: 'c1',
    nome: 'João Silva',
    email: 'joao.silva@email.com',
    telefone: '+55 11 99999-9999',
    country: 'BR',
    preferredLanguage: 'pt-BR',
    documents: {
      cpf: '123.456.789-00'
    }
  },
  
  fornecedor: {
    id: 's1',
    nome: 'Fornecedor Brasil Ltda',
    email: 'contato@fornecedorbrasil.com',
    telefone: '+55 11 88888-8888',
    country: 'BR',
    language: 'pt-BR'
  },
  
  enderecoEntrega: {
    logradouro: 'Rua das Flores, 123',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
    pais: 'Brasil'
  },
  
  items: [
    {
      id: 'i1',
      produto: {
        id: 'p1',
        nome: 'Produto Premium A',
        sku: 'SKU-001',
        descricao: 'Produto de alta qualidade',
        categoria: 'Eletrônicos'
      },
      quantidade: 2,
      precoUnitario: 129.95,
      subtotal: 259.90
    }
  ],
  
  timeline: [
    {
      id: 't1',
      evento: 'Pedido criado',
      descricao: 'Pedido recebido via Shopify',
      status: 'PENDENTE',
      dataHora: '2025-01-10T10:30:00Z',
      usuario: 'Sistema'
    },
    {
      id: 't2',
      evento: 'Pagamento confirmado',
      descricao: 'Pagamento processado com sucesso',
      status: 'CONFIRMADO',
      dataHora: '2025-01-10T11:00:00Z',
      usuario: 'Gateway de Pagamento'
    },
    {
      id: 't3',
      evento: 'Enviado para fornecedor',
      descricao: 'Pedido enviado para Fornecedor Brasil Ltda',
      status: 'PROCESSANDO',
      dataHora: '2025-01-10T11:15:00Z',
      usuario: 'Sistema'
    }
  ],
  
  comunicacoes: [
    {
      id: 'm1',
      tipo: 'whatsapp',
      destinatario: '+55 11 99999-9999',
      assunto: 'Confirmação de pedido',
      conteudo: 'Seu pedido BR-001-2025 foi confirmado!',
      dataEnvio: '2025-01-10T11:05:00Z',
      status: 'entregue'
    },
    {
      id: 'm2',
      tipo: 'email',
      destinatario: 'joao.silva@email.com',
      assunto: 'Pedido em processamento',
      conteudo: 'Seu pedido está sendo processado pelo fornecedor',
      dataEnvio: '2025-01-10T11:20:00Z',
      status: 'enviado'
    }
  ]
};

const statusConfig = {
  'PENDENTE': { color: 'warning', icon: <PendingIcon />, label: 'Pendente' },
  'CONFIRMADO': { color: 'info', icon: <PaymentIcon />, label: 'Confirmado' },
  'PROCESSANDO': { color: 'primary', icon: <RefreshIcon />, label: 'Processando' },
  'ENVIADO': { color: 'secondary', icon: <ShippingIcon />, label: 'Enviado' },
  'ENTREGUE': { color: 'success', icon: <CompletedIcon />, label: 'Entregue' },
  'CANCELADO': { color: 'error', icon: <CancelIcon />, label: 'Cancelado' }
};

// Mock API
const fetchOrderDetails = async (orderId: string) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  return mockOrderDetails;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const OrderDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const { data: order, isLoading, refetch } = useQuery(
    ['order-details', id],
    () => fetchOrderDetails(id!),
    { enabled: !!id }
  );

  const handleTabChange = (_: any, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleStatusUpdate = () => {
    if (newStatus) {
      console.log('Atualizando status para:', newStatus);
      setOpenEditDialog(false);
      refetch();
    }
  };

  const handleSendWhatsApp = () => {
    console.log('Enviando WhatsApp para:', order?.cliente.telefone);
  };

  const handleSendEmail = () => {
    console.log('Enviando email para:', order?.cliente.email);
  };

  const handleDispatchSuccess = (data: any) => {
    console.log('Pedido despachado com sucesso:', data);
    refetch();
  };

  const handleTrackOrder = () => {
    if (order?.codigoRastreamento) {
      // Implementar rastreamento
      console.log('Rastrear:', order.codigoRastreamento);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    const flags: Record<string, string> = {
      'BR': '🇧🇷',
      'CN': '🇨🇳',
      'US': '🇺🇸',
      'DE': '🇩🇪'
    };
    return flags[countryCode] || '🌐';
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  if (isLoading) {
    return (
      <Box p={3}>
        <Typography>Carregando detalhes do pedido...</Typography>
      </Box>
    );
  }

  if (!order) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Pedido não encontrado
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/pedidos')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Pedido {order.numeroPedido}
          </Typography>
          <Chip
            icon={statusConfig[order.status as keyof typeof statusConfig].icon}
            label={statusConfig[order.status as keyof typeof statusConfig].label}
            color={statusConfig[order.status as keyof typeof statusConfig].color as any}
            variant="outlined"
          />
        </Box>
        <Box display="flex" gap={1}>
          {/* Botão de Despacho - apenas para pedidos confirmados e não enviados */}
          {(order.status === 'CONFIRMADO' || order.status === 'PROCESSANDO') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<ShippingIcon />}
              onClick={() => setOpenDispatchDialog(true)}
              sx={{ mr: 1 }}
            >
              📦 Despachar Pedido
            </Button>
          )}
          
          <Tooltip title="Atualizar status">
            <IconButton 
              color="primary"
              onClick={() => setOpenEditDialog(true)}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="WhatsApp">
            <IconButton 
              color="success"
              onClick={handleSendWhatsApp}
            >
              <WhatsAppIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Email">
            <IconButton 
              color="info"
              onClick={handleSendEmail}
            >
              <EmailIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Rastrear">
            <IconButton 
              color="secondary"
              onClick={handleTrackOrder}
              disabled={!order.codigoRastreamento}
            >
              <TrackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Imprimir">
            <IconButton color="default">
              <PrintIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Informações principais */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações do Cliente
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getCountryFlag(order.cliente.country)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {order.cliente.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.cliente.country}
                  </Typography>
                </Box>
              </Box>
              <List dense>
                <ListItem>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={order.cliente.email}
                    secondary="Email"
                  />
                </ListItem>
                <ListItem>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={order.cliente.telefone}
                    secondary="Telefone"
                  />
                </ListItem>
                <ListItem>
                  <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={`${order.enderecoEntrega.logradouro}, ${order.enderecoEntrega.numero}`}
                    secondary={`${order.enderecoEntrega.cidade}, ${order.enderecoEntrega.estado}`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Fornecedor
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {getCountryFlag(order.fornecedor.country)}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {order.fornecedor.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.fornecedor.country}
                  </Typography>
                </Box>
              </Box>
              <List dense>
                <ListItem>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={order.fornecedor.email}
                    secondary="Email"
                  />
                </ListItem>
                <ListItem>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <ListItemText 
                    primary={order.fornecedor.telefone}
                    secondary="Telefone"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Resumo do Pedido
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Valor Total"
                    secondary={formatCurrency(order.valorTotal)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Data de Criação"
                    secondary={new Date(order.dataCriacao).toLocaleString('pt-BR')}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Entrega Prevista"
                    secondary={new Date(order.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                  />
                </ListItem>
                {order.codigoRastreamento && (
                  <ListItem>
                    <ListItemText 
                      primary="Código de Rastreamento"
                      secondary={
                        <Chip 
                          label={order.codigoRastreamento}
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={order.items.length} color="primary">
                  Itens
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={order.timeline.length} color="secondary">
                  Timeline
                </Badge>
              } 
            />
            <Tab 
              label={
                <Badge badgeContent={order.comunicacoes.length} color="info">
                  Comunicações
                </Badge>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab: Itens do Pedido */}
        <TabPanel value={activeTab} index={0}>
          <Typography variant="h6" gutterBottom>
            Itens do Pedido
          </Typography>
          {order.items.map((item) => (
            <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.produto.nome}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {item.produto.sku}
                  </Typography>
                  <Typography variant="body2">
                    {item.produto.descricao}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Quantidade
                  </Typography>
                  <Typography variant="h6">
                    {item.quantidade}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Preço Unitário
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(item.precoUnitario)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Typography variant="body2" color="text.secondary">
                    Subtotal
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(item.subtotal)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          ))}
          <Divider sx={{ my: 2 }} />
          <Box display="flex" justifyContent="flex-end">
            <Typography variant="h5" fontWeight="bold">
              Total: {formatCurrency(order.valorTotal)}
            </Typography>
          </Box>
        </TabPanel>

        {/* Tab: Timeline */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="h6" gutterBottom>
            Histórico do Pedido
          </Typography>
          <Timeline>
            {order.timeline.map((evento) => (
              <TimelineItem key={evento.id}>
                <TimelineSeparator>
                  <TimelineDot color={statusConfig[evento.status as keyof typeof statusConfig].color as any}>
                    {statusConfig[evento.status as keyof typeof statusConfig].icon}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" component="h6">
                      {evento.evento}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {evento.descricao}
                    </Typography>
                    <Typography variant="caption" display="block" mt={1}>
                      {new Date(evento.dataHora).toLocaleString('pt-BR')} • {evento.usuario}
                    </Typography>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </TabPanel>

        {/* Tab: Comunicações */}
        <TabPanel value={activeTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Histórico de Comunicações
          </Typography>
          {order.comunicacoes.map((comunicacao) => (
            <Paper key={comunicacao.id} sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {comunicacao.tipo === 'whatsapp' ? <WhatsAppIcon color="success" /> : <EmailIcon color="info" />}
                <Typography variant="subtitle1" fontWeight="bold">
                  {comunicacao.assunto}
                </Typography>
                <Chip 
                  label={comunicacao.status} 
                  size="small" 
                  color={comunicacao.status === 'entregue' ? 'success' : 'default'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" mb={1}>
                Para: {comunicacao.destinatario}
              </Typography>
              <Typography variant="body2" mb={1}>
                {comunicacao.conteudo}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enviado em: {new Date(comunicacao.dataEnvio).toLocaleString('pt-BR')}
              </Typography>
            </Paper>
          ))}
        </TabPanel>
      </Card>

      {/* Dialog para editar status */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Atualizar Status do Pedido
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            select
            label="Novo Status"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            margin="normal"
          >
            {Object.entries(statusConfig).map(([status, config]) => (
              <MenuItem key={status} value={status}>
                <Box display="flex" alignItems="center" gap={1}>
                  {config.icon}
                  {config.label}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStatusUpdate}
            disabled={!newStatus}
          >
            Atualizar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Despacho */}
      <DispatchOrderDialog
        open={openDispatchDialog}
        orderId={order?.id || ''}
        orderNumber={order?.numeroPedido || ''}
        customerName={order?.cliente.nome || ''}
        totalValue={order?.valorTotal || 0}
        onClose={() => setOpenDispatchDialog(false)}
        onSuccess={handleDispatchSuccess}
      />
    </Box>
  );
};