import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { setLanguage } from '../i18n';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'employee';
  profile_picture?: string;
  language: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<{ reset_code?: string; message: string }>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('auth_token');
      const storedUser = await AsyncStorage.getItem('auth_user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Set language from user preference
        if (parsedUser.language) {
          await setLanguage(parsedUser.language);
        }
        
        // Verify token is still valid
        try {
          const response = await axios.get(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          await AsyncStorage.setItem('auth_user', JSON.stringify(response.data));
        } catch (error) {
          // Token invalid, clear storage
          await AsyncStorage.removeItem('auth_token');
          await AsyncStorage.removeItem('auth_user');
          setToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Error loading auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('auth_token', access_token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
    
    if (userData.language) {
      await setLanguage(userData.language);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      email,
      password,
      name
    });
    
    const { access_token, user: userData } = response.data;
    
    await AsyncStorage.setItem('auth_token', access_token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
    
    setToken(access_token);
    setUser(userData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      AsyncStorage.setItem('auth_user', JSON.stringify(updated));
    }
  };

  const forgotPassword = async (email: string) => {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    return response.data;
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    await axios.post(`${API_URL}/api/auth/reset-password`, {
      email,
      reset_code: code,
      new_password: newPassword
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateUser,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
