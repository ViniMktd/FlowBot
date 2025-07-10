import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  FormControlLabel,
  Switch,
  Autocomplete,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Assignment as DocumentIcon,
  Api as ApiIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Definições de países e idiomas
const countries = [
  { code: 'BR', name: 'Brasil', nameLocal: 'Brasil', flag: '🇧🇷', phonePrefix: '+55', timezone: 'America/Sao_Paulo', currency: 'BRL', language: 'pt-BR' },
  { code: 'CN', name: 'China', nameLocal: '中国', flag: '🇨🇳', phonePrefix: '+86', timezone: 'Asia/Shanghai', currency: 'CNY', language: 'zh-CN' },
  { code: 'US', name: 'United States', nameLocal: 'United States', flag: '🇺🇸', phonePrefix: '+1', timezone: 'America/New_York', currency: 'USD', language: 'en' },
  { code: 'DE', name: 'Germany', nameLocal: 'Deutschland', flag: '🇩🇪', phonePrefix: '+49', timezone: 'Europe/Berlin', currency: 'EUR', language: 'de' },
  { code: 'ES', name: 'Spain', nameLocal: 'España', flag: '🇪🇸', phonePrefix: '+34', timezone: 'Europe/Madrid', currency: 'EUR', language: 'es' },
  { code: 'FR', name: 'France', nameLocal: 'France', flag: '🇫🇷', phonePrefix: '+33', timezone: 'Europe/Paris', currency: 'EUR', language: 'fr' },
  { code: 'IT', name: 'Italy', nameLocal: 'Italia', flag: '🇮🇹', phonePrefix: '+39', timezone: 'Europe/Rome', currency: 'EUR', language: 'it' },
  { code: 'JP', name: 'Japan', nameLocal: '日本', flag: '🇯🇵', phonePrefix: '+81', timezone: 'Asia/Tokyo', currency: 'JPY', language: 'ja' },
  { code: 'KR', name: 'South Korea', nameLocal: '대한민국', flag: '🇰🇷', phonePrefix: '+82', timezone: 'Asia/Seoul', currency: 'KRW', language: 'ko' },
  { code: 'IN', name: 'India', nameLocal: 'भारत', flag: '🇮🇳', phonePrefix: '+91', timezone: 'Asia/Kolkata', currency: 'INR', language: 'hi' },
];

const languages = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '中文 (简体)', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

const integrationTypes = [
  { value: 'API', label: 'API REST' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'WEBHOOK', label: 'Webhook' },
  { value: 'MANUAL', label: 'Manual' },
];

// Tipos de documentos por país
const documentTypesByCountry: Record<string, Array<{ type: string; label: string; mask?: string }>> = {
  BR: [
    { type: 'cnpj', label: 'CNPJ', mask: '##.###.###/####-##' },
    { type: 'cpf', label: 'CPF', mask: '###.###.###-##' },
    { type: 'ie', label: 'Inscrição Estadual' },
  ],
  CN: [
    { type: 'businessLicense', label: 'Business License' },
    { type: 'taxId', label: 'Tax Registration Number' },
    { type: 'organizationCode', label: 'Organization Code' },
  ],
  US: [
    { type: 'ein', label: 'EIN (Employer Identification Number)', mask: '##-#######' },
    { type: 'ssn', label: 'SSN (Social Security Number)', mask: '###-##-####' },
    { type: 'businessLicense', label: 'Business License' },
  ],
  DE: [
    { type: 'vatId', label: 'VAT ID', mask: 'DE#########' },
    { type: 'businessLicense', label: 'Gewerbeschein' },
  ],
};

