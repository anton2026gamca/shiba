import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ReviewBacklogChart({ data = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  // Initialize chart when data is available
  useEffect(() => {
    if (data && data.length > 0 && canvasRef.current && !chartInstance.current) {
      const totalRecords = data.reduce((sum, item) => sum + item.value, 0);
      
      console.log('ReviewBacklogChart data:', data);
      console.log('Total records:', totalRecords);
      
      const needsReview = data.find(item => item.label === 'Needs Review')?.value || 0;
      const needsRereview = data.find(item => item.label === 'Needs Rereview')?.value || 0;
      const reviewed = data.find(item => item.label === 'Reviewed')?.value || 0;
      
      console.log('Needs Review:', needsReview);
      console.log('Needs Rereview:', needsRereview);
      console.log('Reviewed:', reviewed);
      
      const chartData = {
        labels: ['Review Status'],
        datasets: [
          {
            label: 'Needs Review',
            data: [needsReview],
            backgroundColor: 'rgba(255, 107, 107, 0.8)',
            borderColor: 'rgba(255, 107, 107, 1)',
            borderWidth: 2,
          },
          {
            label: 'Needs Rereview',
            data: [needsRereview],
            backgroundColor: 'rgba(255, 167, 38, 0.8)',
            borderColor: 'rgba(255, 167, 38, 1)',
            borderWidth: 2,
          },
          {
            label: 'Reviewed',
            data: [reviewed],
            backgroundColor: 'rgba(102, 187, 106, 0.8)',
            borderColor: 'rgba(102, 187, 106, 1)',
            borderWidth: 2,
          }
        ],
      };

      const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              usePointStyle: true,
              font: {
                size: 12,
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.dataset.label || '';
                const value = context.parsed.x;
                const percentage = totalRecords > 0 ? ((value / totalRecords) * 100).toFixed(1) : '0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            display: false,
            min: 0,
            max: totalRecords
          },
          y: {
            stacked: true,
            display: false
          }
        },
        layout: {
          padding: {
            left: 0,
            right: 0
          }
        }
      };

      const ctx = canvasRef.current.getContext('2d');
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: chartData,
        options: options,
      });
    }

    // Cleanup chart on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        width: '100%', 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #333', 
        borderRadius: '8px', 
        padding: '15px',
        height: '120px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p style={{ color: '#666', fontSize: '14px' }}>No review backlog data available</p>
      </div>
    );
  }

  const totalRecords = data.reduce((sum, item) => sum + item.value, 0);
  const needsReview = data.find(item => item.label === 'Needs Review')?.value || 0;
  const needsRereview = data.find(item => item.label === 'Needs Rereview')?.value || 0;
  const reviewed = data.find(item => item.label === 'Reviewed')?.value || 0;

  return (
    <div style={{ 
      width: '100%', 
      backgroundColor: '#f5f5f5', 
      border: '1px solid #333', 
      borderRadius: '8px', 
      padding: '15px' 
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
       {totalRecords} Ships
      </div>
      
      
      <div style={{ height: '90px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
