import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugIcon,
  Home as HomeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log do erro para serviço de monitoramento (ex: Sentry)
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    
    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleRefresh = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/';
  };

  copyErrorToClipboard = () => {
    const errorText = `
Erro: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Informações do erro copiadas para a área de transferência');
    });
  };

  render() {
    if (this.state.hasError) {
      // Renderizar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI de erro padrão
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
            bgcolor: 'grey.50',
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {/* Ícone de erro */}
              <ErrorIcon 
                sx={{ 
                  fontSize: 80, 
                  color: 'error.main', 
                  mb: 2 
                }} 
              />

              {/* Título */}
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Ops! Algo deu errado
              </Typography>

              {/* Descrição */}
              <Typography variant="body1" color="text.secondary" paragraph>
                Ocorreu um erro inesperado no FlowBot. Nossa equipe foi notificada automaticamente.
              </Typography>

              {/* Ações principais */}
              <Box display="flex" gap={2} justifyContent="center" mb={3}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRefresh}
                  size="large"
                >
                  Recarregar Página
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  size="large"
                >
                  Ir para o Dashboard
                </Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Informações técnicas (expansível) */}
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="error-details-content"
                  id="error-details-header"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <BugIcon color="action" />
                    <Typography variant="subtitle2">
                      Detalhes Técnicos
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box textAlign="left">
                    {/* Erro principal */}
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Erro:
                      </Typography>
                      <Typography variant="body2" component="pre" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {this.state.error?.message}
                      </Typography>
                    </Alert>

                    {/* Stack trace */}
                    {this.state.error?.stack && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Stack Trace:
                        </Typography>
                        <Typography 
                          variant="caption" 
                          component="pre" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.error.stack}
                        </Typography>
                      </Box>
                    )}

                    {/* Component stack */}
                    {this.state.errorInfo?.componentStack && (
                      <Box mb={2}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Component Stack:
                        </Typography>
                        <Typography 
                          variant="caption" 
                          component="pre"
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace',
                            bgcolor: 'grey.100',
                            p: 2,
                            borderRadius: 1,
                            maxHeight: 200,
                            overflow: 'auto',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </Typography>
                      </Box>
                    )}

                    {/* Informações do sistema */}
                    <Box mb={2}>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                        Informações do Sistema:
                      </Typography>
                      <Typography variant="body2" component="div">
                        <strong>URL:</strong> {window.location.href}<br />
                        <strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}<br />
                        <strong>User Agent:</strong> {navigator.userAgent}<br />
                        <strong>Ambiente:</strong> {process.env.NODE_ENV || 'development'}
                      </Typography>
                    </Box>

                    {/* Botão para copiar */}
                    <Box textAlign="center">
                      <Tooltip title="Copiar informações do erro">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<CopyIcon />}
                          onClick={this.copyErrorToClipboard}
                        >
                          Copiar Detalhes
                        </Button>
                      </Tooltip>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Dicas de resolução */}
              <Alert severity="info" sx={{ mt: 3, textAlign: 'left' }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  💡 Dicas para resolver:
                </Typography>
                <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
                  <li>Recarregue a página (F5 ou Ctrl+R)</li>
                  <li>Limpe o cache do navegador</li>
                  <li>Verifique sua conexão com a internet</li>
                  <li>Tente acessar novamente em alguns minutos</li>
                  <li>Se o problema persistir, entre em contato com o suporte</li>
                </Typography>
              </Alert>

              {/* Footer */}
              <Box mt={3} pt={2} borderTop={1} borderColor="divider">
                <Typography variant="caption" color="text.secondary">
                  FlowBot v2.0.0 • Sistema de Fulfillment Internacional
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;