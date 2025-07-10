import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  ShoppingCart,
  AttachMoney,
  Business,
  Timeline,
  PieChart,
  BarChart,
  Assessment,
  Download,
  Refresh,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from 'react-query';
import { useTranslation } from 'react-i18next';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Mock data for demonstration
const salesData = [
  { month: 'Jan', vendas: 45000, pedidos: 120, clientes: 85 },
  { month: 'Fev', vendas: 52000, pedidos: 135, clientes: 95 },
  { month: 'Mar', vendas: 48000, pedidos: 125, clientes: 88 },
  { month: 'Abr', vendas: 61000, pedidos: 160, clientes: 110 },
  { month: 'Mai', vendas: 58000, pedidos: 148, clientes: 102 },
  { month: 'Jun', vendas: 71000, pedidos: 185, clientes: 128 },
];

const countryData = [
  { country: 'Brasil', value: 65, color: '#0088FE' },
  { country: 'EUA', value: 20, color: '#00C49F' },
  { country: 'China', value: 10, color: '#FFBB28' },
  { country: 'Alemanha', value: 5, color: '#FF8042' },
];

const supplierPerformance = [
  { nome: 'Fornecedor A', pedidos: 45, prazoMedio: 3.2, qualidade: 4.8 },
  { nome: 'Fornecedor B', pedidos: 38, prazoMedio: 2.8, qualidade: 4.6 },
  { nome: 'Fornecedor C', pedidos: 32, prazoMedio: 4.1, qualidade: 4.4 },
  { nome: 'Fornecedor D', pedidos: 28, prazoMedio: 3.7, qualidade: 4.7 },
];

