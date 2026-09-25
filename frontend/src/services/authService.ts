import api from './api';
import { User } from '../types';

export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', { username, password });
  return response.data;
}

export async function getMe(): Promise<{ user: User }> {
  const response = await api.get<{ user: User }>('/auth/me');
  return response.data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    localStorage.removeItem('xentrix_token');
    localStorage.removeItem('xentrix_user');
  }
}
