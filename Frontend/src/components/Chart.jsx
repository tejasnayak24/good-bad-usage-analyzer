import React from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler
)

const FONT = "'JetBrains Mono', monospace"

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#6E6E73',
        font: { family: FONT, size: 11 },
        boxWidth: 10,
        padding: 12,
      }
    },
    tooltip: {
      backgroundColor: '#1C1C1E',
      borderColor: '#3A3A3C',
      borderWidth: 1,
      titleColor: '#FFFFFF',
      bodyColor: '#AEAEB2',
      titleFont: { family: FONT, size: 11, weight: '600' },
      bodyFont: { family: FONT, size: 11 },
      padding: 10,
      cornerRadius: 8,
    }
  },
  scales: {
    x: {
      ticks: {
        color: '#AEAEB2',
        font: { family: FONT, size: 10 },
        maxTicksLimit: 10,
      },
      grid: { color: '#F2F2F7' },
      border: { color: '#E5E5EA' },
    },
    y: {
      ticks: {
        color: '#AEAEB2',
        font: { family: FONT, size: 10 },
      },
      grid: { color: '#F2F2F7' },
      border: { color: '#E5E5EA' },
    }
  }
}

export function LineChart({ labels, datasets, height = 200, title }) {
  return (
    <div style={{ height }}>
      <Line
        data={{ labels, datasets }}
        options={{
          ...baseOpts,
          plugins: {
            ...baseOpts.plugins,
            title: title
              ? { display: true, text: title, color: '#6E6E73', font: { family: FONT, size: 11 } }
              : { display: false }
          }
        }}
      />
    </div>
  )
}

export function BarChart({ labels, datasets, height = 200 }) {
  return (
    <div style={{ height }}>
      <Bar data={{ labels, datasets }} options={baseOpts} />
    </div>
  )
}

const DONUT_DEFAULTS = {
  bg: ['rgba(52,199,89,0.65)', 'rgba(255,149,0,0.65)', 'rgba(255,59,48,0.65)'],
  border: ['#34C759', '#FF9500', '#FF3B30'],
}

export function DonutChart({ labels, data, colors, height = 200 }) {
  return (
    <div style={{ height }}>
      <Doughnut
        data={{
          labels,
          datasets: [{
            data,
            backgroundColor: colors || DONUT_DEFAULTS.bg,
            borderColor: DONUT_DEFAULTS.border,
            borderWidth: 1,
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#6E6E73',
                font: { family: FONT, size: 11 },
                padding: 14,
                boxWidth: 10,
              }
            },
            tooltip: baseOpts.plugins.tooltip,
          },
          cutout: '65%',
        }}
      />
    </div>
  )
}