const topProducts = [
  { produto: 'Produto A', vendas: 240, receita: 12000 },
  { produto: 'Produto B', vendas: 185, receita: 9250 },
  { produto: 'Produto C', vendas: 162, receita: 8100 },
  { produto: 'Produto D', vendas: 148, receita: 7400 },
  { produto: 'Produto E', vendas: 135, receita: 6750 },
];

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('last30days');
  const [tabValue, setTabValue] = useState(0);

  // Simular fetch de dados
  const { data: analyticsData, isLoading, refetch } = useQuery(
    ['analytics', selectedPeriod],
    () => Promise.resolve({
      overview: {
        totalRevenue: 285000,
        revenueGrowth: 12.5,
        totalOrders: 1248,
        ordersGrowth: 8.3,
        avgOrderValue: 228.37,
        avgGrowth: 3.8,
        totalCustomers: 586,
        customersGrowth: 15.2,
      },
      charts: {
        sales: salesData,
        countries: countryData,
        suppliers: supplierPerformance,
        products: topProducts,
      },
    }),
    {
      refetchInterval: 300000, // 5 minutos
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const MetricCard: React.FC<{
    title: string;
    value: string;
    growth?: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, growth, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: 1,
              p: 1,
              mr: 2,
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { color, fontSize: 24 } 
            })}
          </Box>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        </Box>
        
        <Typography variant="h4" component="div" sx={{ mb: 1 }}>
          {value}
        </Typography>
        
        {growth !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {growth >= 0 ? (
              <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: 20 }} />
            )}
            <Typography
              variant="body2"
              sx={{
                color: growth >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'bold',
              }}
            >
              {Math.abs(growth).toFixed(1)}%
            </Typography>
            <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              vs. período anterior
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading || !analyticsData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando analytics...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📊 Analytics
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Período</InputLabel>
            <Select
              value={selectedPeriod}
              label="Período"
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <MenuItem value="last7days">Últimos 7 dias</MenuItem>
              <MenuItem value="last30days">Últimos 30 dias</MenuItem>
              <MenuItem value="last90days">Últimos 90 dias</MenuItem>
              <MenuItem value="last12months">Últimos 12 meses</MenuItem>
            </Select>
          </FormControl>
          
          <Tooltip title="Atualizar dados">
            <IconButton onClick={() => refetch()}>
              <Refresh />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Exportar relatório">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Receita Total"
            value={`R$ ${analyticsData.overview.totalRevenue.toLocaleString()}`}
            growth={analyticsData.overview.revenueGrowth}
            icon={<AttachMoney />}
            color="#1976d2"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Pedidos"
            value={analyticsData.overview.totalOrders.toLocaleString()}
            growth={analyticsData.overview.ordersGrowth}
            icon={<ShoppingCart />}
            color="#2e7d32"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Ticket Médio"
            value={`R$ ${analyticsData.overview.avgOrderValue.toFixed(2)}`}
            growth={analyticsData.overview.avgGrowth}
            icon={<Timeline />}
            color="#ed6c02"
          />
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total de Clientes"
            value={analyticsData.overview.totalCustomers.toLocaleString()}
            growth={analyticsData.overview.customersGrowth}
            icon={<People />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Vendas" icon={<BarChart />} iconPosition="start" />
            <Tab label="Geografía" icon={<PieChart />} iconPosition="start" />
            <Tab label="Fornecedores" icon={<Business />} iconPosition="start" />
            <Tab label="Produtos" icon={<Assessment />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Sales Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Evolução das Vendas
          </Typography>
          
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={analyticsData.charts.sales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <RechartsTooltip 
                formatter={(value, name) => [
                  name === 'vendas' ? `R$ ${value.toLocaleString()}` : value,
                  name === 'vendas' ? 'Vendas' : name === 'pedidos' ? 'Pedidos' : 'Clientes'
                ]}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="vendas"
                stackId="1"
                stroke="#1976d2"
                fill="#1976d2"
                fillOpacity={0.3}
                name="Vendas (R$)"
              />
            </AreaChart>
          </ResponsiveContainer>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Pedidos e Clientes
            </Typography>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.charts.sales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pedidos"
                  stroke="#2e7d32"
                  strokeWidth={2}
                  name="Pedidos"
                />
                <Line
                  type="monotone"
                  dataKey="clientes"
                  stroke="#9c27b0"
                  strokeWidth={2}
                  name="Novos Clientes"
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </TabPanel>

        {/* Geography Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Distribuição por País
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analyticsData.charts.countries}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, value }) => `${country}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analyticsData.charts.countries.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>País</TableCell>
                      <TableCell align="right">Participação</TableCell>
                      <TableCell align="right">Pedidos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.charts.countries.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                backgroundColor: row.color,
                                borderRadius: '50%',
                                mr: 1,
                              }}
                            />
                            {row.country}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{row.value}%</TableCell>
                        <TableCell align="right">
                          {Math.round((row.value / 100) * analyticsData.overview.totalOrders)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Suppliers Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Performance dos Fornecedores
          </Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fornecedor</TableCell>
                  <TableCell align="right">Pedidos</TableCell>
                  <TableCell align="right">Prazo Médio (dias)</TableCell>
                  <TableCell align="right">Qualidade</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analyticsData.charts.suppliers.map((supplier) => (
                  <TableRow key={supplier.nome}>
                    <TableCell component="th" scope="row">
                      {supplier.nome}
                    </TableCell>
                    <TableCell align="right">{supplier.pedidos}</TableCell>
                    <TableCell align="right">{supplier.prazoMedio}</TableCell>
                    <TableCell align="right">
                      ⭐ {supplier.qualidade}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={supplier.qualidade >= 4.5 ? 'Excelente' : 'Bom'}
                        color={supplier.qualidade >= 4.5 ? 'success' : 'primary'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Products Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Top Produtos
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsBarChart data={analyticsData.charts.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="produto" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="vendas" fill="#1976d2" name="Vendas" />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Produto</TableCell>
                      <TableCell align="right">Receita</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.charts.products.map((product, index) => (
                      <TableRow key={product.produto}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={index + 1}
                              size="small"
                              sx={{ mr: 1, minWidth: 24 }}
                            />
                            {product.produto}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          R$ {product.receita.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default AnalyticsPage;