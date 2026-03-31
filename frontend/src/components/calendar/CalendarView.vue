<template>
  <div class="calendar-container">
    <div class="calendar-toolbar">
      <v-btn
        color="secondary"
        @click="showScheduler = true"
        :disabled="eventsStore.pendingTasks.length === 0"
      >
        <v-icon left>mdi-brain</v-icon>
        Умный планировщик
        <v-badge
          v-if="eventsStore.pendingTasks.length > 0"
          :content="eventsStore.pendingTasks.length"
          color="error"
          floating
        />
      </v-btn>
    </div>

    <div class="calendar-wrapper">
      <FullCalendar
        ref="calendarRef"
        :options="calendarOptions"
      />
    </div>

    <EventModal
      v-model:visible="showEventModal"
      :event="selectedEvent"
      :start-date="selectedStartDate"
      :end-date="selectedEndDate"
      @save="handleSaveEvent"
      @delete="handleDeleteEvent"
      @complete="handleCompleteEvent"
    />

    <SuggestionPanel
      v-model="showScheduler"
      :tasks="eventsStore.pendingTasks"
      @apply="handleScheduleApplied"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { useEventsStore } from '@/stores/events';
import EventModal from './EventModal.vue';
import SuggestionPanel from '@/components/scheduler/SuggestionPanel.vue';
import type { Event } from '@/types';

const eventsStore = useEventsStore();
const calendarRef = ref();
const showEventModal = ref(false);
const showScheduler = ref(false);
const selectedEvent = ref<Event | null>(null);
const selectedStartDate = ref<Date | null>(null);
const selectedEndDate = ref<Date | null>(null);

// Функция для форматирования времени в формат FullCalendar
const formatSlotTime = (hour: number): string => {
  const validHour = Math.min(Math.max(hour, 0), 23);
  return `${validHour.toString().padStart(2, '0')}:00:00`;
};

// Получение рабочих часов из localStorage
const getWorkingHours = () => {
  const savedStart = localStorage.getItem('working_hours_start');
  const savedEnd = localStorage.getItem('working_hours_end');

  if (savedStart && savedEnd) {
    const start = parseInt(savedStart);
    const end = parseInt(savedEnd);
    if (!isNaN(start) && !isNaN(end) && start >= 0 && end <= 24 && start < end) {
      return { start, end };
    }
  }
  return { start: 9, end: 21 };
};

// Реактивные переменные для рабочих часов
const workStart = ref(getWorkingHours().start);
const workEnd = ref(getWorkingHours().end);

// Обновление календаря при изменении рабочих часов
const updateCalendarHours = () => {
  const calendarApi = calendarRef.value?.getApi();
  if (calendarApi) {
    const startStr = formatSlotTime(workStart.value);
    const endStr = formatSlotTime(workEnd.value);
    calendarApi.setOption('slotMinTime', startStr);
    calendarApi.setOption('slotMaxTime', endStr);
    calendarApi.refetchEvents();
  }
};

// Следим за изменением рабочих часов и сохраняем в localStorage
watch([workStart, workEnd], () => {
  localStorage.setItem('working_hours_start', String(workStart.value));
  localStorage.setItem('working_hours_end', String(workEnd.value));
  updateCalendarHours();
});

// Слушаем изменения localStorage из других вкладок/компонентов
window.addEventListener('storage', (event) => {
  if (event.key === 'working_hours_start') {
    const newValue = parseInt(event.newValue || '9');
    if (!isNaN(newValue)) workStart.value = newValue;
  }
  if (event.key === 'working_hours_end') {
    const newValue = parseInt(event.newValue || '21');
    if (!isNaN(newValue)) workEnd.value = newValue;
  }
});

// Экспортируем календарь в глобальную переменную для доступа из настроек
watch(calendarRef, (ref) => {
  if (ref?.getApi()) {
    (window as any).calendarApi = ref.getApi();
    updateCalendarHours();
  }
});

// Определение цвета задачи в зависимости от статуса и приоритета
const getEventColor = (event: Event) => {
  if (event.status === 'completed') {
    return '#9e9e9e'; // серый для выполненных
  }
  switch(event.priority) {
    case 'high': return '#f44336'; // красный для высокого приоритета
    case 'medium': return '#ff9800'; // оранжевый для среднего
    case 'low': return '#4caf50'; // зеленый для низкого
    default: return '#2196f3'; // синий по умолчанию
  }
};

