import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/zh-cn';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import React, { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { Provider } from 'react-redux';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

// Import i18n configuration
import './i18n';

// Configurações locais
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthProvider } from '@/providers/AuthProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { ThemeProvider as AppThemeProvider } from '@/providers/ThemeProvider';
import { persistor, store } from '@/store';

// Páginas
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { AnalyticsPage } from '@/pages/Analytics/AnalyticsPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { CommunicationsPage } from '@/pages/Communications/CommunicationsPage';
import { CustomersPage } from '@/pages/Customers/CustomersPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { OrderDetailsPage } from '@/pages/Orders/OrderDetailsPage';
import { OrdersPage } from '@/pages/Orders/OrdersPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { SuppliersPage } from '@/pages/Suppliers/SuppliersPage';

// Configurar dayjs para suporte internacional
dayjs.extend(utc);
dayjs.extend(timezone);

// Configurar locale dinamicamente baseado no idioma selecionado
const getLocaleFromLanguage = (language: string) => {
  switch (language) {
    case 'pt-BR':
      return 'pt-br';
    case 'zh-CN':
      return 'zh-cn';
    default:
      return 'en';
  }
};

// Detectar idioma atual e configurar dayjs
const currentLanguage = localStorage.getItem('i18nextLng') || 'pt-BR';
const dayjsLocale = getLocaleFromLanguage(currentLanguage);
dayjs.locale(dayjsLocale);

// Configurar timezone padrão (pode ser dinâmico baseado no país)
const defaultTimezone = currentLanguage === 'zh-CN' ? 'Asia/Shanghai' :
                       currentLanguage === 'en' ? 'America/New_York' :
                       'America/Sao_Paulo';
dayjs.tz.setDefault(defaultTimezone);

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente de rotas protegidas
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // TODO: Implementar verificação de autenticação
  const isAuthenticated = true; // Placeholder

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Provider store={store}>
          <PersistGate loading={<LoadingScreen />} persistor={persistor}>
            <QueryClientProvider client={queryClient}>
              <AppThemeProvider>
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale={dayjsLocale}
                >
                  <Suspense fallback={<LoadingScreen />}>
                    <AuthProvider>
                      <SocketProvider>
                        <Router>
                        <Routes>
                          {/* Rota de Login */}
                          <Route path="/login" element={<LoginPage />} />

                          {/* Rotas protegidas */}
                          <Route path="/" element={
                            <ProtectedRoute>
                              <DashboardLayout />
                            </ProtectedRoute>
                          }>
                            {/* Dashboard Principal */}
                            <Route index element={<DashboardPage />} />

                            {/* Gestão de Pedidos */}
                            <Route path="pedidos" element={<OrdersPage />} />
                            <Route path="pedidos/:id" element={<OrderDetailsPage />} />

                            {/* Gestão de Fornecedores */}
                            <Route path="fornecedores" element={<SuppliersPage />} />

                            {/* Gestão de Clientes */}
                            <Route path="clientes" element={<CustomersPage />} />

                            {/* Comunicações WhatsApp */}
                            <Route path="comunicacoes" element={<CommunicationsPage />} />

                            {/* Analytics e Relatórios */}
                            <Route path="analytics" element={<AnalyticsPage />} />

                            {/* Configurações */}
                            <Route path="configuracoes" element={<SettingsPage />} />
                          </Route>

                          {/* Rota 404 */}
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                        </Router>

                        {/* Notificações Toast */}
                        <Toaster
                        position="top-right"
                        reverseOrder={false}
                        gutter={8}
                        containerStyle={{
                          top: 80, // Abaixo do header
                        }}
                        toastOptions={{
                          duration: 4000,
                          style: {
                            background: '#fff',
                            color: '#333',
                            fontSize: '14px',
                            maxWidth: '400px',
                          },
                          success: {
                            iconTheme: {
                              primary: '#4caf50',
                              secondary: '#fff',
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: '#f44336',
                              secondary: '#fff',
                            },
                          },
                        }}
                        />
                      </SocketProvider>
                    </AuthProvider>
                  </Suspense>
                </LocalizationProvider>
              </AppThemeProvider>

              {/* React Query DevTools apenas em desenvolvimento */}
              {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools
                  initialIsOpen={false}
                  position="bottom-right"
                />
              )}
            </QueryClientProvider>
          </PersistGate>
        </Provider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
