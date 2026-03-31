<template>
  <v-navigation-drawer v-model="drawer" right temporary width="450">
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

        <v-alert v-if="hasPastTasks" type="warning" class="mb-4">
          <strong>⚠️ Внимание!</strong> У вас есть задачи, которые уже должны были быть выполнены.<br>
          Планировщик распределит их на ближайшее свободное время.
        </v-alert>

        <v-alert v-if="debugInfo" type="info" class="mb-4" variant="tonal">
          <strong>📊 Информация о расписании:</strong><br>
          Задач для распределения: {{ tasks.length }}<br>
          Занятых слотов: {{ eventsStore.busySlots.length }}<br>
          Найдено свободных слотов на сегодня: {{ todayFreeSlotsCount }}
        </v-alert>

        <template v-if="scheduledTasks.length > 0 || unscheduledTasks.length > 0">
          <!-- Распределенные задачи -->
          <div v-if="scheduledTasks.length > 0">
            <h3 class="text-h6 mb-2">✅ Распределенные задачи ({{ scheduledTasks.length }})</h3>
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
                  {{ formatDate(task.scheduled_start) }} {{ formatTime(task.scheduled_start) }}–{{ formatTime(task.scheduled_end) }}
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
            <h3 class="text-h6 mb-2">⚠️ Нераспределенные задачи ({{ unscheduledTasks.length }})</h3>
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
                  ⏰ {{ task.estimated_duration || 30 }} мин •
                  Не хватает свободного времени в ближайшие 7 дней
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
            Применить все ({{ scheduledTasks.length }}) задач
          </v-btn>
        </template>

        <v-alert v-else-if="!loading" type="info">
          <strong>📭 Нет задач для распределения</strong><br>
          Создайте новые задачи или отметьте существующие как "в процессе".
        </v-alert>

        <v-alert v-if="scheduledTasks.length === 0 && unscheduledTasks.length === 0 && tasks.length > 0 && !loading" type="warning" class="mt-4">
          <strong>⚠️ Не удалось найти свободное время</strong><br>
          Проверьте:
          <ul class="mt-2">
            <li>Есть ли у вас свободные слоты в календаре?</li>
            <li>Не добавлены ли занятые слоты на всё время?</li>
            <li>Возможно, все задачи уже распределены</li>
          </ul>
        </v-alert>
      </v-card-text>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useScheduler } from '@/composables/useScheduler';
import { useEventsStore } from '@/stores/events';
import { useAuthStore } from '@/stores/auth';
import { format, isBefore } from 'date-fns';
import type { Event } from '@/types';

const emit = defineEmits<{
  (e: 'apply', tasks: Event[]): void;
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

// Подсчет свободных слотов на сегодня для отладки
const todayFreeSlotsCount = computed(() => {
  const now = new Date();
  const workStart = authStore.user?.working_hours_start || 9;
  const workEnd = authStore.user?.working_hours_end || 21;
  const slots = scheduler.findFreeSlots(eventsStore.busySlots, now, workStart, workEnd);
  return slots.length;
});

const hasPastTasks = computed(() => {
  const now = new Date();
  return props.tasks.some(task => {
    const taskStart = new Date(task.start_time);
    return isBefore(taskStart, now);
  });
});

const debugInfo = ref(true);

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
  if (props.tasks.length === 0) {
    console.log('Нет задач для распределения');
    return;
  }

  loading.value = true;

  const startDate = new Date();
  const workStart = authStore.user?.working_hours_start || 9;
  const workEnd = authStore.user?.working_hours_end || 21;

  console.log('=== НАЧАЛО ПЛАНИРОВАНИЯ ===');
  console.log('Задачи:', props.tasks.map(t => ({ title: t.title, priority: t.priority, duration: t.estimated_duration })));
  console.log('Занятые слоты:', eventsStore.busySlots.map(s => ({ title: s.title, start: s.start_time, end: s.end_time })));
  console.log('Рабочие часы:', workStart, '-', workEnd);

  const result = scheduler.quickSchedule(
    props.tasks,
    eventsStore.busySlots,
    startDate,
    workStart,
    workEnd,
    7
  );

  scheduledTasks.value = result.scheduled;
  unscheduledTasks.value = result.unscheduled;

  console.log('=== РЕЗУЛЬТАТ ===');
  console.log('Распределено:', scheduledTasks.value.length);
  console.log('Не распределено:', unscheduledTasks.value.length);

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

  scheduledTasks.value = scheduledTasks.value.filter(t => t.id !== task.id);

  // Обновляем календарь
  const calendarApi = (window as any).calendarApi;
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }
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

  // Обновляем календарь
  const calendarApi = (window as any).calendarApi;
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }
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