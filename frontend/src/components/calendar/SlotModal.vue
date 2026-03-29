<template>
  <v-dialog v-model="dialogVisible" max-width="500px" @update:model-value="onClose">
    <v-card>
      <v-card-title>
        {{ slot ? 'Редактировать занятое время' : 'Добавить занятое время' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="formData.title"
            label="Название (например: Работа, Встреча, Спорт)"
            :rules="[v => !!v || 'Название обязательно']"
            required
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                :model-value="formData.start_time_local"
                label="Начало"
                type="datetime-local"
                :rules="[v => !!v || 'Дата начала обязательна']"
                @update:model-value="updateStartTime"
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                :model-value="formData.end_time_local"
                label="Конец"
                type="datetime-local"
                :rules="[v => !!v || 'Дата окончания обязательна']"
                @update:model-value="updateEndTime"
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="formData.is_recurring"
            label="Повторяющееся событие"
            color="primary"
          />

          <v-select
            v-if="formData.is_recurring"
            v-model="formData.day_of_week"
            label="День недели"
            :items="daysOfWeek"
            item-title="text"
            item-value="value"
          />
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
import type { TimeSlot } from '@/types';

const props = defineProps<{
  visible: boolean;
  slot?: TimeSlot | null;
}>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'save', slot: Partial<TimeSlot>): void;
}>();

const dialogVisible = ref(props.visible);
const valid = ref(false);
const saving = ref(false);
const form = ref();

const daysOfWeek = [
  { text: 'Понедельник', value: 1 },
  { text: 'Вторник', value: 2 },
  { text: 'Среда', value: 3 },
  { text: 'Четверг', value: 4 },
  { text: 'Пятница', value: 5 },
  { text: 'Суббота', value: 6 },
  { text: 'Воскресенье', value: 0 }
];

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

const fromLocalDateTime = (localString: string) => {
  if (!localString) return '';
  const date = new Date(localString);
  return date.toISOString();
};

const formData = ref({
  title: '',
  start_time: '',
  end_time: '',
  start_time_local: '',
  end_time_local: '',
  is_recurring: false,
  day_of_week: undefined as number | undefined
});

const updateStartTime = (val: string) => {
  formData.value.start_time = fromLocalDateTime(val);
  formData.value.start_time_local = val;

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
  if (val && props.slot) {
    formData.value = {
      title: props.slot.title,
      start_time: props.slot.start_time,
      end_time: props.slot.end_time,
      start_time_local: toLocalDateTime(props.slot.start_time),
      end_time_local: toLocalDateTime(props.slot.end_time),
      is_recurring: props.slot.is_recurring,
      day_of_week: props.slot.day_of_week
    };
  } else if (val) {
    const now = new Date();
    now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
    const start = now;
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    formData.value = {
      title: '',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      start_time_local: toLocalDateTime(start.toISOString()),
      end_time_local: toLocalDateTime(end.toISOString()),
      is_recurring: false,
      day_of_week: undefined
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
    alert('Введите название');
    return;
  }

  if (!formData.value.start_time || !formData.value.end_time) {
    alert('Выберите дату и время');
    return;
  }

  saving.value = true;

  const slotData: Partial<TimeSlot> = {
    title: formData.value.title,
    start_time: formData.value.start_time,
    end_time: formData.value.end_time,
    is_recurring: formData.value.is_recurring,
    day_of_week: formData.value.is_recurring ? formData.value.day_of_week : undefined
  };

  console.log('Sending slot:', slotData);

  try {
    emit('save', slotData);
    close();
  } catch (error) {
    console.error('Error:', error);
    alert('Ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};
</script>