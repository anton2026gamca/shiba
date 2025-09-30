import React, { useRef, useEffect } from 'react';
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

const SignupCountComponent = ({ 
  totalSignups = 0,
  hackClubCommunity = 0,
  referrals = 0
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);
  
  const target = 10000;
  const percentage = Math.min((totalSignups / target) * 100, 100);

  const data = {
    labels: ['Signup Progress'],
    datasets: [
      {
        label: 'From Hack Club Community',
        data: [hackClubCommunity],
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
      },
      {
        label: 'From Referrals',
        data: [referrals],
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
      },
      {
        label: 'Remaining to Goal',
        data: [Math.max(0, target - totalSignups)],
        backgroundColor: 'rgba(224, 224, 224, 0.8)',
        borderColor: 'rgba(224, 224, 224, 1)',
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
            const percentage = ((value / target) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        max: target,
        display: false
      },
      y: {
        stacked: true,
        display: false
      }
    }
  };

  // Initialize chart
  useEffect(() => {
    if (canvasRef.current && !chartInstance.current) {
      const ctx = canvasRef.current.getContext('2d');
      chartInstance.current = new ChartJS(ctx, {
        type: 'bar',
        data: data,
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
  }, [totalSignups, hackClubCommunity, referrals]);

  return (
    <div style={{ 
      width: '100%', 
      backgroundColor: '#f5f5f5', 
      border: '1px solid #333', 
      borderRadius: '8px', 
      padding: '15px' 
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '14px', color: '#666' }}>
        {percentage.toFixed(1)}% of the way to 10,000 signups
      </div>
      <div style={{ height: '90px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default SignupCountComponent;
