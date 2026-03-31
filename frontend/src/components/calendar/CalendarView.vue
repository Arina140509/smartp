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
import { ref, onMounted } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEventsStore } from '@/stores/events';
import EventModal from './EventModal.vue';
import SlotModal from './SlotModal.vue';
import SuggestionPanel from '@/components/scheduler/SuggestionPanel.vue';
import type { Event, TimeSlot } from '@/types';

const eventsStore = useEventsStore();
const calendarRef = ref();
const showEventModal = ref(false);
const showSlotModal = ref(false);
const showScheduler = ref(false);
const selectedEvent = ref<Event | null>(null);
const selectedSlot = ref<TimeSlot | null>(null);
const selectedStartDate = ref<Date | null>(null);
const selectedEndDate = ref<Date | null>(null);

const getEventColor = (event: Event) => {
  if (event.status === 'completed') {
    return '#9e9e9e';
  }

  switch(event.priority) {
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
  slotMinTime: '08:00:00',
  slotMaxTime: '22:00:00',
  allDaySlot: false,
  nowIndicator: true,

  dateClick: (info: any) => {
    const start = info.date;
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    selectedStartDate.value = start;
    selectedEndDate.value = end;
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

  select: (info: any) => {
    selectedStartDate.value = info.start;
    selectedEndDate.value = info.end;
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
    const calendarApi = calendarRef.value?.getApi();
    if (calendarApi) {
      await calendarApi.refetchEvents();
    }
  } else {
    alert('Ошибка при сохранении: ' + (result.error || 'Неизвестная ошибка'));
  }
}

async function handleDeleteEvent(id: string) {
  console.log('Deleting event:', id);

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

async function handleCompleteEvent(id: string) {
  console.log('Completing event:', id);

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

const handleScheduleApplied = async () => {
  const calendarApi = calendarRef.value?.getApi();
  if (calendarApi) {
    await calendarApi.refetchEvents();
  }
};

onMounted(async () => {
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