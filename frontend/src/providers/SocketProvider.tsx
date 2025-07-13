import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '../store/hooks';
import { addNotification } from '../store/slices/notificationSlice';
import { useAuth } from './AuthProvider';

// Types
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
}

// Create context
const SocketContext = createContext<SocketContextType | undefined>(undefined);

// Provider component
export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    let socketInstance: Socket | null = null;

    if (isAuthenticated && user) {
      // Create socket connection
      socketInstance = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001', {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Connection event handlers
      socketInstance.on('connect', () => {
        console.log('Connected to FlowBot server');
        setIsConnected(true);
        setError(null);
        
        // Join user-specific room
        socketInstance?.emit('join-user-room', { userId: user.id });
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from FlowBot server');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
        setError(err.message);
        setIsConnected(false);
      });

      socketInstance.on('reconnect', (attemptNumber) => {
        console.log(`Reconnected to FlowBot server after ${attemptNumber} attempts`);
        setIsConnected(true);
        setError(null);
      });

      socketInstance.on('reconnect_error', (err) => {
        console.error('Socket reconnection error:', err);
        setError(err.message);
      });

      // Business logic event handlers
      socketInstance.on('order-status-update', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Atualização do Pedido',
          message: `Pedido #${data.orderNumber} foi atualizado para: ${data.status}`,
          duration: 5000,
        }));
      });

      socketInstance.on('new-order', (data) => {
        dispatch(addNotification({
          type: 'success',
          title: 'Novo Pedido',
          message: `Novo pedido recebido: #${data.orderNumber}`,
          duration: 5000,
        }));
      });

      socketInstance.on('supplier-response', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Resposta do Fornecedor',
          message: `${data.supplierName} respondeu ao pedido #${data.orderNumber}`,
          duration: 5000,
        }));
      });

      socketInstance.on('tracking-update', (data) => {
        dispatch(addNotification({
          type: 'info',
          title: 'Atualização de Rastreamento',
          message: `Pedido #${data.orderNumber}: ${data.status}`,
          duration: 5000,
        }));
      });

      socketInstance.on('payment-update', (data) => {
        const type = data.status === 'approved' ? 'success' : 
                    data.status === 'rejected' ? 'error' : 'warning';
                    
        dispatch(addNotification({
          type,
          title: 'Atualização de Pagamento',
          message: `Pagamento do pedido #${data.orderNumber}: ${data.status}`,
          duration: 5000,
        }));
      });

      socketInstance.on('system-notification', (data) => {
        dispatch(addNotification({
          type: data.type || 'info',
          title: data.title || 'Notificação do Sistema',
          message: data.message,
          duration: data.duration || 5000,
        }));
      });

      socketInstance.on('error', (data) => {
        dispatch(addNotification({
          type: 'error',
          title: 'Erro do Sistema',
          message: data.message || 'Ocorreu um erro no sistema',
          duration: 8000,
        }));
      });

      setSocket(socketInstance);
    }

    return () => {
      if (socketInstance) {
        console.log('Cleaning up socket connection');
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated, user, dispatch]);

  // Emit function
  const emit = (event: string, data?: any) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  // Subscribe function with cleanup
  const subscribe = (event: string, callback: (data: any) => void) => {
    if (socket) {
      socket.on(event, callback);
      
      // Return cleanup function
      return () => {
        socket.off(event, callback);
      };
    }
    
    // Return no-op cleanup if no socket
    return () => {};
  };

  // Context value
  const value: SocketContextType = {
    socket,
    isConnected,
    error,
    emit,
    subscribe,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

// Hook to use socket context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Custom hooks for specific socket events
export const useOrderUpdates = (callback: (data: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    const cleanup = subscribe('order-status-update', callback);
    return cleanup;
  }, [subscribe, callback]);
};

export const useNewOrders = (callback: (data: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    const cleanup = subscribe('new-order', callback);
    return cleanup;
  }, [subscribe, callback]);
};

export const useTrackingUpdates = (callback: (data: any) => void) => {
  const { subscribe } = useSocket();
  
  useEffect(() => {
    const cleanup = subscribe('tracking-update', callback);
    return cleanup;
  }, [subscribe, callback]);
};

// Export default
export default SocketProvider;