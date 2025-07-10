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
  Rating,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { InternationalSupplierForm } from '@/components/Forms/InternationalSupplierForm';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock data for suppliers with international information
const mockSuppliers = [
  {
    id: '1',
    companyName: 'Fornecedor Brasil Ltda',
    tradeName: 'Brasil Tech',
    contact: 'João Silva',
    country: 'BR',
    countryName: 'Brasil',
    language: 'pt-BR',
    phone: '+55 11 99999-9999',
    email: 'joao@brasiltech.com',
    city: 'São Paulo',
    rating: 4.5,
    activeOrders: 12,
    totalOrders: 150,
    successRate: 98.5,
    processingTime: '2-3 dias',
    active: true,
    documents: {
      cnpj: '12.345.678/0001-90',
      businessLicense: 'BR-BL-12345',
    }
  },
  {
    id: '2',
    companyName: 'Shenzhen Electronics Co., Ltd',
    tradeName: '深圳电子有限公司',
    contact: 'Li Wei',
    country: 'CN',
    countryName: 'China',
    language: 'zh-CN',
    phone: '+86 138 8888 8888',
    email: 'liwei@szelectronics.com.cn',
    city: 'Shenzhen',
    rating: 4.8,
    activeOrders: 25,
    totalOrders: 300,
    successRate: 99.2,
    processingTime: '1-2 weeks',
    active: true,
    documents: {
      businessLicense: 'CN-BL-789123',
      taxId: 'CN-TAX-456789',
    }
  },
  {
    id: '3',
    companyName: 'American Goods Inc.',
    tradeName: 'AmeriGoods',
    contact: 'John Smith',
    country: 'US',
    countryName: 'United States',
    language: 'en',
    phone: '+1 555 123-4567',
    email: 'john@amerigoods.com',
    city: 'New York',
    rating: 4.2,
    activeOrders: 8,
    totalOrders: 85,
    successRate: 96.8,
    processingTime: '3-5 days',
    active: true,
    documents: {
      ein: 'US-EIN-123456789',
      businessLicense: 'US-BL-987654',
    }
  }
];

const countries = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
];

export const SuppliersPage: React.FC = () => {
  const { t } = useTranslation();
  const [suppliers, setSuppliers] = useState(mockSuppliers);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [filters, setFilters] = useState({
    country: '',
    language: '',
    active: '',
    search: '',
  });

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setOpenDialog(true);
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setOpenDialog(true);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(suppliers.filter(s => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setSuppliers(suppliers.map(s => 
      s.id === id ? { ...s, active: !s.active } : s
    ));
  };

  const handleSaveSupplier = (supplierData: any) => {
    if (editingSupplier) {
      setSuppliers(suppliers.map(s => 
        s.id === editingSupplier.id ? { ...s, ...supplierData } : s
      ));
    } else {
      const newSupplier = {
        ...supplierData,
        id: Date.now().toString(),
        rating: 0,
        activeOrders: 0,
        totalOrders: 0,
        successRate: 0,
      };
      setSuppliers([...suppliers, newSupplier]);
    }
    setOpenDialog(false);
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    if (filters.country && supplier.country !== filters.country) return false;
    if (filters.language && supplier.language !== filters.language) return false;
    if (filters.active && supplier.active.toString() !== filters.active) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        supplier.companyName.toLowerCase().includes(searchLower) ||
        supplier.tradeName.toLowerCase().includes(searchLower) ||
        supplier.contact.toLowerCase().includes(searchLower) ||
        supplier.email.toLowerCase().includes(searchLower)
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
    };
    return labels[langCode] || langCode;
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('suppliers.title')}
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <LanguageSelector variant="chip" />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddSupplier}
            size="large"
          >
            {t('suppliers.addSupplier')}
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
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label={t('suppliers.country')}
                value={filters.country}
                onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                size="small"
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
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
                label={t('suppliers.language')}
                value={filters.language}
                onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                size="small"
              >
                <MenuItem value="">{t('common.all')}</MenuItem>
                <MenuItem value="pt-BR">🇧🇷 Português</MenuItem>
                <MenuItem value="en">🇺🇸 English</MenuItem>
                <MenuItem value="zh-CN">🇨🇳 中文</MenuItem>
                <MenuItem value="de">🇩🇪 Deutsch</MenuItem>
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
                <MenuItem value="">{t('common.all')}</MenuItem>
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

      {/* Tabela de Fornecedores */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('suppliers.companyName')}</TableCell>
              <TableCell>{t('suppliers.contact')}</TableCell>
              <TableCell>{t('suppliers.country')}</TableCell>
              <TableCell>{t('suppliers.language')}</TableCell>
              <TableCell>{t('suppliers.rating')}</TableCell>
              <TableCell>{t('suppliers.activeOrders')}</TableCell>
              <TableCell>{t('suppliers.successRate')}</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSuppliers.map((supplier) => (
              <TableRow key={supplier.id} hover>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                      {supplier.companyName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {supplier.companyName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {supplier.tradeName}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {supplier.contact}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                      <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {supplier.email}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {supplier.phone}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={`${getCountryFlag(supplier.country)} ${supplier.countryName}`}
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<LanguageIcon />}
                    label={getLanguageLabel(supplier.language)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Rating value={supplier.rating} readOnly size="small" />
                    <Typography variant="caption">
                      ({supplier.rating})
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {supplier.activeOrders}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    de {supplier.totalOrders} total
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography 
                    variant="body2" 
                    color={supplier.successRate >= 95 ? 'success.main' : 'warning.main'}
                    fontWeight="medium"
                  >
                    {supplier.successRate}%
                  </Typography>
                </TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={supplier.active}
                        onChange={() => handleToggleActive(supplier.id)}
                        size="small"
                      />
                    }
                    label={supplier.active ? 'Ativo' : 'Inativo'}
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
                        onClick={() => handleEditSupplier(supplier)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('common.delete')}>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteSupplier(supplier.id)}
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

      {/* Dialog para Adicionar/Editar Fornecedor */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingSupplier ? t('suppliers.editSupplier') : t('suppliers.addSupplier')}
        </DialogTitle>
        <DialogContent>
          <InternationalSupplierForm
            initialData={editingSupplier}
            onSave={handleSaveSupplier}
            onCancel={() => setOpenDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};