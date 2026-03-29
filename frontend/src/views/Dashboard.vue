<template>
  <div class="dashboard">
    <Navbar />
    <v-main>
      <CalendarView />
    </v-main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/common/Navbar.vue';
import CalendarView from '@/components/calendar/CalendarView.vue';
</script>

<style scoped>
.dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>