<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center py-4">
            <h2>Вход в систему</h2>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                :rules="emailRules"
                prepend-inner-icon="mdi-email"
                required
              />

              <v-text-field
                v-model="password"
                label="Пароль"
                type="password"
                :rules="passwordRules"
                prepend-inner-icon="mdi-lock"
                required
              />

              <v-alert
                v-if="error"
                type="error"
                class="mb-4"
                closable
              >
                {{ error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                :loading="loading"
              >
                Войти
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-4">
            <span>Нет аккаунта?</span>
            <router-link to="/register" class="ml-1">Зарегистрироваться</router-link>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

const emailRules = [
  (v: string) => !!v || 'Email обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Введите корректный email'
];

const passwordRules = [
  (v: string) => !!v || 'Пароль обязателен',
  (v: string) => v.length >= 6 || 'Пароль должен быть не менее 6 символов'
];

const handleLogin = async () => {
  loading.value = true;
  error.value = '';

  const result = await authStore.login({
    email: email.value,
    password: password.value
  });

  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error || 'Ошибка входа';
  }

  loading.value = false;
};
</script>