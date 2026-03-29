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
              />
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn color="grey" @click="close">Отмена</v-btn>
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
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', event: Partial<Event>): void;
}>();

const dialogVisible = ref(props.visible);
const valid = ref(false);
const saving = ref(false);
const form = ref();

const priorityOptions = [
  { text: 'Низкий', value: 'low' },
  { text: 'Средний', value: 'medium' },
  { text: 'Высокий', value: 'high' }
];

// Функция для преобразования ISO в локальный формат для input
const toLocalDateTime = (isoString: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Функция для преобразования локального формата в ISO
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
  estimated_duration: 30
});

const updateStartTime = (val: string) => {
  formData.value.start_time = fromLocalDateTime(val);
  formData.value.start_time_local = val;

  // Если время окончания меньше времени начала, увеличиваем его
  if (formData.value.end_time && new Date(formData.value.end_time) <= new Date(formData.value.start_time)) {
    const newEnd = new Date(formData.value.start_time);
    newEnd.setHours(newEnd.getHours() + 1);
    formData.value.end_time = newEnd.toISOString();
    formData.value.end_time_local = toLocalDateTime(formData.value.end_time);
  }
};

const updateEndTime = (val: string) => {
  formData.value.end_time = fromLocalDateTime(val);
  formData.value.end_time_local = val;
};

watch(() => props.visible, (val) => {
  dialogVisible.value = val;
  if (val && props.event) {
    // Редактирование
    formData.value = {
      title: props.event.title,
      description: props.event.description || '',
      start_time: props.event.start_time,
      end_time: props.event.end_time,
      start_time_local: toLocalDateTime(props.event.start_time),
      end_time_local: toLocalDateTime(props.event.end_time),
      priority: props.event.priority,
      estimated_duration: props.event.estimated_duration || 30
    };
  } else if (val) {
    // Новая задача
    const now = new Date();
    // Округляем до ближайшего получаса
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const start = now;
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    formData.value = {
      title: '',
      description: '',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      start_time_local: toLocalDateTime(start.toISOString()),
      end_time_local: toLocalDateTime(end.toISOString()),
      priority: 'medium',
      estimated_duration: 60
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
    estimated_duration: formData.value.estimated_duration
  };

  console.log('Sending event:', eventData);

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
</script>