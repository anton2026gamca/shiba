import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { FunnelController, TrapezoidElement } from 'chartjs-chart-funnel';

ChartJS.register(
  FunnelController,
  TrapezoidElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

const ShibaFunnelChart = ({ 
  signedUp = 1200, 
  onboarded = 850, 
  connectedHackatime = 600,
  slack = 500,
  logged10Hours = 400,
  logged20Hours = 250,
  logged30Hours = 150,
  logged40Hours = 100,
  logged50Hours = 80,
  logged60Hours = 60,
  logged70Hours = 45,
  logged80Hours = 35,
  logged90Hours = 25,
  logged100Hours = 20
}) => {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);
  
  const data = {
    labels: ['Signed Up', 'Onboarded', 'Slack', 'Hackatime', 'Logged 10 hours', 'Logged 20 hours', 'Logged 30 hours', 'Logged 40 hours', 'Logged 50 hours', 'Logged 60 hours', 'Logged 70 hours', 'Logged 80 hours', 'Logged 90 hours', 'Logged 100 hours'],
    datasets: [
      {
        data: [signedUp, onboarded, slack, connectedHackatime, logged10Hours, logged20Hours, logged30Hours, logged40Hours, logged50Hours, logged60Hours, logged70Hours, logged80Hours, logged90Hours, logged100Hours],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 159, 64, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    type: 'funnel',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || context.parsed;
            const percentage = ((value / signedUp) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Initialize chart
  useEffect(() => {
    if (canvasRef.current && !chartInstance.current) {
      const ctx = canvasRef.current.getContext('2d');
      chartInstance.current = new ChartJS(ctx, {
        type: 'funnel',
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
  }, [signedUp, onboarded, connectedHackatime, logged10Hours, logged20Hours, logged30Hours, logged40Hours, logged50Hours, logged60Hours, logged70Hours, logged80Hours, logged90Hours, logged100Hours]);

  return (
    <div style={{ width: '100%', marginTop: '20px', backgroundColor: '#f5f5f5', border: '1px solid #333', borderRadius: '8px', padding: '20px' }}>
      <div style={{ height: '300px' }}>
        <canvas ref={canvasRef} />
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#36a2eb' }}>
            {signedUp.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>Signed Up</div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4bc0c0' }}>
            {onboarded.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Onboarded ({((onboarded / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffce56' }}>
            {slack.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Slack ({((slack / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff9f40' }}>
            {connectedHackatime.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            Hackatime ({((connectedHackatime / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff9f40' }}>
            {logged10Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            10h ({((logged10Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff6384' }}>
            {logged20Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            20h ({((logged20Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#9966ff' }}>
            {logged30Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            30h ({((logged30Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffcd56' }}>
            {logged40Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            40h ({((logged40Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff6384' }}>
            {logged50Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            50h ({((logged50Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#36a2eb' }}>
            {logged60Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            60h ({((logged60Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#4bc0c0' }}>
            {logged70Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            70h ({((logged70Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffce56' }}>
            {logged80Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            80h ({((logged80Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff9f40' }}>
            {logged90Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            90h ({((logged90Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ff6384' }}>
            {logged100Hours.toLocaleString()}
          </div>
          <div style={{ fontSize: '10px', color: '#666' }}>
            100h ({((logged100Hours / signedUp) * 100).toFixed(1)}%)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShibaFunnelChart;
