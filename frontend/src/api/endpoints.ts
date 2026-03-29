import api from './index';
import type { Event, TimeSlot, Stats, LoginCredentials, RegisterData, AuthResponse } from '@/types';

export const auth = {
  login: (data: LoginCredentials) => api.post<AuthResponse>('/auth/login', data),
  register: (data: RegisterData) => api.post<AuthResponse>('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateSettings: (data: { working_hours_start: number; working_hours_end: number }) =>
    api.put('/auth/settings', data),
};

export const events = {
  getAll: (params?: { start?: string; end?: string }) => api.get<Event[]>('/events', { params }),
  create: (data: Partial<Event>) => api.post<Event>('/events', data),
  update: (id: string, data: Partial<Event>) => api.put<Event>(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  complete: (id: string) => api.post<Event>(`/events/${id}/complete`),
};

export const slots = {
  getAll: (params?: { start?: string; end?: string }) => api.get<TimeSlot[]>('/slots', { params }),
  create: (data: Partial<TimeSlot>) => api.post<TimeSlot>('/slots', data),
  update: (id: string, data: Partial<TimeSlot>) => api.put<TimeSlot>(`/slots/${id}`, data),
  delete: (id: string) => api.delete(`/slots/${id}`),
};

export const stats = {
  get: (params?: { days?: number }) => api.get<Stats>('/stats', { params }),
};