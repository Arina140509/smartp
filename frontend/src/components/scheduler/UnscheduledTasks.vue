<template>
  <v-card class="task-panel">
    <v-card-title>
      Нераспределенные задачи
      <v-badge :content="tasks.length" color="error" inline />
    </v-card-title>

    <v-card-text>
      <v-list>
        <v-list-item
          v-for="task in tasks"
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
            {{ task.estimated_duration || 30 }} мин •
            {{ task.description?.substring(0, 50) || 'Нет описания' }}
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-btn
              icon
              variant="text"
              size="small"
              @click="$emit('schedule', task)"
            >
              <v-icon>mdi-calendar-plus</v-icon>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>

      <v-btn
        v-if="tasks.length > 0"
        color="primary"
        block
        class="mt-4"
        @click="$emit('scheduleAll', tasks)"
      >
        Распределить все задачи
      </v-btn>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { Event } from '@/types';

defineProps<{
  tasks: Event[];
}>();

defineEmits<{
  (e: 'schedule', task: Event): void;
  (e: 'scheduleAll', tasks: Event[]): void;
}>();

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
const props = defineProps<{
  tasks: Event[];
}>();
const pendingTasks = computed(() =>
  props.tasks.filter(task => task.status !== 'completed')
);
</script>

<style scoped>
.task-panel {
  position: fixed;
  right: 20px;
  top: 80px;
  width: 320px;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.priority-high {
  border-left: 4px solid #0542b3;
}

.priority-medium {
  border-left: 4px solid #3e76de;
}

.priority-low {
  border-left: 4px solid #83aaf2;
}
</style>