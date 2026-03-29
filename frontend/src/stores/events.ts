import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { events as eventsApi, slots as slotsApi } from '@/api/endpoints';
import type { Event, TimeSlot } from '@/types';
import { parseISO, isSameDay } from 'date-fns';

export const useEventsStore = defineStore('events', () => {
  const events = ref<Event[]>([]);
  const busySlots = ref<TimeSlot[]>([]);
  const loading = ref(false);

  const pendingTasks = computed(() =>
    events.value.filter(e => e.status === 'pending')
  );

  const completedTasks = computed(() =>
    events.value.filter(e => e.status === 'completed')
  );

  const getEventsByDate = (date: Date) => {
    return events.value.filter(event =>
      isSameDay(parseISO(event.start_time), date)
    );
  };

  const getEventsByRange = (start: Date, end: Date) => {
    return events.value.filter(event => {
      const eventDate = parseISO(event.start_time);
      return eventDate >= start && eventDate <= end;
    });
  };

  const fetchEvents = async (start?: Date, end?: Date) => {
  loading.value = true;
  try {
    const params: { start?: string; end?: string } = {};
    if (start) params.start = start.toISOString();
    if (end) params.end = end.toISOString();

    const response = await eventsApi.getAll(params);
    events.value = response.data;  // Должно быть присвоение
    return response.data;
  } catch (error) {
    console.error('Failed to fetch events:', error);
    throw error;
  } finally {
    loading.value = false;
  }
};

  const fetchBusySlots = async (start?: Date, end?: Date) => {
    try {
      const params: { start?: string; end?: string } = {};
      if (start) params.start = start.toISOString();
      if (end) params.end = end.toISOString();

      const response = await slotsApi.getAll(params);
      busySlots.value = response.data;
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    }
  };

  const createEvent = async (eventData: Partial<Event>) => {
  try {
    console.log('API create event:', eventData);
    const response = await eventsApi.create(eventData);
    console.log('API response:', response.data);
    events.value.push(response.data);
    return { success: true, event: response.data };
  } catch (error: any) {
    console.error('Create event error:', error);
    console.error('Error response:', error.response?.data);
    return {
      success: false,
      error: error.response?.data?.error || error.message || 'Ошибка создания задачи'
    };
  }
};

  const updateEvent = async (id: string, eventData: Partial<Event>) => {
    try {
      const response = await eventsApi.update(id, eventData);
      const index = events.value.findIndex(e => e.id === id);
      if (index !== -1) events.value[index] = response.data;
      return { success: true, event: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await eventsApi.delete(id);
      events.value = events.value.filter(e => e.id !== id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const completeEvent = async (id: string) => {
    try {
      const response = await eventsApi.complete(id);
      const index = events.value.findIndex(e => e.id === id);
      if (index !== -1) events.value[index] = response.data;
      return { success: true, event: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.error };
    }
  };

  const createSlot = async (slotData: Partial<TimeSlot>) => {
  try {
    const response = await slotsApi.create(slotData);
    busySlots.value.push(response.data);
    return { success: true, slot: response.data };
  } catch (error: any) {
    console.error('Create slot error:', error);
    return { success: false, error: error.response?.data?.error || 'Ошибка создания' };
  }
};

const updateSlot = async (id: string, slotData: Partial<TimeSlot>) => {
  try {
    const response = await slotsApi.update(id, slotData);
    const index = busySlots.value.findIndex(s => s.id === id);
    if (index !== -1) busySlots.value[index] = response.data;
    return { success: true, slot: response.data };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error };
  }
};

const deleteSlot = async (id: string) => {
  try {
    await slotsApi.delete(id);
    busySlots.value = busySlots.value.filter(s => s.id !== id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.response?.data?.error };
  }
};
  return {
    events,
    busySlots,
    loading,
    pendingTasks,
    completedTasks,
    getEventsByDate,
    getEventsByRange,
    fetchEvents,
    fetchBusySlots,
    createEvent,
    updateEvent,
    deleteEvent,
    completeEvent,
    createSlot,
    updateSlot,
    deleteSlot
  };
});