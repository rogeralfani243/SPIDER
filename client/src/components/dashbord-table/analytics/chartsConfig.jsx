// frontend/src/pages/dashboard/utils/chartConfig.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale,
  TimeScale
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// ✅ Enregistrement explicite de tous les composants nécessaires
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,  // ← Important pour PolarArea et Radar
  Title,
  Tooltip,
  Legend,
  Filler,
  LogarithmicScale,
  TimeScale,
  ChartDataLabels
);

export default ChartJS;