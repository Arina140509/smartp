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
          <v-progress-circular indeterminate size="20" class="mr-2" />
          Анализирую ваше расписание...
        </v-alert>

        <v-alert v-if="hasPastTasks" type="warning" class="mb-4" closable>
          <strong>⚠️ Внимание!</strong> У вас есть задачи, которые уже должны были быть выполнены.<br>
          Планировщик распределит их на ближайшее свободное время.
        </v-alert>

        <v-alert v-if="debugInfo" type="info" class="mb-4" variant="tonal">
          <strong>📊 Информация о расписании:</strong><br>
          Задач для распределения: <strong>{{ tasks.length }}</strong><br>
          Занятых слотов: <strong>{{ eventsStore.busySlots.length }}</strong><br>
          Рабочее время: <strong>{{ workStart }}:00 — {{ workEnd }}:00</strong><br>
          Свободных слотов на сегодня: <strong>{{ todayFreeSlotsCount }}</strong>
        </v-alert>

        <template v-if="scheduledTasks.length > 0 || unscheduledTasks.length > 0">
          <!-- Распределенные задачи -->
          <div v-if="scheduledTasks.length > 0">
            <h3 class="text-h6 mb-2">
              ✅ Распределенные задачи
              <v-chip size="small" color="success" class="ml-2">{{ scheduledTasks.length }}</v-chip>
            </h3>
            <v-list>
              <v-list-item
                v-for="task in scheduledTasks"
                :key="task.id"
                :class="`priority-${task.priority}`"
              >
                <template v-slot:prepend>
                  <v-icon :color="getPriorityColor(task.priority)" size="24">
                    {{ getPriorityIcon(task.priority) }}
                  </v-icon>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ task.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  🕒 {{ formatDate(task.scheduled_start) }} {{ formatTime(task.scheduled_start) }} – {{ formatTime(task.scheduled_end) }}
                  ({{ getDuration(task.scheduled_start, task.scheduled_end) }} мин)
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    icon
                    size="small"
                    color="success"
                    variant="tonal"
                    @click="applyTask(task)"
                    title="Применить"
                  >
                    <v-icon>mdi-check</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <!-- Нераспределенные задачи -->
          <div v-if="unscheduledTasks.length > 0" class="mt-4">
            <h3 class="text-h6 mb-2">
              ⚠️ Нераспределенные задачи
              <v-chip size="small" color="warning" class="ml-2">{{ unscheduledTasks.length }}</v-chip>
            </h3>
            <v-list>
              <v-list-item
                v-for="task in unscheduledTasks"
                :key="task.id"
                :class="`priority-${task.priority}`"
              >
                <template v-slot:prepend>
                  <v-icon :color="getPriorityColor(task.priority)" size="24">
                    {{ getPriorityIcon(task.priority) }}
                  </v-icon>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ task.title }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  ⏰ {{ task.estimated_duration || 30 }} мин •
                  Не хватает свободного времени в ближайшие 7 дней
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </div>

          <div class="mt-6">
            <v-btn
              v-if="scheduledTasks.length > 0"
              color="primary"
              block
              size="large"
              @click="applyAll"
              :loading="applyingAll"
            >
              <v-icon left>mdi-check-all</v-icon>
              Применить все ({{ scheduledTasks.length }}) задач
            </v-btn>
          </div>
        </template>

        <v-alert v-else-if="!loading && tasks.length === 0" type="info" class="mt-4">
          <strong>📭 Нет задач для распределения</strong><br>
          Создайте новые задачи, чтобы получить предложения по расписанию.
        </v-alert>

        <v-alert v-else-if="!loading && scheduledTasks.length === 0 && unscheduledTasks.length === 0 && tasks.length > 0" type="warning" class="mt-4">
          <strong>⚠️ Не удалось найти свободное время для задач</strong><br>
          Возможные причины:
          <ul class="mt-2">
            <li>Нет свободных слотов в рабочее время</li>
            <li>Все слоты заняты встречами или другими делами</li>
            <li>Задачи слишком длинные для доступных промежутков</li>
          </ul>
          <v-btn
            variant="text"
            color="primary"
            size="small"
            class="mt-2"
            @click="debugInfo = !debugInfo"
          >
            {{ debugInfo ? 'Скрыть' : 'Показать' }} детальную информацию
          </v-btn>
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
const applyingAll = ref(false);
const scheduledTasks = ref<any[]>([]);
const unscheduledTasks = ref<Event[]>([]);
const debugInfo = ref(true);

