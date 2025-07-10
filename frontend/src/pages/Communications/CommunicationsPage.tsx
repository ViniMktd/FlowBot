import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  TextField,
  IconButton,
  Badge,
  Paper,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Stack,
} from '@mui/material';
import {
  WhatsApp,
  Email,
  Sms,
  Send,
  Refresh,
  MoreVert,
  Add,
  Search,
  FilterList,
  Archive,
  Star,
  StarBorder,
  Reply,
  Forward,
  Schedule,
  Group,
  Person,
  Notifications,
  Settings,
} from '@mui/icons-material';
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
      id={`communications-tabpanel-${index}`}
      aria-labelledby={`communications-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface Message {
  id: string;
  type: 'whatsapp' | 'email' | 'sms';
  from: string;
  to: string;
  subject?: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  starred: boolean;
  orderId?: string;
  customerId?: string;
}

// Mock data
const mockMessages: Message[] = [
  {
    id: '1',
    type: 'whatsapp',
    from: 'FlowBot',
    to: '+55 11 99999-9999',
    content: 'Seu pedido #FLW-001 foi enviado! Código de rastreamento: BR123456789',
    timestamp: '2024-01-17T10:30:00Z',
    status: 'read',
    starred: false,
    orderId: 'FLW-001',
    customerId: 'customer-1',
  },
  {
    id: '2',
    type: 'email',
    from: 'noreply@flowbot.com',
    to: 'cliente@email.com',
    subject: 'Confirmação de Pagamento - Pedido #FLW-002',
    content: 'Olá! Confirmamos o recebimento do pagamento do seu pedido. Em breve será enviado.',
    timestamp: '2024-01-17T09:15:00Z',
    status: 'delivered',
    starred: true,
    orderId: 'FLW-002',
    customerId: 'customer-2',
  },
  {
    id: '3',
    type: 'sms',
    from: 'FlowBot',
    to: '+55 21 88888-8888',
    content: 'PIX recebido! Pedido #FLW-003 confirmado. Obrigado pela compra!',
    timestamp: '2024-01-17T08:45:00Z',
    status: 'sent',
    starred: false,
    orderId: 'FLW-003',
    customerId: 'customer-3',
  },
];

const templates = [
  {
    id: '1',
    name: 'Confirmação de Pedido',
    type: 'whatsapp' as const,
    content: 'Olá {{customerName}}! Seu pedido {{orderNumber}} foi confirmado. Total: {{amount}}. Obrigado!',
  },
  {
    id: '2',
    name: 'Código de Rastreamento',
    type: 'whatsapp' as const,
    content: 'Seu pedido {{orderNumber}} foi enviado! Código: {{trackingCode}}. Prazo: {{deliveryDays}} dias úteis.',
  },
  {
    id: '3',
    name: 'Pagamento Aprovado',
    type: 'email' as const,
    content: 'Pagamento do pedido {{orderNumber}} aprovado via {{paymentMethod}}. Valor: {{amount}}.',
  },
];

const CommunicationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'whatsapp' | 'email' | 'sms'>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Simular fetch de dados
  const { data: messagesData, isLoading, refetch } = useQuery(
    ['communications'],
    () => Promise.resolve({
      messages: mockMessages,
      stats: {
        total: 147,
        whatsapp: 98,
        email: 32,
        sms: 17,
        unread: 5,
      },
    }),
    {
      refetchInterval: 30000, // 30 segundos
    }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'info';
      case 'delivered': return 'primary';
      case 'read': return 'success';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviado';
      case 'delivered': return 'Entregue';
      case 'read': return 'Lido';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return <WhatsApp sx={{ color: '#25d366' }} />;
      case 'email': return <Email sx={{ color: '#ea4335' }} />;
      case 'sms': return <Sms sx={{ color: '#1976d2' }} />;
      default: return <Email />;
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const filteredMessages = messagesData?.messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.to.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || message.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const ComposeDialog = () => (
    <Dialog open={composeOpen} onClose={() => setComposeOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Nova Mensagem</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Tipo</InputLabel>
            <Select defaultValue="whatsapp" label="Tipo">
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="sms">SMS</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Destinatário"
            placeholder="Telefone, email ou selecione cliente"
          />
          
          <TextField
            fullWidth
            label="Assunto"
            placeholder="Assunto da mensagem (opcional para WhatsApp/SMS)"
          />
          
          <TextField
            fullWidth
            label="Mensagem"
            multiline
            rows={6}
            placeholder="Digite sua mensagem..."
          />
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" size="small">
              📋 Usar Template
            </Button>
            <Button variant="outlined" size="small">
              📎 Anexar
            </Button>
            <Button variant="outlined" size="small">
              ⏰ Agendar
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setComposeOpen(false)}>Cancelar</Button>
        <Button variant="contained" startIcon={<Send />}>
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );

  const TemplateDialog = () => (
    <Dialog open={templateOpen} onClose={() => setTemplateOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Templates de Mensagem</DialogTitle>
      <DialogContent>
        <List>
          {templates.map((template) => (
            <React.Fragment key={template.id}>
              <ListItem>
                <ListItemAvatar>
                  <Avatar>
                    {getTypeIcon(template.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={template.name}
                  secondary={
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        {template.content}
                      </Typography>
                      <Chip 
                        label={template.type.toUpperCase()} 
                        size="small" 
                        variant="outlined" 
                      />
                    </Box>
                  }
                />
                <IconButton>
                  <MoreVert />
                </IconButton>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setTemplateOpen(false)}>Fechar</Button>
        <Button variant="contained" startIcon={<Add />}>
          Novo Template
        </Button>
      </DialogActions>
    </Dialog>
  );

  if (isLoading || !messagesData) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Carregando comunicações...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          💬 Comunicações
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Settings />}
            onClick={() => setTemplateOpen(true)}
          >
            Templates
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setComposeOpen(true)}
          >
            Nova Mensagem
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4">{messagesData.stats.total}</Typography>
              <Typography color="textSecondary">Total de Mensagens</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WhatsApp sx={{ fontSize: 40, color: '#25d366', mb: 1 }} />
              <Typography variant="h4">{messagesData.stats.whatsapp}</Typography>
              <Typography color="textSecondary">WhatsApp</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Email sx={{ fontSize: 40, color: '#ea4335', mb: 1 }} />
              <Typography variant="h4">{messagesData.stats.email}</Typography>
              <Typography color="textSecondary">Emails</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Sms sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
              <Typography variant="h4">{messagesData.stats.sms}</Typography>
              <Typography color="textSecondary">SMS</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab 
              label={
                <Badge badgeContent={messagesData.stats.unread} color="error">
                  Mensagens
                </Badge>
              } 
              icon={<Email />} 
              iconPosition="start" 
            />
            <Tab label="Templates" icon={<Group />} iconPosition="start" />
            <Tab label="Automação" icon={<Schedule />} iconPosition="start" />
            <Tab label="Configurações" icon={<Settings />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Messages Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 2 }}>
            {/* Filters */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
                sx={{ flex: 1 }}
              />
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={filterType}
                  label="Tipo"
                  onChange={(e) => setFilterType(e.target.value as any)}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="sms">SMS</MenuItem>
                </Select>
              </FormControl>
              
              <IconButton onClick={() => refetch()}>
                <Refresh />
              </IconButton>
            </Box>

            {/* Messages List */}
            <List>
              {filteredMessages.map((message) => (
                <React.Fragment key={message.id}>
                  <ListItem
                    onClick={() => setSelectedMessage(message)}
                    sx={{ 
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'action.hover' },
                      borderRadius: 1,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        {getTypeIcon(message.type)}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {message.from} → {message.to}
                          </Typography>
                          {message.starred && <Star sx={{ color: 'orange', fontSize: 16 }} />}
                          {message.orderId && (
                            <Chip label={message.orderId} size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          {message.subject && (
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {message.subject}
                            </Typography>
                          )}
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {message.content.length > 100 
                              ? `${message.content.substring(0, 100)}...` 
                              : message.content
                            }
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={getStatusLabel(message.status)} 
                              color={getStatusColor(message.status) as any}
                              size="small" 
                            />
                            <Typography variant="caption" color="textSecondary">
                              {formatTime(message.timestamp)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    
                    <IconButton onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }}>
                      <MoreVert />
                    </IconButton>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>

            {filteredMessages.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">
                  Nenhuma mensagem encontrada
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Templates Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Templates de Mensagem
            </Typography>
            
            <TemplateDialog />
            
            <List>
              {templates.map((template) => (
                <React.Fragment key={template.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        {getTypeIcon(template.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={template.name}
                      secondary={template.content}
                    />
                    <Button variant="outlined" size="small">
                      Usar
                    </Button>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        </TabPanel>

        {/* Automation Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Automação de Mensagens
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Confirmação de Pedido
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Enviada automaticamente quando um pedido é criado
                    </Typography>
                    <Chip label="Ativo" color="success" size="small" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Código de Rastreamento
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Enviada quando o pedido é despachado
                    </Typography>
                    <Chip label="Ativo" color="success" size="small" />
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Pagamento Aprovado
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Enviada quando o pagamento é confirmado
                    </Typography>
                    <Chip label="Inativo" color="default" size="small" />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Configurações de Comunicação
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      🔔 Notificações
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>Mensagens não lidas</Typography>
                        <Button size="small">Configurar</Button>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>Falhas de entrega</Typography>
                        <Button size="small">Configurar</Button>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      🔗 Integrações
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>WhatsApp Business API</Typography>
                        <Chip label="Conectado" color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>SMTP Email</Typography>
                        <Chip label="Conectado" color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography>SMS Gateway</Typography>
                        <Chip label="Desconectado" color="error" size="small" />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Star sx={{ mr: 1 }} /> Destacar
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Reply sx={{ mr: 1 }} /> Responder
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Forward sx={{ mr: 1 }} /> Encaminhar
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <Archive sx={{ mr: 1 }} /> Arquivar
        </MenuItem>
      </Menu>

      {/* Compose Dialog */}
      <ComposeDialog />
    </Box>
  );
};

export default CommunicationsPage;