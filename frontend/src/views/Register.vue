<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center py-4">
            <h2>Регистрация</h2>
          </v-card-title>

          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-text-field
                v-model="name"
                label="Имя"
                :rules="nameRules"
                prepend-inner-icon="mdi-account"
                required
              />

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

              <v-text-field
                v-model="confirmPassword"
                label="Подтвердите пароль"
                type="password"
                :rules="confirmPasswordRules"
                prepend-inner-icon="mdi-lock-check"
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
                Зарегистрироваться
              </v-btn>
            </v-form>
          </v-card-text>

          <v-card-actions class="justify-center pb-4">
            <span>Уже есть аккаунт?</span>
            <router-link to="/login" class="ml-1">Войти</router-link>
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

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const error = ref('');

const nameRules = [
  (v: string) => !!v || 'Имя обязательно',
  (v: string) => v.length >= 2 || 'Имя должно быть не менее 2 символов'
];

const emailRules = [
  (v: string) => !!v || 'Email обязателен',
  (v: string) => /.+@.+\..+/.test(v) || 'Введите корректный email'
];

const passwordRules = [
  (v: string) => !!v || 'Пароль обязателен',
  (v: string) => v.length >= 6 || 'Пароль должен быть не менее 6 символов'
];

const confirmPasswordRules = [
  (v: string) => !!v || 'Подтвердите пароль',
  (v: string) => v === password.value || 'Пароли не совпадают'
];

const handleRegister = async () => {
  loading.value = true;
  error.value = '';

  const result = await authStore.register({
    name: name.value,
    email: email.value,
    password: password.value
  });

  if (result.success) {
    router.push('/');
  } else {
    error.value = result.error || 'Ошибка регистрации';
  }

  loading.value = false;
};
</script>