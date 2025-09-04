import * as SecureStore from 'expo-secure-store';
import { User } from '@/store/useStore';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'senior' | 'family' | 'caregiver';
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  emergencyContacts?: string[];
  familyMembers?: string[];
  isVerified: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'senior' | 'family' | 'caregiver';
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';

  // API endpoints - update this to your backend URL
  // For Vercel deployment, this will be your Vercel URL
  private readonly API_BASE = process.env.EXPO_PUBLIC_API_URL || 'https://seniorcare-backend.vercel.app/api';

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE.replace('/api', '')}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      return response.ok && data.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Login failed');
      }

      const authResponse: AuthResponse = {
        user: data.data.user,
        token: data.data.accessToken,
        refreshToken: data.data.refreshToken,
      };

      // Store tokens securely
      await this.storeTokens(authResponse.token, authResponse.refreshToken);
      await this.storeUser(authResponse.user);

      return authResponse;
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
      }

      if (!responseData.success) {
        throw new Error(responseData.message || 'Registration failed');
      }

      const authResponse: AuthResponse = {
        user: responseData.data.user,
        token: responseData.data.accessToken,
        refreshToken: responseData.data.refreshToken,
      };

      // Store tokens securely
      await this.storeTokens(authResponse.token, authResponse.refreshToken);
      await this.storeUser(authResponse.user);

      return authResponse;
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.USER_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  async getStoredUser(): Promise<AuthUser | null> {
    try {
      const userData = await SecureStore.getItemAsync(this.USER_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const refreshToken = await SecureStore.getItemAsync(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        return null;
      }

      const response = await fetch(`${this.API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Refresh token is invalid, clear stored tokens
        await this.logout();
        return null;
      }

      const newToken = data.data.accessToken;
      await SecureStore.setItemAsync(this.TOKEN_KEY, newToken);
      
      return newToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      await this.logout();
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await this.getStoredToken();
      const user = await this.getStoredUser();
      return !!(token && user);
    } catch (error) {
      return false;
    }
  }

  async forgotPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send password reset email');
      }

      if (!data.success) {
        throw new Error(data.message || 'Failed to send password reset email');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to send password reset email');
    }
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Email verification failed');
      }

      if (!data.success) {
        throw new Error(data.message || 'Email verification failed');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw new Error(error instanceof Error ? error.message : 'Email verification failed');
    }
  }

  private async storeTokens(token: string, refreshToken: string): Promise<void> {
    await SecureStore.setItemAsync(this.TOKEN_KEY, token);
    await SecureStore.setItemAsync(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private async storeUser(user: AuthUser): Promise<void> {
    await SecureStore.setItemAsync(this.USER_KEY, JSON.stringify(user));
  }


  // Helper method to convert AuthUser to store User format
  convertToStoreUser(authUser: AuthUser): User {
    return {
      id: authUser.id,
      name: authUser.name,
      email: authUser.email,
      role: authUser.role,
      avatar: authUser.avatar,
    };
  }
}

export const authService = new AuthService();
