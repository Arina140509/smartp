<template>
  <v-navigation-drawer v-model="drawer" right temporary width="400">
    <v-card class="h-100">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>🤖 Умный планировщик</span>
        <v-btn icon variant="text" @click="drawer = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-alert v-if="loading" type="info" class="mb-4">
          Анализирую ваше расписание...
        </v-alert>

        <template v-else-if="scheduledTasks.length > 0 || unscheduledTasks.length > 0">
          <!-- Распределенные задачи -->
          <div v-if="scheduledTasks.length > 0">
            <h3 class="text-h6 mb-2">✅ Распределенные задачи</h3>
            <v-list>
              <v-list-item
                v-for="task in scheduledTasks"
                :key="task.id"
                :class="`priority-${task.priority}`"
              >
                <template v-slot:prepend>
                  <v-icon :color="getPriorityColor(task.priority)">
                    {{ getPriorityIcon(task.priority) }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ task.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDate(task.scheduled_start) }} - {{ formatTime(task.scheduled_end) }}
                  ({{ getDuration(task.scheduled_start, task.scheduled_end) }} мин)
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    icon
                    size="small"
                    color="success"
                    @click="applyTask(task)"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Нераспределенные задачи -->
          <div v-if="unscheduledTasks.length > 0" class="mt-4">
            <h3 class="text-h6 mb-2">⚠️ Нераспределенные задачи</h3>
            <v-list>
              <v-list-item
                v-for="task in unscheduledTasks"
                :key="task.id"
                :class="`priority-${task.priority}`"
              >
                <template v-slot:prepend>
                  <v-icon :color="getPriorityColor(task.priority)">
                    {{ getPriorityIcon(task.priority) }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ task.title }}</v-list-item-title>
                <v-list-item-subtitle>
                  Нет свободного времени • {{ task.estimated_duration || 30 }} мин
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <v-btn
            v-if="scheduledTasks.length > 0"
            color="primary"
            block
            class="mt-4"
            @click="applyAll"
          >
            Применить все распланированные задачи
          </v-btn>
        </template>

        <v-alert v-else type="info">
          У вас нет нераспределенных задач. Создайте задачи, чтобы получить предложения по расписанию.
        </v-alert>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useScheduler } from '@/composables/useScheduler';
import { useEventsStore } from '@/stores/events';
import { useAuthStore } from '@/stores/auth';
import { format } from 'date-fns';
import type { Event } from '@/types';

const emit = defineEmits<{
  (e: string, tasks: Event[]): void;
}>();

const props = defineProps<{
  modelValue: boolean;
  tasks: Event[];
}>();

const drawer = ref(props.modelValue);
const scheduler = useScheduler();
const eventsStore = useEventsStore();
const authStore = useAuthStore();

const loading = ref(false);
const scheduledTasks = ref<any[]>([]);
const unscheduledTasks = ref<Event[]>([]);

watch(() => props.modelValue, (val) => {
  drawer.value = val;
  if (val) {
    generateSchedule();
  }
});

watch(drawer, (val) => {
  emit('update:modelValue', val);
});

const generateSchedule = async () => {
  if (props.tasks.length === 0) return;

  loading.value = true;

  // Берем ближайшие 7 дней
  const startDate = new Date();
  const workStart = authStore.user?.working_hours_start || 9;
  const workEnd = authStore.user?.working_hours_end || 21;

  // Используем локальный алгоритм
  const result = scheduler.quickSchedule(
    props.tasks,
    eventsStore.busySlots,
    startDate,
    workStart,
    workEnd
  );

  scheduledTasks.value = result.scheduled;
  unscheduledTasks.value = result.unscheduled;

  loading.value = false;
};

const formatDate = (date: Date) => {
  return format(date, 'dd.MM');
};

const formatTime = (date: Date) => {
  return format(date, 'HH:mm');
};

const getDuration = (start: Date, end: Date) => {
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  return minutes;
};

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'primary';
  }
};

const getPriorityIcon = (priority: string) => {
  switch(priority) {
    case 'high': return 'mdi-alert-circle';
    case 'medium': return 'mdi-alert';
    case 'low': return 'mdi-information';
    default: return 'mdi-calendar';
  }
};

const applyTask = async (task: any) => {
  await eventsStore.updateEvent(task.id, {
    start_time: task.scheduled_start.toISOString(),
    end_time: task.scheduled_end.toISOString()
  });

  // Удаляем из списка
  scheduledTasks.value = scheduledTasks.value.filter(t => t.id !== task.id);
};

const applyAll = async () => {
  for (const task of scheduledTasks.value) {
    await eventsStore.updateEvent(task.id, {
      start_time: task.scheduled_start.toISOString(),
      end_time: task.scheduled_end.toISOString()
    });
  }

  scheduledTasks.value = [];
  emit('apply', scheduledTasks.value);
};
</script>

<style scoped>
.h-100 {
  height: 100%;
}

.priority-high {
  border-left: 4px solid #f44336;
}

.priority-medium {
  border-left: 4px solid #ff9800;
}

.priority-low {
  border-left: 4px solid #4caf50;
}
</style>