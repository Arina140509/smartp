class SchedulerService {
  constructor(user) {
    this.user = user;
  }

  async suggestSchedule(tasks, busySlots, date = new Date()) {
    const sortedTasks = this.sortTasksByPriority(tasks);
    const freeSlots = await this.findFreeSlots(busySlots, date);

    const scheduled = [];
    const unscheduled = [];
    let currentSlotIndex = 0;

    for (const task of sortedTasks) {
      const duration = task.estimated_duration || 30;
      let placed = false;

      while (currentSlotIndex < freeSlots.length && !placed) {
        const slot = freeSlots[currentSlotIndex];

        if (slot.duration >= duration) {
          scheduled.push({
            ...task.toJSON(),
            scheduled_start: slot.start,
            scheduled_end: this.addMinutes(slot.start, duration)
          });

          freeSlots[currentSlotIndex].start = this.addMinutes(slot.start, duration);
          freeSlots[currentSlotIndex].duration -= duration;
          placed = true;
        } else {
          currentSlotIndex++;
        }
      }

      if (!placed) {
        unscheduled.push(task);
      }
    }

    return { scheduled, unscheduled };
  }

  sortTasksByPriority(tasks) {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }

  async findFreeSlots(busySlots, date) {
    const workStart = new Date(date);
    workStart.setHours(this.user.working_hours_start, 0, 0, 0);

    const workEnd = new Date(date);
    workEnd.setHours(this.user.working_hours_end, 0, 0, 0);

    const sortedSlots = busySlots
      .filter(slot => {
        const slotDate = new Date(slot.start_time);
        return slotDate.toDateString() === date.toDateString();
      })
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));

    const freeSlots = [];
    let currentTime = workStart;

    for (const slot of sortedSlots) {
      const slotStart = new Date(slot.start_time);
      const slotEnd = new Date(slot.end_time);

      if (currentTime < slotStart) {
        const duration = (slotStart - currentTime) / (1000 * 60);
        if (duration >= 15) {
          freeSlots.push({
            start: currentTime,
            end: slotStart,
            duration: duration
          });
        }
      }
      currentTime = currentTime > slotEnd ? currentTime : slotEnd;
    }

    if (currentTime < workEnd) {
      const duration = (workEnd - currentTime) / (1000 * 60);
      if (duration >= 15) {
        freeSlots.push({
          start: currentTime,
          end: workEnd,
          duration: duration
        });
      }
    }

    return freeSlots;
  }

  addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
  }
}

module.exports = SchedulerService;