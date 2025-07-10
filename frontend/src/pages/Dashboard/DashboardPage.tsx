import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Alert,
  RefreshIcon,
  Skeleton,
  useTheme,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as OrdersIcon,
  AttachMoney as RevenueIcon,
  People as CustomersIcon,
  Business as SuppliersIcon,
  Notifications as AlertsIcon,
  Schedule as PendingIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompletedIcon,
  Refresh as RefreshIconMui,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock API functions (em produção seriam chamadas reais)
const fetchDashboardData = async () => {
  // Simulação de dados do dashboard
  return {
    metrics: {
      orders: {
        total: 1247,
        today: 23,
        week: 156,
        month: 342,
        growthDaily: 15.8
      },
      revenue: {
        total: 487659.50,
        today: 8934.20,
        month: 89456.30
      },
      customers: {
        total: 892
      },
      suppliers: {
        total: 45,
        active: 38
      }
    },
    orderStatus: [
      { status: 'PENDENTE', count: 12, percentage: 12.5 },
      { status: 'CONFIRMADO', count: 25, percentage: 26.0 },
      { status: 'PROCESSANDO', count: 18, percentage: 18.8 },
      { status: 'ENVIADO', count: 28, percentage: 29.2 },
      { status: 'ENTREGUE', count: 13, percentage: 13.5 }
    ],
    recentActivity: {
      orders: [
        {
          id: '1',
          numeroPedido: 'BR-001-2025',
          clienteNome: 'João Silva',
          clienteCountry: 'BR',
          fornecedorNome: 'Fornecedor Brasil',
          valorTotal: 259.90,
          status: 'CONFIRMADO',
          dataCriacao: new Date().toISOString()
        },
        {
          id: '2',
          numeroPedido: 'CN-002-2025',
          clienteNome: 'Li Wei',
          clienteCountry: 'CN',
          fornecedorNome: 'Shenzhen Electronics',
          valorTotal: 489.50,
          status: 'PROCESSANDO',
          dataCriacao: new Date(Date.now() - 3600000).toISOString()
        }
      ]
    },
    alerts: {
      pendingOrders: 12,
      delayedOrders: 3,
      lowStockProducts: 5
    },
    lastUpdated: new Date().toISOString()
  };
};

const fetchOrderTrends = async () => {
  // Dados simulados para gráfico de tendências
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toLocaleDateString('pt-BR'),
      orders: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000
    });
  }
  return last7Days;
};

// Cores para os status
const statusColors = {
  'PENDENTE': '#ff9800',
  'CONFIRMADO': '#2196f3',
  'PROCESSANDO': '#9c27b0',
  'ENVIADO': '#00bcd4',
  'ENTREGUE': '#4caf50'
};

