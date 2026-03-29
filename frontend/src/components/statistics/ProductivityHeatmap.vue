<template>
  <div class="heatmap-container">
    <div class="heatmap-grid">
      <div class="hour-labels">
        <div v-for="hour in 24" :key="hour" class="hour-label">
          {{ (hour - 1).toString().padStart(2, '0') }}:00
        </div>
      </div>
      <div class="heatmap-bars">
        <div
          v-for="(item, index) in data"
          :key="index"
          class="heatmap-bar"
          :style="{ height: `${item.rate}%`, backgroundColor: getColor(item.rate) }"
          :title="`${item.hour}:00 - выполнено ${item.completed} из ${item.total} задач (${Math.round(item.rate)}%)`"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data: Array<{ hour: number; total: number; completed: number; rate: number }>;
}>();

const getColor = (rate: number) => {
  if (rate >= 80) return '#4caf50';
  if (rate >= 60) return '#8bc34a';
  if (rate >= 40) return '#ffc107';
  if (rate >= 20) return '#ff9800';
  return '#f44336';
};
</script>

<style scoped>
.heatmap-container {
  padding: 20px 0;
}

.heatmap-grid {
  display: flex;
  gap: 4px;
  height: 200px;
}

.hour-labels {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 50px;
  font-size: 10px;
  color: #666;
}

.hour-label {
  text-align: right;
  padding-right: 8px;
}

.heatmap-bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 2px;
}

.heatmap-bar {
  flex: 1;
  min-width: 20px;
  transition: all 0.2s;
  cursor: pointer;
  border-radius: 2px 2px 0 0;
}

.heatmap-bar:hover {
  opacity: 0.8;
  transform: scaleX(1.02);
}
</style>