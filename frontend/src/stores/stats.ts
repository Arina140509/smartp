import { defineStore } from 'pinia';
import { ref } from 'vue';
import { stats as statsApi } from '@/api/endpoints';
import type { Stats } from '@/types';

export const useStatsStore = defineStore('stats', () => {
  const stats = ref<Stats | null>(null);
  const loading = ref(false);

  const fetchStats = async (days: number = 30) => {
    loading.value = true;
    try {
      const response = await statsApi.get({ days });
      stats.value = response.data;
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    stats,
    loading,
    fetchStats
  };
});