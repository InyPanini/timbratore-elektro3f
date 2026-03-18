import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = "https://timbratore-elektro3f-backend.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== DATE / TIME HELPERS ====================

export const formatDateTimeItaly = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeItaly = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleTimeString('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateItaly = (dateString?: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// ==================== SHIFT ACTIONS ====================

export const recordShiftAction = async (data: {
  action_type: 'start' | 'end' | 'pause_start' | 'pause_end';
  latitude?: number;
  longitude?: number;
  address?: string;
  notes?: string;
}) => {
  const response = await api.post('/shifts/action', data);
  return response.data;
};

export const getCurrentShiftStatus = async () => {
  const response = await api.get('/shifts/current-status');
  return response.data;
};

export const getTodayShifts = async () => {
  const response = await api.get('/shifts/today');
  return response.data;
};

export const getShiftHistory = async (days: number = 30) => {
  const response = await api.get(`/shifts/history?days=${days}`);
  return response.data;
};

export const getDailySummary = async (date: string) => {
  const response = await api.get(`/shifts/daily-summary/${date}`);
  return response.data;
};

// ==================== MONTHLY REPORTS ====================

export const getMonthlyReport = async (year: number, month: number) => {
  const response = await api.get(`/reports/monthly/${year}/${month}`);
  return response.data;
};

export const signMonthlyReport = async (year: number, month: number, signature: string) => {
  const response = await api.post(`/reports/monthly/${year}/${month}/sign`, { signature });
  return response.data;
};

// ==================== USER PROFILE ====================

export const updateProfile = async (data: {
  name?: string;
  language?: string;
  profile_picture?: string;
}) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
  const response = await api.put('/users/me/password', {
    current_password: currentPassword,
    new_password: newPassword
  });
  return response.data;
};

// ==================== ADMIN APIs ====================

export const getAllEmployees = async () => {
  const response = await api.get('/admin/employees');
  return response.data;
};

export const getEmployeeShifts = async (employeeId: string, days: number = 30) => {
  const response = await api.get(`/admin/employees/${employeeId}/shifts?days=${days}`);
  return response.data;
};

export const getEmployeeLocations = async (employeeId: string, date?: string) => {
  const url =
    date
      ? `/admin/employees/${employeeId}/locations?date=${date}`
      : `/admin/employees/${employeeId}/locations`;
  const response = await api.get(url);
  return response.data;
};

export const getUnsignedReports = async () => {
  const response = await api.get('/admin/reports/unsigned');
  return response.data;
};

export const getReportDetails = async (reportId: string) => {
  const response = await api.get(`/admin/reports/${reportId}`);
  return response.data;
};

export const counterSignReport = async (reportId: string, signature: string) => {
  const response = await api.post(`/admin/reports/${reportId}/countersign`, { signature });
  return response.data;
};

export const getTodayActivity = async () => {
  const response = await api.get('/admin/today-activity');
  return response.data;
};

export default api;