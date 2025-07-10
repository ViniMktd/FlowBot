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
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Language as LanguageIcon,
  Assignment as DocumentIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useFormik } from 'formik';
import * as Yup from 'yup';

// Definições de países e idiomas (mesmas do supplier form)
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

// Tipos de documentos por país para clientes
const documentTypesByCountry: Record<string, Array<{ type: string; label: string; mask?: string }>> = {
  BR: [
    { type: 'cpf', label: 'CPF', mask: '###.###.###-##' },
    { type: 'rg', label: 'RG' },
    { type: 'cnpj', label: 'CNPJ (para empresas)', mask: '##.###.###/####-##' },
  ],
  CN: [
    { type: 'nationalId', label: 'National ID Card', mask: '##################' },
    { type: 'passport', label: 'Passport' },
  ],
  US: [
    { type: 'ssn', label: 'SSN (Social Security Number)', mask: '###-##-####' },
    { type: 'passport', label: 'Passport' },
    { type: 'driverLicense', label: "Driver's License" },
  ],
  DE: [
    { type: 'personalId', label: 'Personalausweis' },
    { type: 'passport', label: 'Reisepass' },
  ],
  ES: [
    { type: 'dni', label: 'DNI', mask: '########-#' },
    { type: 'nie', label: 'NIE' },
    { type: 'passport', label: 'Passport' },
  ],
  FR: [
    { type: 'cin', label: 'Carte d\'identité nationale' },
    { type: 'passport', label: 'Passeport' },
  ],
};

interface InternationalCustomerFormProps {
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}

export const InternationalCustomerForm: React.FC<InternationalCustomerFormProps> = ({
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
      name: Yup.string().required(t('validation.required')),
      email: Yup.string().email(t('validation.email')).required(t('validation.required')),
      phone: Yup.string().required(t('validation.required')),
      country: Yup.string().required(t('validation.required')),
      preferredLanguage: Yup.string().required(t('validation.required')),
      city: Yup.string().required(t('validation.required')),
      address: Yup.string().required(t('validation.required')),
    };

    // Adicionar validações específicas por país
    const documentTypes = documentTypesByCountry[country] || [];
    const documentValidations = documentTypes.reduce((acc, doc) => {
      if (doc.type === 'cpf') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, t('validation.cpf'));
      } else if (doc.type === 'cnpj') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, t('validation.cnpj'));
      } else if (doc.type === 'ssn') {
        acc[`documents.${doc.type}`] = Yup.string()
          .matches(/^\d{3}-\d{2}-\d{4}$/, 'SSN format: 123-45-6789');
      }
      return acc;
    }, {} as Record<string, any>);

    return Yup.object().shape({ ...baseSchema, ...documentValidations });
  };

  const formik = useFormik({
    initialValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      country: initialData?.country || 'BR',
      preferredLanguage: initialData?.preferredLanguage || 'pt-BR',
      city: initialData?.city || '',
      address: initialData?.address || '',
      zipCode: initialData?.zipCode || '',
      active: initialData?.active !== undefined ? initialData.active : true,
      documents: initialData?.documents || {},
      notes: initialData?.notes || '',
      birthDate: initialData?.birthDate || '',
      occupation: initialData?.occupation || '',
      marketingConsent: initialData?.marketingConsent || false,
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
      // Auto-preencher idioma baseado no país se não estiver definido
      if (!formik.values.preferredLanguage || formik.values.preferredLanguage === '') {
        formik.setFieldValue('preferredLanguage', country.language);
      }
      // Auto-preencher prefixo do telefone se o telefone estiver vazio
      if (!formik.values.phone.startsWith('+')) {
        const currentPhone = formik.values.phone.replace(/^\+\d+\s*/, '');
        if (currentPhone) {
          formik.setFieldValue('phone', `${country.phonePrefix} ${currentPhone}`.trim());
        }
      }
    }
  }, [formik.values.country]);

  // Validação de documentos em tempo real
  const validateDocument = (documentType: string, value: string, country: string) => {
    if (!value) return '';
    
    if (country === 'BR' && documentType === 'cpf') {
      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      return cpfRegex.test(value) ? 'valid' : 'invalid';
    }
    
    if (country === 'BR' && documentType === 'cnpj') {
      const cnpjRegex = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
      return cnpjRegex.test(value) ? 'valid' : 'invalid';
    }
    
    if (country === 'US' && documentType === 'ssn') {
      const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
      return ssnRegex.test(value) ? 'valid' : 'invalid';
    }
    
    if (country === 'CN' && documentType === 'nationalId') {
      return value.length === 18 ? 'valid' : 'invalid';
    }
    
    return value.length > 3 ? 'valid' : 'pending';
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
        {/* Informações Pessoais */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Informações Pessoais
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="name"
                    label={t('customers.name')}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    error={formik.touched.name && Boolean(formik.errors.name)}
                    helperText={formik.touched.name && formik.errors.name}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="birthDate"
                    label="Data de Nascimento"
                    type="date"
                    value={formik.values.birthDate}
                    onChange={formik.handleChange}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="email"
                    label={t('customers.email')}
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
                    label={t('customers.phone')}
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="occupation"
                    label="Profissão"
                    value={formik.values.occupation}
                    onChange={formik.handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Localização */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <LocationIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Localização
              </Typography>
              <Grid container spacing={2}>
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
                        label={t('customers.country')}
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
                    value={languages.find(l => l.code === formik.values.preferredLanguage) || null}
                    onChange={(_, newValue) => {
                      formik.setFieldValue('preferredLanguage', newValue?.code || '');
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t('customers.preferredLanguage')}
                        required
                        error={formik.touched.preferredLanguage && Boolean(formik.errors.preferredLanguage)}
                        helperText={formik.touched.preferredLanguage && formik.errors.preferredLanguage}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="city"
                    label={t('customers.city')}
                    value={formik.values.city}
                    onChange={formik.handleChange}
                    error={formik.touched.city && Boolean(formik.errors.city)}
                    helperText={formik.touched.city && formik.errors.city}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="zipCode"
                    label="CEP / Zip Code"
                    value={formik.values.zipCode}
                    onChange={formik.handleChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="address"
                    label="Endereço Completo"
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
                  {selectedCountryData && (
                    <TextField
                      fullWidth
                      disabled
                      label="Fuso Horário"
                      value={selectedCountryData.timezone}
                    />
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  {selectedCountryData && (
                    <TextField
                      fullWidth
                      disabled
                      label="Moeda Local"
                      value={selectedCountryData.currency}
                    />
                  )}
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

        {/* Configurações */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Configurações
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.active}
                        onChange={(e) => formik.setFieldValue('active', e.target.checked)}
                      />
                    }
                    label="Cliente Ativo"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.marketingConsent}
                        onChange={(e) => formik.setFieldValue('marketingConsent', e.target.checked)}
                      />
                    }
                    label="Aceita receber comunicações de marketing"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name="notes"
                    label="Observações"
                    value={formik.values.notes}
                    onChange={formik.handleChange}
                    multiline
                    rows={3}
                    placeholder="Informações adicionais sobre o cliente..."
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