<template>
  <div class="calendar-container">
    <div class="calendar-toolbar">
      <v-btn color="primary" @click="showSlotModal = true">
        <v-icon left>mdi-clock-outline</v-icon>
        Добавить занятое время
      </v-btn>
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
      @save="handleSaveEvent"
    />

    <SlotModal
      v-model:visible="showSlotModal"
      :slot="selectedSlot"
      @save="handleSaveSlot"
    />
    <SuggestionPanel
      v-model="showScheduler"
      :tasks="eventsStore.pendingTasks"
      @apply="handleScheduleApplied"
    />

  </div>
</template>

<script setup lang="ts">
import SlotModal from './SlotModal.vue';
import SuggestionPanel from '@/components/scheduler/SuggestionPanel.vue';

// Добавь ref
const showScheduler = ref(false);

// Добавь функцию
const handleScheduleApplied = async () => {
  const calendarApi = calendarRef.value?.getApi();
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }
};

// Добавь в ref
const showSlotModal = ref(false);
const selectedSlot = ref(null);

// Добавь функцию
async function handleSaveSlot(slotData: Partial<TimeSlot>) {
  console.log('Saving slot:', slotData);

  let result;
  if (slotData.id) {
    result = await eventsStore.updateSlot(slotData.id, slotData);
  } else {
    result = await eventsStore.createSlot(slotData);
  }

  if (result.success) {
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    alert('Ошибка: ' + (result.error || 'Неизвестная ошибка'));
  }
}
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEventsStore } from '@/stores/events';
import EventModal from './EventModal.vue';
import type { Event } from '@/types';

const eventsStore = useEventsStore();
const calendarRef = ref();
const showEventModal = ref(false);
const selectedEvent = ref<Event | null>(null);

const getPriorityColor = (priority: string) => {
  switch(priority) {
    case 'high': return '#f44336';
    case 'medium': return '#ff9800';
    case 'low': return '#4caf50';
    default: return '#2196f3';
  }
};

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'timeGridWeek',
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
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        backgroundColor: getPriorityColor(event.priority),
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
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00',
  allDaySlot: false,
  nowIndicator: true,

  dateClick: () => {
    selectedEvent.value = null;
    showEventModal.value = true;
  },

  eventClick: (info: any) => {
    const event = eventsStore.events.find(e => e.id === info.event.id);
    if (event) {
      selectedEvent.value = event;
      showEventModal.value = true;
    }
  },

  eventDrop: async (info: any) => {
    const eventId = info.event.id;
    const eventData = {
      start_time: info.event.start.toISOString(),
      end_time: info.event.end.toISOString()
    };
    await eventsStore.updateEvent(eventId, eventData);
    calendarRef.value?.getApi().refetchEvents();
  },

  eventResize: async (info: any) => {
    const eventId = info.event.id;
    const eventData = {
      start_time: info.event.start.toISOString(),
      end_time: info.event.end.toISOString()
    };
    await eventsStore.updateEvent(eventId, eventData);
    calendarRef.value?.getApi().refetchEvents();
  },

  select: () => {
    selectedEvent.value = null;
    showEventModal.value = true;
  }
};

async function handleSaveEvent(eventData: Partial<Event>) {
  console.log('Saving event:', eventData);

  let result;
  if (eventData.id) {
    result = await eventsStore.updateEvent(eventData.id, eventData);
  } else {
    result = await eventsStore.createEvent(eventData);
  }

  console.log('Save result:', result);

  if (result.success) {
    // Обновляем календарь
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    console.error('Failed to save:', result.error);
    alert('Ошибка при сохранении: ' + (result.error || 'Неизвестная ошибка'));
  }
}

onMounted(async () => {
  const now = new Date();
  const start = new Date(now.setDate(now.getDate() - 7));
  const end = new Date(now.setDate(now.getDate() + 14));
  await eventsStore.fetchEvents(start, end);
});
</script>

<style scoped>
.calendar-container {
  height: calc(100vh - 64px);
  padding: 20px;
}
.calendar-toolbar {
  margin-bottom: 16px;
}

.calendar-wrapper {
  height: 100%;
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