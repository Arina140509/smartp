import { ref } from 'vue';
import api from '@/api';
import type { Event, TimeSlot } from '@/types';
import { addMinutes, setHours, setMinutes } from 'date-fns';

export function useScheduler() {
  const loading = ref(false);

  const findFreeSlots = (busySlots: TimeSlot[], date: Date, workStart: number = 9, workEnd: number = 21) => {
    const workStartTime = setHours(setMinutes(date, 0), workStart);
    const workEndTime = setHours(setMinutes(date, 0), workEnd);

    // Фильтруем слоты на выбранную дату
    const daySlots = busySlots.filter(slot => {
      const slotDate = new Date(slot.start_time);
      return slotDate.toDateString() === date.toDateString();
    }).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    const freeSlots: { start: Date; end: Date; duration: number }[] = [];
    let currentTime = workStartTime;

    for (const slot of daySlots) {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      if (currentTime < slotStart) {
        const duration = (slotStart.getTime() - currentTime.getTime()) / (1000 * 60);
        if (duration >= 15) {
          freeSlots.push({
            start: currentTime,
            end: slotStart,
            duration
          });
        }
      }
      currentTime = currentTime > slotEnd ? currentTime : slotEnd;
    }

    // Последний слот
    if (currentTime < workEndTime) {
      const duration = (workEndTime.getTime() - currentTime.getTime()) / (1000 * 60);
      if (duration >= 15) {
        freeSlots.push({
          start: currentTime,
          end: workEndTime,
          duration
        });
      }
    }

    return freeSlots;
  };

  const sortByPriority = (tasks: Event[]) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  const quickSchedule = (
    tasks: Event[],
    busySlots: TimeSlot[],
    date: Date,
    workStart: number = 9,
    workEnd: number = 21
  ) => {
    const sortedTasks = sortByPriority(tasks);
    const freeSlots = findFreeSlots(busySlots, date, workStart, workEnd);

    const scheduled: (Event & { scheduled_start: Date; scheduled_end: Date })[] = [];
    const unscheduled: Event[] = [];

    let slotIndex = 0;

    for (const task of sortedTasks) {
      const duration = task.estimated_duration || 30;
      let placed = false;

      while (slotIndex < freeSlots.length && !placed) {
        const slot = freeSlots[slotIndex];

        if (slot.duration >= duration) {
          scheduled.push({
            ...task,
            scheduled_start: slot.start,
            scheduled_end: addMinutes(slot.start, duration)
          });

          freeSlots[slotIndex].start = addMinutes(slot.start, duration);
          freeSlots[slotIndex].duration -= duration;
          placed = true;
        } else {
          slotIndex++;
        }
      }

      if (!placed) {
        unscheduled.push(task);
      }
    }

    return { scheduled, unscheduled };
  };

  const suggestFromApi = async (tasks: Event[], busySlots: TimeSlot[], workingHours: { start: number; end: number }) => {
    loading.value = true;
    try {
      const response = await api.post('/ai/suggest', {
        tasks,
        busySlots,
        workingHours
      });
      return response.data;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    quickSchedule,
    suggestFromApi,
    findFreeSlots,
    sortByPriority
  };
}