// Конфигурация календаря
const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
  locale: ruLocale,
  buttonText: {
    today: 'Сегодня',
    month: 'Месяц',
    week: 'Неделя',
    day: 'День'
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  events: async (fetchInfo: any, successCallback: any, failureCallback: any) => {
    try {
      await eventsStore.fetchEvents(fetchInfo.start, fetchInfo.end);
      const formattedEvents = eventsStore.events.map(event => ({
        id: event.id,
        title: event.status === 'completed' ? `✓ ${event.title}` : event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: getEventColor(event),
        extendedProps: {
          description: event.description,
          priority: event.priority,
          status: event.status
        }
      }));
      successCallback(formattedEvents);
    } catch (error) {
      failureCallback(error);
    }
  },
  editable: true,
  selectable: true,
  selectMirror: true,
  dayMaxEvents: true,
  weekends: true,
  slotMinTime: formatSlotTime(workStart.value),
  slotMaxTime: formatSlotTime(workEnd.value),
  allDaySlot: false,
  nowIndicator: true,
  slotLabelFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  titleFormat: {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  firstDay: 1, // неделя начинается с понедельника

  // Обработчик клика по дате/времени
  dateClick: (info: any) => {
    const start = info.date;
    const end = new Date(start.getTime() + 30 * 60 * 1000); // по умолчанию 30 минут
    selectedStartDate.value = start;
    selectedEndDate.value = end;
    selectedEvent.value = null;
    showEventModal.value = true;
  },

  // Обработчик клика по задаче
  eventClick: (info: any) => {
    const event = eventsStore.events.find(e => e.id === info.event.id);
    if (event) {
      selectedEvent.value = event;
      showEventModal.value = true;
    }
  },

  // Обработчик перемещения задачи
  eventDrop: async (info: any) => {
    const eventId = info.event.id;
    const eventData = {
      start_time: info.event.start.toISOString(),
      end_time: info.event.end.toISOString()
    };
    await eventsStore.updateEvent(eventId, eventData);
    calendarRef.value?.getApi().refetchEvents();
  },

  // Обработчик изменения размера задачи
  eventResize: async (info: any) => {
    const eventId = info.event.id;
    const eventData = {
      start_time: info.event.start.toISOString(),
      end_time: info.event.end.toISOString()
    };
    await eventsStore.updateEvent(eventId, eventData);
    calendarRef.value?.getApi().refetchEvents();
  },

  // Обработчик выделения области
  select: (info: any) => {
    selectedStartDate.value = info.start;
    selectedEndDate.value = info.end;
    selectedEvent.value = null;
    showEventModal.value = true;
  }
};

// Сохранение задачи
async function handleSaveEvent(eventData: Partial<Event>) {
  let result;
  if (eventData.id) {
    result = await eventsStore.updateEvent(eventData.id, eventData);
  } else {
    result = await eventsStore.createEvent(eventData);
  }

  if (result.success) {
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    alert('Ошибка при сохранении: ' + (result.error || 'Неизвестная ошибка'));
  }
}

// Удаление задачи
async function handleDeleteEvent(id: string) {
  const result = await eventsStore.deleteEvent(id);
  if (result.success) {
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    alert('Ошибка при удалении: ' + (result.error || 'Неизвестная ошибка'));
  }
}

// Отметка задачи как выполненной
async function handleCompleteEvent(id: string) {
  const result = await eventsStore.completeEvent(id);
  if (result.success) {
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
    alert('Задача отмечена как выполненная! 🎉');
  } else {
    alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'));
  }
}

// Обновление календаря после применения расписания
const handleScheduleApplied = async () => {
  const calendarApi = calendarRef.value?.getApi();
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }
};

// Инициализация при монтировании компонента
onMounted(async () => {
  const hours = getWorkingHours();
  workStart.value = hours.start;
  workEnd.value = hours.end;

  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - 7));
  const end = new Date(now.setDate(now.getDate() + 14));
  await eventsStore.fetchEvents(start, end);
  await eventsStore.fetchBusySlots(start, end);
});
</script>

<style scoped>
.calendar-container {
  height: calc(100vh - 64px);
  padding: 20px;
}

.calendar-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}

.calendar-wrapper {
  height: calc(100% - 56px);
}

:deep(.fc) {
  height: 100%;
}

:deep(.fc-toolbar-title) {
  font-size: 1.5rem;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
}
</style>