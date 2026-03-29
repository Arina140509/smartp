<template>
  <v-app-bar color="primary" dark app>
    <v-app-bar-nav-icon @click="drawer = !drawer" />

    <v-toolbar-title>
      <router-link to="/" style="color: white; text-decoration: none;">
        Планер
      </router-link>
    </v-toolbar-title>

    <v-spacer />

    <v-menu>
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title>{{ user?.name }}</v-list-item-title>
          <v-list-item-subtitle>{{ user?.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider />
        <v-list-item to="/settings">
          <v-list-item-title>Настройки</v-list-item-title>
        </v-list-item>
        <v-list-item @click="handleLogout">
          <v-list-item-title>Выйти</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" app>
    <v-list>
      <v-list-item to="/" prepend-icon="mdi-calendar">
        <v-list-item-title>Календарь</v-list-item-title>
      </v-list-item>
      <v-list-item to="/statistics" prepend-icon="mdi-chart-line">
        <v-list-item-title>Статистика</v-list-item-title>
      </v-list-item>
      <v-list-item to="/settings" prepend-icon="mdi-cog">
        <v-list-item-title>Настройки</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const drawer = ref(false);

const user = authStore.user;

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>