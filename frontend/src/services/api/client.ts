import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../../store';
import { logout, refreshAccessToken } from '../../store/slices/authSlice';
import { addNotification } from '../../store/slices/notificationSlice';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
  
  const client = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add auth token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add language header
      const language = store.getState().ui.language;
      config.headers['Accept-Language'] = language;
      
      // Add timezone header
      config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors and token refresh
  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      // Handle network errors
      if (!error.response) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Erro de Conexão',
          message: 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet.',
          duration: 8000,
        }));
        return Promise.reject(error);
      }

      const { status, data } = error.response;

      // Handle 401 Unauthorized
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Try to refresh the token
          await store.dispatch(refreshAccessToken()).unwrap();
          
          // Retry the original request with new token
          const token = localStorage.getItem('token');
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          store.dispatch(logout());
          store.dispatch(addNotification({
            type: 'warning',
            title: 'Sessão Expirada',
            message: 'Sua sessão expirou. Por favor, faça login novamente.',
            duration: 6000,
          }));
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 Forbidden
      if (status === 403) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Acesso Negado',
          message: 'Você não tem permissão para realizar esta ação.',
          duration: 6000,
        }));
      }

      // Handle 429 Too Many Requests
      if (status === 429) {
        store.dispatch(addNotification({
          type: 'warning',
          title: 'Muitas Tentativas',
          message: 'Muitas tentativas. Aguarde um momento antes de tentar novamente.',
          duration: 6000,
        }));
      }

      // Handle 500 Server Error
      if (status >= 500) {
        store.dispatch(addNotification({
          type: 'error',
          title: 'Erro do Servidor',
          message: 'Erro interno do servidor. Tente novamente mais tarde.',
          duration: 8000,
        }));
      }

      // Handle validation errors (422)
      if (status === 422 && data.errors) {
        const errorMessages = Object.values(data.errors).flat().join(', ');
        store.dispatch(addNotification({
          type: 'error',
          title: 'Erro de Validação',
          message: errorMessages,
          duration: 6000,
        }));
      }

      return Promise.reject(error);
    }
  );

  return client;
};

// Create the API client instance
export const apiClient = createApiClient();

// Generic API methods
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response.data;
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response.data;
  },

  // Upload file
  upload: async <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> => {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await apiClient.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  },

  // Download file
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: 'blob',
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  },
};

export default api;