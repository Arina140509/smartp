<template>
  <v-container>
    <v-row v-if="loading">
      <v-col cols="12">
        <LoadingSpinner />
      </v-col>
    </v-row>

    <template v-else-if="stats">
      <v-row>
        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h3">{{ stats.overview.completionRate }}%</div>
              <div class="text-subtitle-1">Выполнение задач</div>
              <v-progress-circular
                :model-value="stats.overview.completionRate"
                :size="80"
                :width="8"
                color="primary"
                class="mt-2"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h3">{{ stats.overview.completedTasks }}</div>
              <div class="text-subtitle-1">Выполнено задач</div>
              <v-icon size="40" color="success" class="mt-2">mdi-check-circle</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h3">{{ stats.overview.pendingTasks }}</div>
              <div class="text-subtitle-1">Ожидают выполнения</div>
              <v-icon size="40" color="warning" class="mt-2">mdi-clock-outline</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h3">{{ stats.overview.totalTasks }}</div>
              <div class="text-subtitle-1">Всего задач</div>
              <v-icon size="40" color="info" class="mt-2">mdi-format-list-checks</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title>Динамика выполнения</v-card-title>
            <v-card-text>
              <CompletionChart :data="stats.dailyData" />
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Приоритеты задач</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item v-for="(priority, key) in stats.priorityStats" :key="key">
                  <v-list-item-title>
                    {{ getPriorityName(key) }}
                  </v-list-item-title>
                  <v-list-item-subtitle>
                    Выполнено: {{ priority.completed }} / {{ priority.total }}
                    ({{ priority.total === 0 ? 0 : Math.round(priority.completed / priority.total * 100) }}%)
                  </v-list-item-subtitle>
                  <v-progress-linear
                    :model-value="priority.total === 0 ? 0 : priority.completed / priority.total * 100"
                    :color="getPriorityColor(key)"
                    height="8"
                    class="mt-2"
                  />
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title>Продуктивность по часам</v-card-title>
            <v-card-text>
              <ProductivityHeatmap :data="stats.hourlyProductivity" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useStatsStore } from '@/stores/stats';
import LoadingSpinner from '@/components/common/LoadingSpinner.vue';
import CompletionChart from './CompletionChart.vue';
import ProductivityHeatmap from './ProductivityHeatmap.vue';

const statsStore = useStatsStore();
const stats = statsStore.stats;
const loading = statsStore.loading;

const getPriorityName = (priority: string) => {
  switch(priority) {
    case 'high': return 'Высокий приоритет';
    case 'medium': return 'Средний приоритет';
    case 'low': return 'Низкий приоритет';
    default: return priority;
  }
};

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'primary';
  }
};

onMounted(() => {
  statsStore.fetchStats();
});
</script>