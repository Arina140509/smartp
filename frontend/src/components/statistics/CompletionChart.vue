<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const props = defineProps<{
  data: Array<{ date: string; total: number; completed: number; rate: number }>;
}>();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstance: Chart | null = null;

const createChart = () => {
  if (!chartCanvas.value) return;

  if (chartInstance) {
    chartInstance.destroy();
  }

  const dates = props.data.map(d => d.date.substring(5));
  const rates = props.data.map(d => d.rate);

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Процент выполнения',
          data: rates,
          borderColor: '#1976D2',
          backgroundColor: 'rgba(25, 118, 210, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Выполнение (%)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Дата'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (context) => {
              const dataPoint = props.data[context.dataIndex];
              return [
                `Выполнение: ${context.raw}%`,
                `Выполнено: ${dataPoint.completed} / ${dataPoint.total}`
              ];
            }
          }
        }
      }
    }
  });
};

watch(() => props.data, () => {
  createChart();
}, { deep: true });

onMounted(() => {
  createChart();
});
</script>

<style scoped>
.chart-container {
  height: 300px;
  position: relative;
}
</style>