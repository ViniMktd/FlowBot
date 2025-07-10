import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Chip,
  Paper,
  useTheme,
  useMediaQuery,
  Collapse,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Business as SuppliersIcon,
  Chat as CommunicationsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ExpandLess,
  ExpandMore,
  Language as LanguageIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Help as HelpIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LanguageSelector } from '@/components/LanguageSelector';

const drawerWidth = 280;

// Mock user data
const mockUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@flowbot.com',
  role: 'ADMIN',
  avatar: null,
  lastLogin: new Date().toISOString(),
  permissions: ['read', 'write', 'admin'],
  notificationCount: 3,
};

// Navigation items
const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <DashboardIcon />,
    path: '/',
    badge: null,
  },
  {
    id: 'orders',
    label: 'Pedidos',
    icon: <OrdersIcon />,
    path: '/pedidos',
    badge: 12, // Pedidos pendentes
    children: [
      { id: 'orders-list', label: 'Lista de Pedidos', path: '/pedidos' },
      { id: 'orders-new', label: 'Novo Pedido', path: '/pedidos/novo' },
      { id: 'orders-tracking', label: 'Rastreamento', path: '/pedidos/rastreamento' },
    ],
  },
  {
    id: 'customers',
    label: 'Clientes',
    icon: <CustomersIcon />,
    path: '/clientes',
    badge: null,
  },
  {
    id: 'suppliers',
    label: 'Fornecedores',
    icon: <SuppliersIcon />,
    path: '/fornecedores',
    badge: null,
    children: [
      { id: 'suppliers-list', label: 'Lista de Fornecedores', path: '/fornecedores' },
      { id: 'suppliers-performance', label: 'Performance', path: '/fornecedores/performance' },
      { id: 'suppliers-chinese', label: 'Fornecedores Chineses', path: '/fornecedores/chineses' },
    ],
  },
  {
    id: 'communications',
    label: 'Comunicações',
    icon: <CommunicationsIcon />,
    path: '/comunicacoes',
    badge: 5, // Mensagens não lidas
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <AnalyticsIcon />,
    path: '/analytics',
    badge: null,
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <SettingsIcon />,
    path: '/configuracoes',
    badge: null,
    children: [
      { id: 'settings-general', label: 'Geral', path: '/configuracoes/geral' },
      { id: 'settings-integrations', label: 'Integrações', path: '/configuracoes/integracoes' },
      { id: 'settings-users', label: 'Usuários', path: '/configuracoes/usuarios' },
      { id: 'settings-security', label: 'Segurança', path: '/configuracoes/seguranca' },
    ],
  },
];

