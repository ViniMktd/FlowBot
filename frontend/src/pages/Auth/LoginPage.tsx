import React, { useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Avatar,
  Paper,
  Container,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email as EmailIcon,
  Lock as LockIcon,
  Login as LoginIcon,
  Language as LanguageIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { LanguageSelector } from '@/components/LanguageSelector';

// Mock login service
const loginService = {
  authenticate: async (email: string, password: string) => {
    // Simulação de autenticação
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Credenciais válidas para demo
    const validCredentials = [
      { email: 'admin@flowbot.com', password: 'admin123', role: 'ADMIN' },
      { email: 'manager@flowbot.com', password: 'manager123', role: 'MANAGER' },
      { email: 'user@flowbot.com', password: 'user123', role: 'USER' },
      { email: 'demo@flowbot.com', password: 'demo123', role: 'USER' },
    ];

    const user = validCredentials.find(
      cred => cred.email === email && cred.password === password
    );

    if (user) {
      const token = `fake-jwt-token-${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify({
        id: '1',
        email: user.email,
        name: user.email.split('@')[0],
        role: user.role,
        permissions: ['read', 'write'],
        lastLogin: new Date().toISOString()
      }));
      
      return {
        success: true,
        user: {
          id: '1',
          email: user.email,
          name: user.email.split('@')[0],
          role: user.role
        },
        token
      };
    } else {
      throw new Error('Credenciais inválidas');
    }
  }
};

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: Yup.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .required('Senha é obrigatória'),
});

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      try {
        const result = await loginService.authenticate(values.email, values.password);
        
        if (result.success) {
          // Redirect to dashboard
          navigate('/');
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao fazer login');
      } finally {
        setLoading(false);
      }
    },
  });

  const demoCredentials = [
    { label: 'Admin', email: 'admin@flowbot.com', password: 'admin123' },
    { label: 'Manager', email: 'manager@flowbot.com', password: 'manager123' },
    { label: 'User', email: 'user@flowbot.com', password: 'user123' },
    { label: 'Demo', email: 'demo@flowbot.com', password: 'demo123' },
  ];

  const handleDemoLogin = (email: string, password: string) => {
    formik.setFieldValue('email', email);
    formik.setFieldValue('password', password);
  };

  return (
    <Container component="main" maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        }}
      >
        <Grid container spacing={4} maxWidth="md">
          {/* Lado esquerdo - Informações do FlowBot */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: 4,
              }}
            >
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: 'primary.main',
                    mr: 2,
                    fontSize: '2rem',
                  }}
                >
                  🤖
                </Avatar>
                <Box>
                  <Typography variant="h3" component="h1" fontWeight="bold" color="primary">
                    FlowBot
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Sistema de Automação de Fulfillment
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h5" gutterBottom fontWeight="medium">
                🌍 Suporte Internacional
              </Typography>
              <Typography variant="body1" paragraph color="text.secondary">
                Gerencie pedidos de clientes brasileiros e comunique-se automaticamente 
                com fornecedores chineses em inglês ou chinês.
              </Typography>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  ✨ Funcionalidades:
                </Typography>
                <Box component="ul" sx={{ pl: 2, color: 'text.secondary' }}>
                  <li>🎯 Dashboard em tempo real</li>
                  <li>📦 Gestão completa de pedidos</li>
                  <li>🤝 Comunicação multilíngue (WhatsApp/Email)</li>
                  <li>🇨🇳 Integração com fornecedores chineses</li>
                  <li>📊 Analytics e relatórios</li>
                  <li>🔒 Sistema de permissões</li>
                </Box>
              </Box>

              <Box sx={{ mt: 3 }}>
                <LanguageSelector variant="button" />
              </Box>
            </Box>
          </Grid>

          {/* Lado direito - Formulário de Login */}
          <Grid item xs={12} md={6}>
            <Card
              elevation={8}
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box textAlign="center" mb={3}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <LoginIcon />
                  </Avatar>
                  <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                    {t('auth.welcome')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t('auth.loginDescription')}
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={formik.handleSubmit}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label={t('auth.email')}
                    type="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label={t('auth.password')}
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={2} mb={3}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="rememberMe"
                          checked={formik.values.rememberMe}
                          onChange={formik.handleChange}
                          color="primary"
                        />
                      }
                      label={t('auth.rememberMe')}
                    />
                    <Link href="#" variant="body2" color="primary">
                      {t('auth.forgotPassword')}
                    </Link>
                  </Box>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ mb: 2, py: 1.5 }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      t('auth.login')
                    )}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Contas de Demonstração
                  </Typography>
                </Divider>

                {/* Demo Credentials */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary">
                    Credenciais para teste:
                  </Typography>
                  <Grid container spacing={1}>
                    {demoCredentials.map((cred) => (
                      <Grid item xs={6} key={cred.email}>
                        <Paper
                          sx={{
                            p: 1,
                            cursor: 'pointer',
                            border: 1,
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            },
                          }}
                          onClick={() => handleDemoLogin(cred.email, cred.password)}
                        >
                          <Typography variant="caption" fontWeight="bold" display="block">
                            {cred.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {cred.email}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box mt={3} textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    <SecurityIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                    Conexão segura e criptografada
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};