// Componente de métrica
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  growth?: number;
  subtitle?: string;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  growth, 
  subtitle, 
  color = 'primary' 
}) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h4" component="div" fontWeight="bold">
              {typeof value === 'number' && title.includes('R$') 
                ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : value.toLocaleString()}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {growth !== undefined && (
              <Box display="flex" alignItems="center" mt={1}>
                {growth >= 0 ? (
                  <TrendingUpIcon color="success" fontSize="small" />
                ) : (
                  <TrendingDownIcon color="error" fontSize="small" />
                )}
                <Typography 
                  variant="body2" 
                  color={growth >= 0 ? 'success.main' : 'error.main'}
                  ml={0.5}
                >
                  {Math.abs(growth)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar 
            sx={{ 
              bgcolor: alpha(theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main, 0.1),
              color: theme.palette[color as keyof typeof theme.palette].main || theme.palette.primary.main,
              width: 56,
              height: 56
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Queries para buscar dados
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    refetch: refetchDashboard 
  } = useQuery('dashboard', fetchDashboardData, {
    refetchInterval: 60000, // Atualizar a cada minuto
    staleTime: 30000 // Dados são considerados frescos por 30 segundos
  });

  const { 
    data: trendsData, 
    isLoading: trendsLoading 
  } = useQuery('order-trends', fetchOrderTrends, {
    refetchInterval: 300000 // Atualizar a cada 5 minutos
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchDashboard();
    setRefreshing(false);
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

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'PENDENTE': 'Pendente',
      'CONFIRMADO': 'Confirmado',
      'PROCESSANDO': 'Processando',
      'ENVIADO': 'Enviado',
      'ENTREGUE': 'Entregue'
    };
    return labels[status] || status;
  };

  if (dashboardLoading) {
    return (
      <Box p={3}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={40} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          📊 {t('dashboard.title')}
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <LanguageSelector variant="chip" />
          <Tooltip title="Atualizar dados">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              color="primary"
            >
              <RefreshIconMui className={refreshing ? 'animate-spin' : ''} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Alertas */}
      {dashboardData?.alerts && (
        <Box mb={3}>
          {dashboardData.alerts.pendingOrders > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 1 }}
              action={
                <Chip 
                  label={dashboardData.alerts.pendingOrders} 
                  size="small" 
                  color="warning" 
                />
              }
            >
              Existem pedidos pendentes que precisam de atenção
            </Alert>
          )}
          {dashboardData.alerts.delayedOrders > 0 && (
            <Alert 
              severity="error" 
              sx={{ mb: 1 }}
              action={
                <Chip 
                  label={dashboardData.alerts.delayedOrders} 
                  size="small" 
                  color="error" 
                />
              }
            >
              Pedidos com atraso na entrega
            </Alert>
          )}
        </Box>
      )}

      {/* Métricas Principais */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Pedidos"
            value={dashboardData?.metrics.orders.total || 0}
            icon={<OrdersIcon />}
            growth={dashboardData?.metrics.orders.growthDaily}
            subtitle={`${dashboardData?.metrics.orders.today || 0} hoje`}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Receita Total"
            value={dashboardData?.metrics.revenue.total || 0}
            icon={<RevenueIcon />}
            subtitle={`R$ ${(dashboardData?.metrics.revenue.today || 0).toLocaleString()} hoje`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Clientes"
            value={dashboardData?.metrics.customers.total || 0}
            icon={<CustomersIcon />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Fornecedores"
            value={dashboardData?.metrics.suppliers.active || 0}
            icon={<SuppliersIcon />}
            subtitle={`de ${dashboardData?.metrics.suppliers.total || 0} total`}
            color="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Gráfico de Tendências */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Tendência de Pedidos (Últimos 7 dias)
              </Typography>
              {trendsLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="orders" fill="#2196f3" name="Pedidos" />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#4caf50" 
                      strokeWidth={3}
                      name="Receita (R$)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Status dos Pedidos */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Status dos Pedidos
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dashboardData?.orderStatus || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percentage }) => `${getStatusLabel(status)}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {dashboardData?.orderStatus?.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={statusColors[entry.status as keyof typeof statusColors]} 
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Atividade Recente */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🕒 Pedidos Recentes
              </Typography>
              <List>
                {dashboardData?.recentActivity.orders.map((order, index) => (
                  <ListItem key={order.id} divider={index < dashboardData.recentActivity.orders.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: statusColors[order.status as keyof typeof statusColors] }}>
                        {getCountryFlag(order.clienteCountry)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {order.numeroPedido}
                          </Typography>
                          <Chip 
                            label={getStatusLabel(order.status)} 
                            size="small" 
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {order.clienteNome} • {order.fornecedorNome}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {order.valorTotal.toLocaleString('pt-BR', { 
                              style: 'currency', 
                              currency: 'BRL' 
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Rápido */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ Status Rápido
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                    <PendingIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {dashboardData?.alerts.pendingOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pendentes
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                    <ShippingIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {dashboardData?.orderStatus?.find(s => s.status === 'ENVIADO')?.count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enviados
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                    <CompletedIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {dashboardData?.orderStatus?.find(s => s.status === 'ENTREGUE')?.count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Entregues
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                    <AlertsIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      {dashboardData?.alerts.delayedOrders || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Atrasados
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer com informações de atualização */}
      <Box mt={3} textAlign="center">
        <Typography variant="caption" color="text.secondary">
          Última atualização: {dashboardData?.lastUpdated 
            ? new Date(dashboardData.lastUpdated).toLocaleString('pt-BR')
            : 'Carregando...'
          }
        </Typography>
      </Box>
    </Box>
  );
};