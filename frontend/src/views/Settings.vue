<template>
  <div class="settings">
    <Navbar />
    <v-main>
      <v-container>
        <v-card>
          <v-card-title class="text-h5">
            Настройки
          </v-card-title>

          <v-card-subtitle>
            Настройте рабочее время для планировщика
          </v-card-subtitle>

          <v-card-text>
            <v-alert
              v-if="saveSuccess"
              type="success"
              class="mb-4"
              closable
              @click:close="saveSuccess = false"
            >
              Настройки успешно сохранены! Календарь обновлен.
            </v-alert>

            <v-alert
              v-if="saveError"
              type="error"
              class="mb-4"
              closable
              @click:close="saveError = false"
            >
              {{ saveError }}
            </v-alert>

            <v-form @submit.prevent="saveSettings">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="workStart"
                    label="Начало рабочего дня"
                    :items="hours"
                    item-title="label"
                    item-value="value"
                    prepend-inner-icon="mdi-clock-start"
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="workEnd"
                    label="Конец рабочего дня"
                    :items="hours"
                    item-title="label"
                    item-value="value"
                    prepend-inner-icon="mdi-clock-end"
                  />
                </v-col>
              </v-row>

              <v-row>
                <v-col cols="12">
                  <v-card variant="tonal" class="pa-4">
                    <div class="d-flex align-center">
                      <v-icon color="primary" size="32" class="mr-3">mdi-calendar-clock</v-icon>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Текущее рабочее время:</div>
                        <div class="text-h6">
                          {{ formatTime(workStart) }} — {{ formatTime(workEnd) }}
                        </div>
                        <div class="text-caption text-grey">
                          Календарь будет показывать только это время, а планировщик будет распределять задачи в эти часы.
                        </div>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>

              <div class="mt-6">
                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  :loading="loading"
                  block
                >
                  Сохранить настройки
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <v-card class="mt-4">
          <v-card-title class="text-h6">
            Информация об аккаунте
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Имя</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.user?.name || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Email</v-list-item-title>
                <v-list-item-subtitle>{{ authStore.user?.email || '—' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Рабочее время</v-list-item-title>
                <v-list-item-subtitle>{{ workStart }}:00 — {{ workEnd }}:00</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useEventsStore } from '@/stores/events';
import Navbar from '@/components/common/Navbar.vue';

const authStore = useAuthStore();
const eventsStore = useEventsStore();
const loading = ref(false);
const saveSuccess = ref(false);
const saveError = ref('');

const workStart = ref(9);
const workEnd = ref(21);

const hours = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  value: i
}));

const formatTime = (hour: number) => {
  return `${hour.toString().padStart(2, '0')}:00`;
};

onMounted(() => {
  if (authStore.user) {
    workStart.value = authStore.user.working_hours_start ?? 9;
    workEnd.value = authStore.user.working_hours_end ?? 21;
  }
});

const saveSettings = async () => {
  if (workStart.value >= workEnd.value) {
    saveError.value = 'Начало рабочего дня должно быть раньше окончания!';
    setTimeout(() => {
      saveError.value = '';
    }, 3000);
    return;
  }

  loading.value = true;
  saveError.value = '';

  const result = await authStore.updateSettings(workStart.value, workEnd.value);

  if (result.success) {
    saveSuccess.value = true;

    // Обновляем календарь без перезагрузки страницы
    // Находим календарь и обновляем его настройки
    const calendarElement = document.querySelector('.fc');
    if (calendarElement && (window as any).calendarApi) {
      const calendarApi = (window as any).calendarApi;
      calendarApi.setOption('slotMinTime', `${workStart.value.toString().padStart(2, '0')}:00:00`);
      calendarApi.setOption('slotMaxTime', `${workEnd.value.toString().padStart(2, '0')}:00:00`);
      calendarApi.refetchEvents();
    }

    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
  } else {
    saveError.value = result.error || 'Ошибка при сохранении настроек';
    setTimeout(() => {
      saveError.value = '';
    }, 3000);
  }

  loading.value = false;
};
</script>

<style scoped>
.settings {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>