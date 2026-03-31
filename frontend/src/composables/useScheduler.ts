import { ref } from 'vue';
import { addMinutes, setHours, setMinutes } from 'date-fns';
import type { Event, TimeSlot } from '@/types';

export function useScheduler() {
  const loading = ref(false);

  const findFreeSlots = (busySlots: TimeSlot[], date: Date, workStart: number = 9, workEnd: number = 21) => {
    const workStartTime = setHours(setMinutes(new Date(date), 0), workStart);
    const workEndTime = setHours(setMinutes(new Date(date), 0), workEnd);

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Начало рабочего дня, но не раньше текущего времени, если это сегодня
    let currentTimePointer = new Date(workStartTime);
    if (isToday && currentTimePointer < now) {
      // Округляем текущее время до следующего получаса
      currentTimePointer = new Date(now);
      const minutes = currentTimePointer.getMinutes();
      if (minutes < 30) {
        currentTimePointer.setMinutes(30, 0, 0);
      } else {
        currentTimePointer.setHours(currentTimePointer.getHours() + 1, 0, 0, 0);
      }
    }

    console.log(`🔍 Поиск слотов на ${date.toLocaleDateString()}`);
    console.log(`   Начало рабочего дня: ${workStartTime.toLocaleTimeString()}`);
    console.log(`   Текущее время (начало поиска): ${currentTimePointer.toLocaleTimeString()}`);
    console.log(`   Конец рабочего дня: ${workEndTime.toLocaleTimeString()}`);

    // Фильтруем занятые слоты на выбранную дату
    const daySlots = busySlots.filter(slot => {
      const slotDate = new Date(slot.start_time);
      return slotDate.toDateString() === date.toDateString();
    }).sort((a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    console.log(`   Найдено занятых слотов: ${daySlots.length}`);

    const freeSlots: { start: Date; end: Date; duration: number }[] = [];

    for (const slot of daySlots) {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      // Если слот уже закончился до начала поиска, пропускаем
      if (slotEnd <= currentTimePointer) {
        console.log(`   Пропускаем прошедший слот: ${slotStart.toLocaleTimeString()}-${slotEnd.toLocaleTimeString()}`);
        continue;
      }

      // Если есть промежуток между текущим временем и началом слота
      if (currentTimePointer < slotStart) {
        const duration = (slotStart.getTime() - currentTimePointer.getTime()) / (1000 * 60);
        if (duration >= 15) {
          freeSlots.push({
            start: new Date(currentTimePointer),
            end: new Date(slotStart),
            duration: duration
          });
          console.log(`   ✅ Найден слот: ${currentTimePointer.toLocaleTimeString()}-${slotStart.toLocaleTimeString()} (${duration} мин)`);
        }
      }
      currentTimePointer = currentTimePointer > slotEnd ? currentTimePointer : slotEnd;
    }

    // Последний слот после всех занятых
    if (currentTimePointer < workEndTime) {
      const duration = (workEndTime.getTime() - currentTimePointer.getTime()) / (1000 * 60);
      if (duration >= 15) {
        freeSlots.push({
          start: new Date(currentTimePointer),
          end: new Date(workEndTime),
          duration: duration
        });
        console.log(`   ✅ Найден слот: ${currentTimePointer.toLocaleTimeString()}-${workEndTime.toLocaleTimeString()} (${duration} мин)`);
      }
    }

    console.log(`   Всего свободных слотов: ${freeSlots.length}`);
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
    console.log('🚀 Запуск планировщика');
    console.log(`📋 Задач для распределения: ${tasks.length}`);
    console.log(`⏰ Занятых слотов: ${busySlots.length}`);
    console.log(`📅 Начальная дата: ${startDate.toLocaleDateString()}`);

    const sortedTasks = sortByPriority(tasks);
    const scheduled: (Event & { scheduled_start: Date; scheduled_end: Date })[] = [];
    const unscheduled: Event[] = [];

    const now = new Date();
    let currentDay = new Date(startDate);

    // Если начальная дата в прошлом, начинаем с сегодня
    if (currentDay < now && currentDay.toDateString() !== now.toDateString()) {
      console.log(`📅 Начальная дата (${currentDay.toLocaleDateString()}) в прошлом, начинаем с сегодня`);
      currentDay = new Date(now);
    }

    for (let day = 0; day < daysAhead; day++) {
      const dayDate = new Date(currentDay);
      console.log(`\n📅 День ${day + 1}: ${dayDate.toLocaleDateString()}`);

      const freeSlots = findFreeSlots(busySlots, dayDate, workStart, workEnd);

      if (freeSlots.length === 0) {
        console.log(`   ❌ Нет свободных слотов на этот день`);
      }

      let slotIndex = 0;

      for (const task of sortedTasks) {
        if (scheduled.find(s => s.id === task.id)) continue;

        const duration = task.estimated_duration || 30;
        let placed = false;

        while (slotIndex < freeSlots.length && !placed) {
          const slot = freeSlots[slotIndex];

          if (slot.duration >= duration) {
            const scheduledStart = new Date(slot.start);
            const scheduledEnd = addMinutes(slot.start, duration);

            console.log(`   ✅ Распределена задача "${task.title}" (${duration} мин) на ${scheduledStart.toLocaleTimeString()}-${scheduledEnd.toLocaleTimeString()}`);

            scheduled.push({
              ...task,
              scheduled_start: scheduledStart,
              scheduled_end: scheduledEnd
            });

            freeSlots[slotIndex].start = addMinutes(slot.start, duration);
            freeSlots[slotIndex].duration -= duration;
            placed = true;
          } else {
            slotIndex++;
          }
        }
      }

      // Переходим к следующему дню
      currentDay = addMinutes(currentDay, 24 * 60);
    }

    // Определяем нераспределенные задачи
    for (const task of sortedTasks) {
      if (!scheduled.find(s => s.id === task.id)) {
        console.log(`   ❌ Не удалось распределить задачу: "${task.title}"`);
        unscheduled.push(task);
      }
    }

    console.log(`\n📊 ИТОГО: распределено ${scheduled.length} задач, не распределено ${unscheduled.length}`);

    return { scheduled, unscheduled };
  };

  return {
    loading,
    quickSchedule,
    findFreeSlots,
    sortByPriority
  };
}