interface InternationalSupplierFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const InternationalSupplierForm: React.FC<InternationalSupplierFormProps> = ({
  initialData,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [selectedCountry, setSelectedCountry] = useState<string>(initialData?.country || 'BR');
  const [documentValidation, setDocumentValidation] = useState<Record<string, string>>({});

  // Schema de validação dinâmico baseado no país
  const getValidationSchema = (country: string) => {
    const baseSchema = {
      companyName: Yup.string().required(t('validation.required')),
      tradeName: Yup.string(),
      contact: Yup.string().required(t('validation.required')),
      email: Yup.string().email(t('validation.email')).required(t('validation.required')),
      phone: Yup.string().required(t('validation.required')),
      country: Yup.string().required(t('validation.required')),
      language: Yup.string().required(t('validation.required')),
      city: Yup.string().required(t('validation.required')),
      address: Yup.string().required(t('validation.required')),
      integrationType: Yup.string().required(t('validation.required')),
    };

    // Adicionar validações específicas por país
    const documentTypes = documentTypesByCountry[country] || [];
    const documentValidations = documentTypes.reduce((acc, doc) => {
      if (doc.type === 'cnpj') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, t('validation.cnpj'));
      } else if (doc.type === 'cpf') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, t('validation.cpf'));
      } else if (doc.type === 'ein') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{2}-\d{7}$/, 'EIN format: 12-3456789');
      }
      return acc;
    }, {} as Record<string, any>);

    return Yup.object().shape({ ...baseSchema, ...documentValidations });
  };

  const formik = useFormik({
    initialValues: {
      companyName: initialData?.companyName || '',
      tradeName: initialData?.tradeName || '',
      contact: initialData?.contact || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      country: initialData?.country || 'BR',
      language: initialData?.language || 'pt-BR',
      city: initialData?.city || '',
      address: initialData?.address || '',
      integrationType: initialData?.integrationType || 'EMAIL',
      apiEndpoint: initialData?.apiEndpoint || '',
      apiKey: initialData?.apiKey || '',
      webhookUrl: initialData?.webhookUrl || '',
      active: initialData?.active !== undefined ? initialData.active : true,
      documents: initialData?.documents || {},
      notes: initialData?.notes || '',
    },
    validationSchema: getValidationSchema(selectedCountry),
    onSubmit: (values) => {
      onSave(values);
    },
  });

  // Atualizar país selecionado e dados relacionados
  useEffect(() => {
    const country = countries.find(c => c.code === formik.values.country);
    if (country) {
      setSelectedCountry(country.code);
      // Auto-preencher idioma baseado no país
      if (!formik.values.language || formik.values.language === '') {
        formik.setFieldValue('language', country.language);
      }
      // Auto-preencher prefixo do telefone se o telefone estiver vazio
      if (!formik.values.phone.startsWith('+')) {
        const currentPhone = formik.values.phone.replace(/^\+\d+\s*/, '');
        formik.setFieldValue('phone', `${country.phonePrefix} ${currentPhone}`.trim());
      }
    }
  }, [formik.values.country]);

  // Validação de documentos em tempo real
  const validateDocument = (documentType: string, value: string, country: string) => {
    // Simulação de validação de documento
    if (!value) return '';
    
    if (country === 'BR' && documentType === 'cnpj') {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      return cnpjRegex.test(value) ? 'valid' : 'invalid';
    }
    
    if (country === 'BR' && documentType === 'cpf') {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      return cpfRegex.test(value) ? 'valid' : 'invalid';
    }
    
    if (country === 'US' && documentType === 'ein') {
      const einRegex = /^\d{2}-\d{7}$/;
      return einRegex.test(value) ? 'valid' : 'invalid';
    }
    
    return value.length > 5 ? 'valid' : 'pending';
  };

  const handleDocumentChange = (documentType: string, value: string) => {
    formik.setFieldValue(`documents.${documentType}`, value);
    const validation = validateDocument(documentType, value, selectedCountry);
    setDocumentValidation(prev => ({ ...prev, [documentType]: validation }));
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const availableDocuments = documentTypesByCountry[selectedCountry] || [];

  return (
    <Box component="form" onSubmit={formik.handleSubmit}>
      <Grid container spacing={3}>
        {/* Informações Básicas da Empresa */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BusinessIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('suppliers.companyInfo')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="companyName"
                    label={t('suppliers.companyName')}
                    value={formik.values.companyName}
                    onChange={formik.handleChange}
                    error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                    helperText={formik.touched.companyName && formik.errors.companyName}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="tradeName"
                    label={t('suppliers.tradeName')}
                    value={formik.values.tradeName}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={countries}
                    getOptionLabel={(option) => `${option.flag} ${option.name}`}
                    value={countries.find(c => c.code === formik.values.country) || null}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('country', newValue?.code || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('suppliers.country')}
                        required
                        error={formik.touched.country && Boolean(formik.errors.country)}
                        helperText={formik.touched.country && formik.errors.country}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={languages}
                    getOptionLabel={(option) => `${option.flag} ${option.name}`}
                    value={languages.find(l => l.code === formik.values.language) || null}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('language', newValue?.code || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('suppliers.language')}
                        required
                        error={formik.touched.language && Boolean(formik.errors.language)}
                        helperText={formik.touched.language && formik.errors.language}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address"
                    label={t('suppliers.address')}
                    value={formik.values.address}
                    onChange={formik.handleChange}
                    error={formik.touched.address && Boolean(formik.errors.address)}
                    helperText={formik.touched.address && formik.errors.address}
                    required
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="city"
                    label={t('suppliers.city')}
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedCountryData && (
                    <TextField
                      fullWidth
                      disabled
                      label="Fuso Horário"
                      value={selectedCountryData.timezone}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações de Contato */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('suppliers.contactInfo')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="contact"
                    label={t('suppliers.contact')}
                    value={formik.values.contact}
                    onChange={formik.handleChange}
                    error={formik.touched.contact && Boolean(formik.errors.contact)}
                    helperText={formik.touched.contact && formik.errors.contact}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label={t('suppliers.email')}
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="phone"
                    label={t('suppliers.phone')}
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    error={formik.touched.phone && Boolean(formik.errors.phone)}
                    helperText={formik.touched.phone && formik.errors.phone}
                    required
                    placeholder={selectedCountryData?.phonePrefix}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Documentos */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DocumentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Documentos ({selectedCountryData?.name})
              </Typography>
              <Grid container spacing={2}>
                {availableDocuments.map((doc) => (
                  <Grid item xs={12} md={6} key={doc.type}>
                    <TextField
                      fullWidth
                      name={`documents.${doc.type}`}
                      label={doc.label}
                      value={formik.values.documents[doc.type] || ''}
                      onChange={(e) => handleDocumentChange(doc.type, e.target.value)}
                      placeholder={doc.mask}
                      InputProps={{
                        endAdornment: documentValidation[doc.type] && (
                          <InputAdornment position="end">
                            <Chip
                              size="small"
                              label={
                                documentValidation[doc.type] === 'valid' ? '✓' :
                                documentValidation[doc.type] === 'invalid' ? '✗' : '⏳'
                              }
                              color={
                                documentValidation[doc.type] === 'valid' ? 'success' :
                                documentValidation[doc.type] === 'invalid' ? 'error' : 'default'
                              }
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Configurações de Integração */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <ApiIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                {t('suppliers.integrationSettings')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    name="integrationType"
                    label="Tipo de Integração"
                    value={formik.values.integrationType}
                    onChange={formik.handleChange}
                    required
                  >
                    {integrationTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.active}
                        onChange={(e) => formik.setFieldValue('active', e.target.checked)}
                      />
                    }
                    label="Fornecedor Ativo"
                  />
                </Grid>
                {formik.values.integrationType === 'API' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="apiEndpoint"
                        label="API Endpoint"
                        value={formik.values.apiEndpoint}
                        onChange={formik.handleChange}
                        placeholder="https://api.supplier.com/orders"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        name="apiKey"
                        label="API Key"
                        type="password"
                        value={formik.values.apiKey}
                        onChange={formik.handleChange}
                      />
                    </Grid>
                  </>
                )}
                {formik.values.integrationType === 'WEBHOOK' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="webhookUrl"
                      label="Webhook URL"
                      value={formik.values.webhookUrl}
                      onChange={formik.handleChange}
                      placeholder="https://supplier.com/webhook/flowbot"
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="notes"
                    label="Observações"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    multiline
                    rows={3}
                    placeholder="Informações adicionais sobre o fornecedor..."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações do País Selecionado */}
        {selectedCountryData && (
          <Grid item xs={12}>
            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                Informações do País: {selectedCountryData.flag} {selectedCountryData.name}
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <Chip label={`Moeda: ${selectedCountryData.currency}`} size="small" />
                <Chip label={`Idioma: ${selectedCountryData.language}`} size="small" />
                <Chip label={`Telefone: ${selectedCountryData.phonePrefix}`} size="small" />
                <Chip label={`Fuso: ${selectedCountryData.timezone}`} size="small" />
              </Box>
            </Alert>
          </Grid>
        )}

        {/* Ações */}
        <Grid item xs={12}>
          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button variant="outlined" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!formik.isValid || formik.isSubmitting}
            >
              {t('common.save')}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};