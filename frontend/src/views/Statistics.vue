<template>
  <div class="statistics">
    <Navbar />
    <v-main>
      <StatsDashboard />
    </v-main>
  </div>
</template>

<script setup lang="ts">
import Navbar from '@/components/common/Navbar.vue';
import StatsDashboard from '@/components/statistics/StatsDashboard.vue';
</script>

<style scoped>
.statistics {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>