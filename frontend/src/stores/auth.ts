import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { auth as authApi } from '@/api/endpoints';
import type { User, LoginCredentials, RegisterData } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);

  const login = async (credentials: LoginCredentials) => {
    loading.value = true;
    try {
      const response = await authApi.login(credentials);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', response.data.token);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    } finally {
      loading.value = false;
    }
  };

  const register = async (data: RegisterData) => {
    loading.value = true;
    try {
      const response = await authApi.register(data);
      token.value = response.data.token;
      user.value = response.data.user;
      localStorage.setItem('token', response.data.token);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  };

  const fetchUser = async () => {
    if (!token.value) return;

    loading.value = true;
    try {
      const response = await authApi.getMe();
      user.value = response.data.user;
    } catch (error) {
      logout();
    } finally {
      loading.value = false;
    }
  };

  const updateSettings = async (working_hours_start: number, working_hours_end: number) => {
    try {
      const response = await authApi.updateSettings({ working_hours_start, working_hours_end });
      user.value = response.data.user;
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  };

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUser,
    updateSettings
  };
});