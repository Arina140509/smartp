<template>
  <div class="settings">
    <Navbar />
    <v-main>
      <v-container>
        <v-card>
          <v-card-title>Настройки</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="saveSettings">
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="workStart"
                    label="Начало рабочего дня"
                    :items="hours"
                    item-title="label"
                    item-value="value"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="workEnd"
                    label="Конец рабочего дня"
                    :items="hours"
                    item-title="label"
                    item-value="value"
                  />
                </v-col>
              </v-row>

              <v-alert
                v-if="saveSuccess"
                type="success"
                class="mb-4"
                closable
              >
                Настройки сохранены
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                :loading="loading"
              >
                Сохранить
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import Navbar from '@/components/common/Navbar.vue';

const authStore = useAuthStore();
const loading = ref(false);
const saveSuccess = ref(false);

const workStart = ref(9);
const workEnd = ref(21);

const hours = Array.from({ length: 24 }, (_, i) => ({
  label: `${i.toString().padStart(2, '0')}:00`,
  value: i
}));

onMounted(() => {
  if (authStore.user) {
    workStart.value = authStore.user.working_hours_start;
    workEnd.value = authStore.user.working_hours_end;
  }
});

const saveSettings = async () => {
  loading.value = true;
  const result = await authStore.updateSettings(workStart.value, workEnd.value);
  if (result.success) {
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
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