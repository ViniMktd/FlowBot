import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Badge,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  WhatsApp as WhatsAppIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock data para pedidos
const mockOrders = [
  {
    id: '1',
    numeroPedido: 'BR-001-2025',
    shopifyOrderId: '12345',
    cliente: {
      nome: 'João Silva',
      email: 'joao@email.com',
      telefone: '+55 11 99999-9999',
      country: 'BR'
    },
    fornecedor: {
      nome: 'Fornecedor Brasil',
      country: 'BR'
    },
    status: 'CONFIRMADO',
    valorTotal: 259.90,
    items: [
      {
        produto: { nome: 'Produto A', sku: 'SKU-001' },
        quantidade: 2,
        precoUnitario: 129.95
      }
    ],
    enderecoEntrega: {
      logradouro: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      pais: 'Brasil'
    },
    codigoRastreamento: null,
    dataEntregaPrevista: '2025-01-15',
    dataCriacao: '2025-01-10T10:30:00Z',
    dataAtualizacao: '2025-01-10T11:00:00Z'
  },
  {
    id: '2', 
    numeroPedido: 'CN-002-2025',
    shopifyOrderId: '12346',
    cliente: {
      nome: 'Li Wei',
      email: 'liwei@email.com',
      telefone: '+86 138 8888 8888',
      country: 'CN'
    },
    fornecedor: {
      nome: 'Shenzhen Electronics',
      country: 'CN'
    },
    status: 'PROCESSANDO',
    valorTotal: 489.50,
    items: [
      {
        produto: { nome: 'Electronic Component', sku: 'SKU-002' },
        quantidade: 10,
        precoUnitario: 48.95
      }
    ],
    enderecoEntrega: {
      logradouro: 'Futian District, 1001',
      cidade: 'Shenzhen',
      estado: 'Guangdong',
      pais: 'China'
    },
    codigoRastreamento: 'CN123456789',
    dataEntregaPrevista: '2025-01-20',
    dataCriacao: '2025-01-09T14:20:00Z',
    dataAtualizacao: '2025-01-10T09:15:00Z'
  },
  {
    id: '3',
    numeroPedido: 'US-003-2025', 
    shopifyOrderId: '12347',
    cliente: {
      nome: 'John Smith',
      email: 'john@email.com',
      telefone: '+1 555 123-4567',
      country: 'US'
    },
    fornecedor: {
      nome: 'US Supplier Inc',
      country: 'US'
    },
    status: 'ENVIADO',
    valorTotal: 750.00,
    items: [
      {
        produto: { nome: 'American Product', sku: 'SKU-003' },
        quantidade: 3,
        precoUnitario: 250.00
      }
    ],
    enderecoEntrega: {
      logradouro: '123 Main Street',
      cidade: 'New York',
      estado: 'NY',
      pais: 'USA'
    },
    codigoRastreamento: 'US987654321',
    dataEntregaPrevista: '2025-01-12',
    dataCriacao: '2025-01-08T16:45:00Z',
    dataAtualizacao: '2025-01-10T08:30:00Z'
  }
];

// Status mapping
const statusConfig = {
  'PENDENTE': { 
    color: 'warning', 
    icon: <PendingIcon />, 
    label: 'Pendente',
    bg: '#fff3e0'
  },
  'CONFIRMADO': { 
    color: 'info', 
    icon: <PaymentIcon />, 
    label: 'Confirmado',
    bg: '#e3f2fd'
  },
  'PROCESSANDO': { 
    color: 'primary', 
    icon: <RefreshIcon />, 
    label: 'Processando',
    bg: '#f3e5f5'
  },
  'ENVIADO': { 
    color: 'secondary', 
    icon: <ShippingIcon />, 
    label: 'Enviado',
    bg: '#e0f2f1'
  },
  'ENTREGUE': { 
    color: 'success', 
    icon: <CompletedIcon />, 
    label: 'Entregue',
    bg: '#e8f5e8'
  },
  'CANCELADO': { 
    color: 'error', 
    icon: <CancelIcon />, 
    label: 'Cancelado',
    bg: '#ffebee'
  }
};

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
];

