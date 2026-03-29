import { ref } from 'vue';
import { addMinutes, setHours, setMinutes } from 'date-fns';
import type { Event, TimeSlot } from '@/types';

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
    startDate: Date,
    workStart: number = 9,
    workEnd: number = 21,
    daysAhead: number = 7
  ) => {
    const sortedTasks = sortByPriority(tasks);
    const scheduled: (Event & { scheduled_start: Date; scheduled_end: Date })[] = [];
    const unscheduled: Event[] = [];

    // Пробуем распределить на ближайшие дни
    let currentDay = new Date(startDate);

    for (let day = 0; day < daysAhead; day++) {
      const freeSlots = findFreeSlots(busySlots, currentDay, workStart, workEnd);
      let slotIndex = 0;

      for (const task of [...sortedTasks]) {
        if (scheduled.find(s => s.id === task.id)) continue;

        const duration = task.estimated_duration || 30;

        while (slotIndex < freeSlots.length) {
          const slot = freeSlots[slotIndex];

          if (slot.duration >= duration) {
            scheduled.push({
              ...task,
              scheduled_start: slot.start,
              scheduled_end: addMinutes(slot.start, duration)
            });

            freeSlots[slotIndex].start = addMinutes(slot.start, duration);
            freeSlots[slotIndex].duration -= duration;
            break;
          } else {
            slotIndex++;
          }
        }
      }

      currentDay = addMinutes(currentDay, 24 * 60);
    }

    // Определяем нераспределенные задачи
    for (const task of sortedTasks) {
      if (!scheduled.find(s => s.id === task.id)) {
        unscheduled.push(task);
      }
    }

    return { scheduled, unscheduled };
  };

  return {
    loading,
    quickSchedule,
    findFreeSlots,
    sortByPriority
  };
}