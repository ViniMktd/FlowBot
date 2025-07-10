import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  ShoppingCart as OrdersIcon,
  Visibility as ViewIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { InternationalCustomerForm } from '@/components/Forms/InternationalCustomerForm';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock data for customers with international information
const mockCustomers = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+55 11 99999-9999',
    country: 'BR',
    countryName: 'Brasil',
    city: 'São Paulo',
    preferredLanguage: 'pt-BR',
    totalOrders: 15,
    lastOrder: '2025-01-08',
    lifetimeValue: 2850.50,
    active: true,
    documents: {
      cpf: '123.456.789-00',
    },
    address: 'Rua das Flores, 123, Centro, São Paulo, SP, Brasil',
  },
  {
    id: '2',
    name: '李伟',
    email: 'liwei@email.com',
    phone: '+86 138 8888 8888',
    country: 'CN',
    countryName: 'China',
    city: 'Shenzhen',
    preferredLanguage: 'zh-CN',
    totalOrders: 8,
    lastOrder: '2025-01-09',
    lifetimeValue: 1200.00,
    active: true,
    documents: {
      nationalId: '110101199001011234',
    },
    address: '深圳市福田区华强北路1001号, 广东省, 中国',
  },
  {
    id: '3',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1 555 123-4567',
    country: 'US',
    countryName: 'United States',
    city: 'New York',
    preferredLanguage: 'en',
    totalOrders: 22,
    lastOrder: '2025-01-07',
    lifetimeValue: 4500.75,
    active: true,
    documents: {
      ssn: '123-45-6789',
    },
    address: '123 Main Street, New York, NY 10001, USA',
  },
  {
    id: '4',
    name: 'Hans Mueller',
    email: 'hans.mueller@email.de',
    phone: '+49 151 234 5678',
    country: 'DE',
    countryName: 'Germany',
    city: 'Berlin',
    preferredLanguage: 'de',
    totalOrders: 5,
    lastOrder: '2025-01-05',
    lifetimeValue: 890.25,
    active: true,
    documents: {
      personalId: 'DE123456789',
    },
    address: 'Unter den Linden 1, 10117 Berlin, Deutschland',
  }
];

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

export const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState(mockCustomers);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [filters, setFilters] = useState({
    country: '',
    language: '',
    active: '',
    search: '',
  });

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setOpenDialog(true);
  };

  const handleEditCustomer = (customer: any) => {
    setEditingCustomer(customer);
    setOpenDialog(true);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setCustomers(customers.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  const handleSaveCustomer = (customerData: any) => {
    if (editingCustomer) {
      setCustomers(customers.map(c => 
        c.id === editingCustomer.id ? { ...c, ...customerData } : c
      ));
    } else {
      const newCustomer = {
        ...customerData,
        id: Date.now().toString(),
        totalOrders: 0,
        lifetimeValue: 0,
        lastOrder: null,
      };
      setCustomers([...customers, newCustomer]);
    }
    setOpenDialog(false);
  };

  const filteredCustomers = customers.filter(customer => {
    if (filters.country && customer.country !== filters.country) return false;
    if (filters.language && customer.preferredLanguage !== filters.language) return false;
    if (filters.active && customer.active.toString() !== filters.active) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.city.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getCountryFlag = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    return country?.flag || '🏳️';
  };

  const getLanguageLabel = (langCode: string) => {
    const labels: Record<string, string> = {
      'pt-BR': 'Português',
      'en': 'English',
      'zh-CN': '中文',
      'de': 'Deutsch',
      'es': 'Español',
      'fr': 'Français',
    };
    return labels[langCode] || langCode;
  };

  const formatCurrency = (value: number, countryCode: string) => {
    const currencyMap: Record<string, string> = {
      'BR': 'BRL',
      'US': 'USD',
      'CN': 'CNY',
      'DE': 'EUR',
      'ES': 'EUR',
      'FR': 'EUR',
    };
    
    const currency = currencyMap[countryCode] || 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(value);
  };

  const getCustomerValueColor = (value: number) => {
    if (value >= 3000) return 'success.main';
    if (value >= 1000) return 'warning.main';
    return 'text.secondary';
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('customers.title')}
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <LanguageSelector variant="chip" />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddCustomer}
            size="large"
          >
            Adicionar Cliente
          </Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label={t('common.search')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                size="small"
                placeholder="Nome, email, telefone..."
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label={t('customers.country')}
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                size="small"
              >
                <MenuItem value="">Todos os países</MenuItem>
                {countries.map(country => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label={t('customers.preferredLanguage')}
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                size="small"
              >
                <MenuItem value="">Todos os idiomas</MenuItem>
                <MenuItem value="pt-BR">🇧🇷 Português</MenuItem>
                <MenuItem value="en">🇺🇸 English</MenuItem>
                <MenuItem value="zh-CN">🇨🇳 中文</MenuItem>
                <MenuItem value="de">🇩🇪 Deutsch</MenuItem>
                <MenuItem value="es">🇪🇸 Español</MenuItem>
                <MenuItem value="fr">🇫🇷 Français</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.active}
                onChange={(e) => setFilters({ ...filters, active: e.target.value })}
                size="small"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="true">Ativo</MenuItem>
                <MenuItem value="false">Inativo</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                onClick={() => setFilters({ country: '', language: '', active: '', search: '' })}
                fullWidth
              >
                {t('common.clear')}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" />
                <Typography variant="h6">{filteredCustomers.length}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Clientes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <OrdersIcon color="success" />
                <Typography variant="h6">
                  {filteredCustomers.reduce((sum, c) => sum + c.totalOrders, 0)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pedidos
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <MoneyIcon color="warning" />
                <Typography variant="h6">
                  ${filteredCustomers.reduce((sum, c) => sum + c.lifetimeValue, 0).toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Valor Total
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <LanguageIcon color="info" />
                <Typography variant="h6">
                  {new Set(filteredCustomers.map(c => c.country)).size}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Países
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabela de Clientes */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('customers.name')}</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>{t('customers.country')}</TableCell>
              <TableCell>{t('customers.preferredLanguage')}</TableCell>
              <TableCell>{t('customers.totalOrders')}</TableCell>
              <TableCell>{t('customers.lifetime_value')}</TableCell>
              <TableCell>{t('customers.lastOrder')}</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.map((customer) => (
              <TableRow key={customer.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {customer.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {customer.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {customer.city}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                      <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {customer.email}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {customer.phone}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${getCountryFlag(customer.country)} ${customer.countryName}`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<LanguageIcon />}
                    label={getLanguageLabel(customer.preferredLanguage)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {customer.totalOrders}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontWeight="medium"
                    color={getCustomerValueColor(customer.lifetimeValue)}
                  >
                    {formatCurrency(customer.lifetimeValue, customer.country)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString() : 'Nunca'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={customer.active}
                        onChange={() => handleToggleActive(customer.id)}
                        size="small"
                      />
                    }
                    label={customer.active ? 'Ativo' : 'Inativo'}
                    sx={{ m: 0 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box display="flex" gap={0.5}>
                    <Tooltip title="Visualizar">
                      <IconButton size="small" color="info">
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.edit')}>
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteCustomer(customer.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para Adicionar/Editar Cliente */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
        </DialogTitle>
        <DialogContent>
          <InternationalCustomerForm
            initialData={editingCustomer}
            onSave={handleSaveCustomer}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};