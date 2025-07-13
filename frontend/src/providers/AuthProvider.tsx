import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  login, 
  logout, 
  refreshAccessToken, 
  fetchCurrentUser, 
  selectAuth,
  setToken 
} from '../store/slices/authSlice';

// Types
interface AuthContextType {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  user: any;
  loading: boolean;
  error: string | null;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Set token in store
          dispatch(setToken(token));
          
          // Fetch current user
          try {
            await dispatch(fetchCurrentUser()).unwrap();
          } catch (error) {
            // If fetching user fails, try to refresh token
            try {
              await dispatch(refreshAccessToken()).unwrap();
              await dispatch(fetchCurrentUser()).unwrap();
            } catch (refreshError) {
              // If refresh also fails, clear auth
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, [dispatch]);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        await dispatch(refreshAccessToken()).unwrap();
      } catch (error) {
        console.error('Auto-refresh failed:', error);
        // If auto-refresh fails, logout
        handleLogout();
      }
    }, 30 * 60 * 1000); // Refresh every 30 minutes

    return () => clearInterval(refreshInterval);
  }, [auth.isAuthenticated, dispatch]);

  // Handle login
  const handleLogin = async (email: string, password: string) => {
    try {
      await dispatch(login({ email, password })).unwrap();
    } catch (error) {
      throw error;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle token refresh
  const handleRefreshToken = async () => {
    try {
      await dispatch(refreshAccessToken()).unwrap();
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value: AuthContextType = {
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    loading: auth.isLoading,
    error: auth.error,
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div 
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f5f5f5'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e0e0e0',
              borderTop: '4px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}
          />
          <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
            Inicializando FlowBot...
          </p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div 
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          }}
        >
          <div>Carregando...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // Redirect to login or show login form
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};

// Export default
export default AuthProvider;