// Mock API
const fetchOrders = async (filters: any) => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  let filteredOrders = [...mockOrders];
  
  if (filters.status) {
    filteredOrders = filteredOrders.filter(order => order.status === filters.status);
  }
  
  if (filters.country) {
    filteredOrders = filteredOrders.filter(order => order.cliente.country === filters.country);
  }
  
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    filteredOrders = filteredOrders.filter(order => 
      order.numeroPedido.toLowerCase().includes(searchTerm) ||
      order.cliente.nome.toLowerCase().includes(searchTerm) ||
      order.cliente.email.toLowerCase().includes(searchTerm)
    );
  }
  
  return {
    orders: filteredOrders,
    total: filteredOrders.length,
    page: filters.page || 1,
    limit: filters.limit || 10
  };
};

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    country: '',
    search: '',
    page: 1,
    limit: 10
  });

  // Query para buscar pedidos
  const { 
    data: ordersData, 
    isLoading, 
    refetch,
    isFetching 
  } = useQuery(
    ['orders', filters], 
    () => fetchOrders(filters),
    {
      keepPreviousData: true,
      staleTime: 30000 // 30 segundos
    }
  );

  const handleViewOrder = (order: any) => {
    navigate(`/pedidos/${order.id}`);
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleDeleteOrder = (order: any) => {
    if (window.confirm(`Deseja realmente excluir o pedido ${order.numeroPedido}?`)) {
      // Implementar exclusão
      console.log('Excluindo pedido:', order.id);
    }
  };

  const handleSendWhatsApp = (order: any) => {
    // Implementar envio de WhatsApp
    console.log('Enviando WhatsApp para:', order.cliente.telefone);
  };

  const handleSendEmail = (order: any) => {
    // Implementar envio de email
    console.log('Enviando email para:', order.cliente.email);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (_: any, page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      country: '',
      search: '',
      page: 1,
      limit: 10
    });
  };

  const getCountryFlag = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country?.flag || '🌐';
  };

  const formatCurrency = (value: number, countryCode: string) => {
    const currencyMap: Record<string, string> = {
      'BR': 'BRL',
      'US': 'USD',
      'CN': 'CNY',
      'DE': 'EUR',
    };
    
    const currency = currencyMap[countryCode] || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          📦 {t('orders.title')}
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <LanguageSelector variant="chip" />
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => console.log('Exportar')}
          >
            Exportar
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => console.log('Novo pedido')}
            size="large"
          >
            Novo Pedido
          </Button>
        </Box>
      </Box>

      {/* Loading indicator */}
      {isFetching && <LinearProgress sx={{ mb: 2 }} />}

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Buscar pedidos"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                size="small"
                placeholder="Número, cliente, email..."
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <MenuItem key={status} value={status}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {config.icon}
                        {config.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>País</InputLabel>
                <Select
                  value={filters.country}
                  label="País"
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {countries.map(country => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.flag} {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="outlined"
                onClick={clearFilters}
                fullWidth
                startIcon={<FilterIcon />}
              >
                Limpar
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={() => refetch()}
                fullWidth
                startIcon={<RefreshIcon />}
                disabled={isFetching}
              >
                Atualizar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estatísticas rápidas */}
      <Grid container spacing={2} mb={3}>
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = ordersData?.orders.filter((order: any) => order.status === status).length || 0;
          return (
            <Grid item xs={6} sm={4} md={2} key={status}>
              <Paper 
                sx={{ 
                  p: 2, 
                  textAlign: 'center', 
                  bgcolor: config.bg,
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
                onClick={() => handleFilterChange('status', status)}
              >
                <Badge badgeContent={count} color={config.color as any} max={99}>
                  {config.icon}
                </Badge>
                <Typography variant="caption" display="block" mt={1}>
                  {config.label}
                </Typography>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabela de Pedidos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Pedido</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Fornecedor</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Entrega</TableCell>
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  {[...Array(8)].map((_, cellIndex) => (
                    <TableCell key={cellIndex}>
                      <Box sx={{ bgcolor: 'grey.200', height: 20, borderRadius: 1 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : ordersData?.orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Alert severity="info">
                    Nenhum pedido encontrado com os filtros aplicados
                  </Alert>
                </TableCell>
              </TableRow>
            ) : (
              ordersData?.orders.map((order: any) => (
                <TableRow key={order.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {order.numeroPedido}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Shopify: {order.shopifyOrderId}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {getCountryFlag(order.cliente.country)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {order.cliente.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {order.cliente.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {getCountryFlag(order.fornecedor.country)} {order.fornecedor.nome}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusConfig[order.status as keyof typeof statusConfig].icon}
                      label={statusConfig[order.status as keyof typeof statusConfig].label}
                      color={statusConfig[order.status as keyof typeof statusConfig].color as any}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.valorTotal, order.cliente.country)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.items.length} {order.items.length === 1 ? 'item' : 'itens'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(order.dataCriacao).toLocaleDateString('pt-BR')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.dataCriacao).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(order.dataEntregaPrevista).toLocaleDateString('pt-BR')}
                    </Typography>
                    {order.codigoRastreamento && (
                      <Chip
                        label={order.codigoRastreamento}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" gap={0.5}>
                      <Tooltip title="Visualizar">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleViewOrder(order)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEditOrder(order)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="WhatsApp">
                        <IconButton 
                          size="small" 
                          color="success"
                          onClick={() => handleSendWhatsApp(order)}
                        >
                          <WhatsAppIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Email">
                        <IconButton 
                          size="small" 
                          color="info"
                          onClick={() => handleSendEmail(order)}
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteOrder(order)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginação */}
      {ordersData && ordersData.total > 0 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={Math.ceil(ordersData.total / filters.limit)}
            page={filters.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Dialog para editar pedido */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Editar Pedido: {selectedOrder?.numeroPedido}
        </DialogTitle>
        <DialogContent>
          {/* Formulário de edição será implementado aqui */}
          <Typography>
            Formulário de edição de pedido em desenvolvimento...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button variant="contained">
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};