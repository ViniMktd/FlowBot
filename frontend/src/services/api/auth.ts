import { api, ApiResponse } from './client';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// Auth API service
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/login', credentials);
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    return api.post('/auth/logout');
  },

  // Refresh token
  refreshToken: async (data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> => {
    return api.post('/auth/refresh', data);
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<LoginResponse['user']>> => {
    return api.get('/auth/me');
  },

  // Register (if enabled)
  register: async (data: RegisterRequest): Promise<ApiResponse<LoginResponse>> => {
    return api.post('/auth/register', data);
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return api.post('/auth/forgot-password', data);
  },

  // Reset password
  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> => {
    return api.post('/auth/reset-password', data);
  },

  // Change password
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<ApiResponse<{ message: string }>> => {
    return api.put('/auth/change-password', data);
  },

  // Update profile
  updateProfile: async (data: {
    name?: string;
    email?: string;
  }): Promise<ApiResponse<LoginResponse['user']>> => {
    return api.put('/auth/profile', data);
  },
};

export default authApi;