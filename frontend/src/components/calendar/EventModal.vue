<template>
  <v-dialog v-model="dialogVisible" max-width="500px" @update:model-value="onClose">
    <v-card>
      <v-card-title>
        {{ event ? 'Редактировать задачу' : 'Создать задачу' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="formData.title"
            label="Название"
            :rules="[v => !!v || 'Название обязательно']"
            required
          />

          <v-textarea
            v-model="formData.description"
            label="Описание"
            rows="2"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                :model-value="formData.start_time_local"
                label="Начало"
                type="datetime-local"
                :rules="[v => !!v || 'Дата начала обязательна']"
                @update:model-value="(val) => updateStartTime(val)"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                :model-value="formData.end_time_local"
                label="Конец"
                type="datetime-local"
                :rules="[v => !!v || 'Дата окончания обязательна']"
                @update:model-value="(val) => updateEndTime(val)"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="6">
              <v-select
                v-model="formData.priority"
                label="Приоритет"
                :items="priorityOptions"
                item-title="text"
                item-value="value"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="formData.estimated_duration"
                label="Длительность (мин)"
                type="number"
                suffix="мин"
                @update:model-value="updateDuration"
              />
            </v-col>
          </v-row>

          <v-select
            v-if="event"
            v-model="formData.status"
            label="Статус"
            :items="statusOptions"
            item-title="text"
            item-value="value"
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />

        <v-btn
          v-if="event"
          color="error"
          variant="text"
          @click="handleDelete"
          :loading="deleting"
        >
          <v-icon left>mdi-delete</v-icon>
          Удалить
        </v-btn>

        <v-btn color="grey" @click="close">Отмена</v-btn>

        <v-btn
          v-if="event && event.status !== 'completed'"
          color="success"
          @click="handleComplete"
          :loading="completing"
        >
          <v-icon left>mdi-check</v-icon>
          Выполнено
        </v-btn>

        <v-btn color="primary" @click="save" :disabled="!valid" :loading="saving">
          Сохранить
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Event } from '@/types';

const props = defineProps<{
  visible: boolean;
  event?: Event | null;
  startDate?: Date | null;
  endDate?: Date | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', event: Partial<Event>): void;
  (e: 'delete', id: string): void;
  (e: 'complete', id: string): void;
}>();

const dialogVisible = ref(props.visible);
const valid = ref(false);
const saving = ref(false);
const completing = ref(false);
const deleting = ref(false);
const form = ref();

const priorityOptions = [
  { text: 'Низкий', value: 'low' },
  { text: 'Средний', value: 'medium' },
  { text: 'Высокий', value: 'high' }
];

const statusOptions = [
  { text: 'В процессе', value: 'pending' },
  { text: 'Выполнено', value: 'completed' }
];

const toLocalDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const fromLocalDateTime = (localString: string) => {
  if (!localString) return '';
  const date = new Date(localString);
  return date.toISOString();
};

const formData = ref({
  title: '',
  description: '',
  start_time: '',
  end_time: '',
  start_time_local: '',
  end_time_local: '',
  priority: 'medium' as 'low' | 'medium' | 'high',
  estimated_duration: 30,
  status: 'pending' as 'pending' | 'completed'
});

// Функция для обновления длительности (пересчитывает время окончания)
const updateDuration = (minutes: number) => {
  if (!formData.value.start_time) return;

  const start = new Date(formData.value.start_time);
  const end = new Date(start.getTime() + minutes * 60 * 1000);

  formData.value.end_time = end.toISOString();
  formData.value.end_time_local = toLocalDateTime(end);
};

const updateStartTime = (val: string) => {
  formData.value.start_time = fromLocalDateTime(val);
  formData.value.start_time_local = val;

  // Пересчитываем длительность и время окончания
  const duration = formData.value.estimated_duration;
  if (duration && formData.value.start_time) {
    const start = new Date(formData.value.start_time);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    formData.value.end_time = end.toISOString();
    formData.value.end_time_local = toLocalDateTime(end);
  }
};

const updateEndTime = (val: string) => {
  formData.value.end_time = fromLocalDateTime(val);
  formData.value.end_time_local = val;

  // Пересчитываем длительность
  if (formData.value.start_time && formData.value.end_time) {
    const start = new Date(formData.value.start_time);
    const end = new Date(formData.value.end_time);
    const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
    formData.value.estimated_duration = minutes > 0 ? minutes : 30;
  }
};

// Устанавливаем начальные значения из пропсов
const setDatesFromProps = () => {
  if (props.startDate && props.endDate) {
    const start = props.startDate;
    const end = props.endDate;
    const duration = Math.round((end.getTime() - start.getTime()) / 60000);

    formData.value.start_time = start.toISOString();
    formData.value.end_time = end.toISOString();
    formData.value.start_time_local = toLocalDateTime(start);
    formData.value.end_time_local = toLocalDateTime(end);
    formData.value.estimated_duration = duration > 0 ? duration : 30;
  }
};

watch(() => props.visible, (val) => {
  dialogVisible.value = val;
  if (val && props.event) {
    // Редактирование существующей задачи
    formData.value = {
      title: props.event.title,
      description: props.event.description || '',
      start_time: props.event.start_time,
      end_time: props.event.end_time,
      start_time_local: toLocalDateTime(new Date(props.event.start_time)),
      end_time_local: toLocalDateTime(new Date(props.event.end_time)),
      priority: props.event.priority,
      estimated_duration: props.event.estimated_duration || 30,
      status: props.event.status
    };
  } else if (val && props.startDate && props.endDate) {
    // Новая задача с выделенными датами
    setDatesFromProps();
    // Сбрасываем остальные поля, но сохраняем даты
    formData.value.title = '';
    formData.value.description = '';
    formData.value.priority = 'medium';
    formData.value.status = 'pending';
  } else if (val) {
    // Новая задача без выделенных дат (по умолчанию)
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const start = now;
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    formData.value = {
      title: '',
      description: '',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      start_time_local: toLocalDateTime(start),
      end_time_local: toLocalDateTime(end),
      priority: 'medium',
      estimated_duration: 60,
      status: 'pending'
    };
  }
});

const close = () => {
  dialogVisible.value = false;
  emit('update:visible', false);
};

const onClose = (val: boolean) => {
  if (!val) {
    emit('update:visible', false);
  }
};

const save = async () => {
  if (!formData.value.title) {
    alert('Введите название задачи');
    return;
  }

  if (!formData.value.start_time || !formData.value.end_time) {
    alert('Выберите дату и время');
    return;
  }

  saving.value = true;

  const eventData: Partial<Event> = {
    title: formData.value.title,
    description: formData.value.description,
    start_time: formData.value.start_time,
    end_time: formData.value.end_time,
    priority: formData.value.priority,
    estimated_duration: formData.value.estimated_duration,
    status: formData.value.status
  };

  try {
    emit('save', eventData);
    close();
  } catch (error) {
    console.error('Error:', error);
    alert('Ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

const handleComplete = async () => {
  if (!props.event?.id) return;

  completing.value = true;
  try {
    emit('complete', props.event.id);
    close();
  } catch (error) {
    console.error('Error completing task:', error);
    alert('Ошибка при отметке выполнения');
  } finally {
    completing.value = false;
  }
};

const handleDelete = async () => {
  if (!props.event?.id) return;

  const confirmed = confirm('Вы уверены, что хотите удалить эту задачу?');
  if (!confirmed) return;

  deleting.value = true;
  try {
    emit('delete', props.event.id);
    close();
  } catch (error) {
    console.error('Error deleting task:', error);
    alert('Ошибка при удалении задачи');
  } finally {
    deleting.value = false;
  }
};
</script>