// Получаем рабочие часы из настроек
const workStart = computed(() => authStore.user?.working_hours_start ?? 9);
const workEnd = computed(() => authStore.user?.working_hours_end ?? 21);

// Подсчет свободных слотов на сегодня для отладки
const todayFreeSlotsCount = computed(() => {
  const now = new Date();
  const slots = scheduler.findFreeSlots(eventsStore.busySlots, now, workStart.value, workEnd.value);
  return slots.length;
});

const hasPastTasks = computed(() => {
  const now = new Date();
  return props.tasks.some(task => {
    const taskStart = new Date(task.start_time);
    return isBefore(taskStart, now);
  });
});

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
    scheduledTasks.value = [];
    unscheduledTasks.value = [];
    return;
  }

  loading.value = true;

  const startDate = new Date();

  console.log('=== НАЧАЛО ПЛАНИРОВАНИЯ ===');
  console.log('Задачи:', props.tasks.map(t => ({
    title: t.title,
    priority: t.priority,
    duration: t.estimated_duration,
    start_time: t.start_time
  })));
  console.log('Занятые слоты:', eventsStore.busySlots.map(s => ({
    title: s.title,
    start: s.start_time,
    end: s.end_time
  })));
  console.log('Рабочие часы:', workStart.value, '-', workEnd.value);

  const result = scheduler.quickSchedule(
    props.tasks,
    eventsStore.busySlots,
    startDate,
    workStart.value,
    workEnd.value,
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
  const result = await eventsStore.updateEvent(task.id, {
    start_time: task.scheduled_start.toISOString(),
    end_time: task.scheduled_end.toISOString()
  });

  if (result.success) {
    scheduledTasks.value = scheduledTasks.value.filter(t => t.id !== task.id);

    // Обновляем календарь
    const calendarApi = (window as any).calendarApi;
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    alert('Ошибка при применении: ' + result.error);
  }
};

const applyAll = async () => {
  applyingAll.value = true;

  let successCount = 0;
  let errorCount = 0;

  for (const task of scheduledTasks.value) {
    const result = await eventsStore.updateEvent(task.id, {
      start_time: task.scheduled_start.toISOString(),
      end_time: task.scheduled_end.toISOString()
    });

    if (result.success) {
      successCount++;
    } else {
      errorCount++;
      console.error('Ошибка при применении задачи:', task.id, result.error);
    }
  }

  if (errorCount > 0) {
    alert(`Применено ${successCount} задач, ${errorCount} с ошибками`);
  } else if (successCount > 0) {
    alert(`✅ Успешно применено ${successCount} задач!`);
  }

  scheduledTasks.value = [];
  emit('apply', scheduledTasks.value);

  // Обновляем календарь
  const calendarApi = (window as any).calendarApi;
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }

  applyingAll.value = false;

  // Закрываем панель
  drawer.value = false;
};
</script>

<style scoped>
.h-100 {
  height: 100%;
}

.priority-high {
  border-left: 4px solid #f44336;
  background-color: rgba(244, 67, 54, 0.05);
}

.priority-medium {
  border-left: 4px solid #ff9800;
  background-color: rgba(255, 152, 0, 0.05);
}

.priority-low {
  border-left: 4px solid #4caf50;
  background-color: rgba(76, 175, 80, 0.05);
}

:deep(.v-list-item) {
  margin-bottom: 4px;
  border-radius: 8px;
}

:deep(.v-list-item__prepend) {
  margin-right: 12px;
}

:deep(.v-list-item-title) {
  font-size: 0.95rem;
}

:deep(.v-list-item-subtitle) {
  font-size: 0.8rem;
}
</style>