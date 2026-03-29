<template>
  <div class="loading-container">
    <v-progress-circular
      indeterminate
      color="primary"
      :size="size"
      :width="width"
    />
  </div>
</template>

<script setup lang="ts">
defineProps({
  size: { type: Number, default: 50 },
  width: { type: Number, default: 5 }
});
</script>

<style scoped>
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  min-height: 200px;
}
</style>