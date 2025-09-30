import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const RadarChart = ({ 
  data, 
  labels, 
  backgroundColor = 'rgba(255, 255, 255, 0.2)',
  borderColor = 'rgba(255, 255, 255, 1)',
  pointBackgroundColor = 'rgba(255, 255, 255, 1)',
  pointBorderColor = 'rgba(255, 255, 255, 1)',
  width = 400,
  height = 400,
  style = {},
  animate = false,
  isMiniature = false
}) => {
  // Create a subtle rainbow gradient
  const createRainbowGradient = (ctx) => {
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 200);
    gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');    // Red
    gradient.addColorStop(0.2, 'rgba(255, 150, 100, 0.3)');  // Orange
    gradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.3)');  // Yellow
    gradient.addColorStop(0.6, 'rgba(100, 255, 100, 0.3)');  // Green
    gradient.addColorStop(0.8, 'rgba(100, 100, 255, 0.3)');  // Blue
    gradient.addColorStop(1, 'rgba(200, 100, 255, 0.3)');    // Purple
    return gradient;
  };

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Ratings',
        data: data,
        fill: true,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return backgroundColor;
          }
          return createRainbowGradient(ctx);
        },
        borderColor: borderColor,
        borderWidth: isMiniature ? 1 : 2,
        pointBackgroundColor: pointBackgroundColor,
        pointBorderColor: pointBorderColor,
        pointBorderWidth: isMiniature ? 1 : 2,
        pointRadius: isMiniature ? 2 : 4,
        pointHoverRadius: isMiniature ? 3 : 6,
        pointHoverBackgroundColor: pointBackgroundColor,
        pointHoverBorderColor: pointBorderColor,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: animate ? 2000 : 0,
      easing: 'easeOutQuart'
    },
    scales: {
      r: {
        angleLines: {
          color: isMiniature ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
          lineWidth: isMiniature ? 0.5 : 1
        },
        grid: {
          color: isMiniature ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.2)',
          lineWidth: isMiniature ? 0.5 : 1
        },
        pointLabels: {
          color: isMiniature ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 1)',
          font: {
            size: isMiniature ? 10 : 14,
            weight: 'bold'
          }
        },
        ticks: {
          color: isMiniature ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.7)',
          backdropColor: 'transparent',
          font: {
            size: isMiniature ? 8 : 12
          },
          min: 0,
          max: 5,
          beginAtZero: true
        },
        suggestedMin: 0,
        suggestedMax: 5
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 1)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1
      }
    }
  };

  return (
    <div style={{ width, height, ...style }}>
      <Radar data={chartData} options={options} />
    </div>
  );
};

export default RadarChart;