export const DashboardLayout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(['orders']);
  const [darkMode, setDarkMode] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    navigate('/login');
  };

  const handleItemExpand = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActiveRoute = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'ADMIN': 'error',
      'MANAGER': 'warning',
      'USER': 'primary',
      'READONLY': 'default',
    };
    return colors[role as keyof typeof colors] || 'default';
  };

  const mockNotifications = [
    { id: 1, title: 'Novo pedido recebido', message: 'Pedido #BR-001-2025', time: '2 min atrás', unread: true },
    { id: 2, title: 'Fornecedor respondeu', message: 'Shenzhen Electronics confirmou pedido', time: '15 min atrás', unread: true },
    { id: 3, title: 'Entrega realizada', message: 'Pedido #US-003-2025 entregue', time: '1h atrás', unread: false },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
            🤖
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="primary">
              FlowBot
            </Typography>
            <Typography variant="caption" color="text.secondary">
              v2.0.0 • International
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* User Info */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>
            {mockUser.name.charAt(0)}
          </Avatar>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {mockUser.name}
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={mockUser.role} 
                size="small" 
                color={getRoleColor(mockUser.role) as any}
                variant="outlined"
              />
              <Typography variant="caption" color="text.secondary">
                Online
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, py: 1 }}>
        {navigationItems.map((item) => (
          <Box key={item.id}>
            <ListItem disablePadding>
              <ListItemButton
                selected={isActiveRoute(item.path)}
                onClick={() => {
                  if (item.children) {
                    handleItemExpand(item.id);
                  } else {
                    navigate(item.path);
                  }
                }}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    borderLeft: 3,
                    borderLeftColor: 'primary.main',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActiveRoute(item.path) ? 'primary.main' : 'inherit' }}>
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error" max={99}>
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                  primaryTypographyProps={{
                    fontWeight: isActiveRoute(item.path) ? 'bold' : 'normal',
                  }}
                />
                {item.children && (
                  expandedItems.includes(item.id) ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {/* Sub-items */}
            {item.children && (
              <Collapse in={expandedItems.includes(item.id)} timeout="auto">
                <List disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.id} disablePadding>
                      <ListItemButton
                        selected={isActiveRoute(child.path)}
                        onClick={() => navigate(child.path)}
                        sx={{
                          pl: 4,
                          borderRadius: 1,
                          mx: 1,
                          mb: 0.5,
                          '&.Mui-selected': {
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <ListItemText 
                          primary={child.label}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: isActiveRoute(child.path) ? 'bold' : 'normal',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}
      </List>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Paper sx={{ p: 1, bgcolor: 'primary.50', border: 1, borderColor: 'primary.100' }}>
          <Typography variant="caption" color="primary.main" fontWeight="bold">
            🌍 Sistema Internacional
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Pronto para fornecedores chineses
          </Typography>
        </Paper>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {/* Dynamic page title based on route */}
            {location.pathname === '/' && 'Dashboard'}
            {location.pathname.startsWith('/pedidos') && 'Pedidos'}
            {location.pathname.startsWith('/clientes') && 'Clientes'}
            {location.pathname.startsWith('/fornecedores') && 'Fornecedores'}
            {location.pathname.startsWith('/comunicacoes') && 'Comunicações'}
            {location.pathname.startsWith('/analytics') && 'Analytics'}
            {location.pathname.startsWith('/configuracoes') && 'Configurações'}
          </Typography>

          {/* Actions */}
          <Box display="flex" alignItems="center" gap={1}>
            <LanguageSelector variant="minimal" />

            <Tooltip title="Alternar tema">
              <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notificações">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge badgeContent={mockUser.notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Perfil do usuário">
              <IconButton color="inherit" onClick={handleUserMenuOpen}>
                <Avatar sx={{ width: 32, height: 32 }}>
                  {mockUser.name.charAt(0)}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'grey.50',
        }}
      >
        <Toolbar /> {/* Space for fixed app bar */}
        <Outlet />
      </Box>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleUserMenuClose}
        onClick={handleUserMenuClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight="bold">
            {mockUser.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {mockUser.email}
          </Typography>
        </Box>
        <MenuItem onClick={() => navigate('/perfil')}>
          <AccountIcon sx={{ mr: 1 }} />
          Meu Perfil
        </MenuItem>
        <MenuItem onClick={() => navigate('/configuracoes')}>
          <SettingsIcon sx={{ mr: 1 }} />
          Configurações
        </MenuItem>
        <MenuItem>
          <SecurityIcon sx={{ mr: 1 }} />
          Segurança
        </MenuItem>
        <MenuItem>
          <HelpIcon sx={{ mr: 1 }} />
          Ajuda
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 1 }} />
          Sair
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: { maxWidth: 350, minWidth: 300 }
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Notificações
          </Typography>
        </Box>
        {mockNotifications.map((notification) => (
          <MenuItem key={notification.id} sx={{ py: 1, px: 2 }}>
            <Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {notification.title}
                </Typography>
                {notification.unread && (
                  <Box sx={{ width: 8, height: 8, bgcolor: 'error.main', borderRadius: '50%' }} />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {notification.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {notification.time}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={handleNotificationClose} sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            Ver todas as notificações
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};