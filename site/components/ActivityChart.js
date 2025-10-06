import { useEffect, useRef } from 'react';

export default function ActivityChart({ data }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    // Clear previous chart
    chartRef.current.innerHTML = '';

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '300');
    svg.setAttribute('viewBox', '0 0 800 300');

    // Chart dimensions
    const margin = { top: 20, right: 80, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Create main group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${margin.left},${margin.top})`);

    // Find data ranges
    const dates = data.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Convert heartbeats to hours (4 heartbeats = 1 minute, 60 minutes = 1 hour)
    const convertHeartbeatsToHours = (heartbeats) => heartbeats / 4 / 60;
    
    const allValues = [
      ...data.map(d => convertHeartbeatsToHours(d.heartbeats || 0)),
      ...data.map(d => d.tabSwitches || 0),
      ...data.map(d => d.gamePlays || 0)
    ];
    const maxValue = Math.max(...allValues);

    // Scales
    const xScale = (date) => {
      return ((new Date(date) - minDate) / (maxDate - minDate)) * width;
    };
    
    const yScale = (value) => {
      return height - (value / maxValue) * height;
    };

    // Create line paths
    const createLinePath = (values, color, key) => {
      const points = data.map((d, i) => {
        const x = xScale(d.date);
        let y;
        if (key === 'heartbeats') {
          y = yScale(convertHeartbeatsToHours(d.heartbeats || 0));
        } else {
          y = yScale(d[key] || 0);
        }
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      }).join(' ');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', points);
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      return path;
    };

    // Add lines
    const heartbeatPath = createLinePath(data, '#ff6b6b', 'heartbeats');
    const tabSwitchPath = createLinePath(data, '#4ecdc4', 'tabSwitches');
    const gamePlayPath = createLinePath(data, '#45b7d1', 'gamePlays');

    g.appendChild(heartbeatPath);
    g.appendChild(tabSwitchPath);
    g.appendChild(gamePlayPath);

    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
      pointer-events: none;
      z-index: 1000;
      display: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    `;
    chartRef.current.appendChild(tooltip);

    // Add circles for data points with hover events
    data.forEach((d, i) => {
      const x = xScale(d.date);
      
      // Heartbeats
      if (d.heartbeats > 0) {
        const circle1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle1.setAttribute('cx', x);
        circle1.setAttribute('cy', yScale(convertHeartbeatsToHours(d.heartbeats)));
        circle1.setAttribute('r', '4');
        circle1.setAttribute('fill', '#ff6b6b');
        circle1.setAttribute('cursor', 'pointer');
        circle1.style.transition = 'r 0.2s ease';
        
        circle1.addEventListener('mouseenter', (e) => {
          circle1.setAttribute('r', '6');
          const dateStr = new Date(d.date).toLocaleDateString();
          const hours = convertHeartbeatsToHours(d.heartbeats).toFixed(2);
          tooltip.innerHTML = `
            <strong>${dateStr}</strong><br/>
            Hours Browsing: ${hours}<br/>
            Tab Switches: ${d.tabSwitches || 0}<br/>
            Game Plays: ${d.gamePlays || 0}
          `;
          tooltip.style.display = 'block';
        });
        
        circle1.addEventListener('mousemove', (e) => {
          tooltip.style.left = (e.pageX + 10) + 'px';
          tooltip.style.top = (e.pageY - 10) + 'px';
        });
        
        circle1.addEventListener('mouseleave', () => {
          circle1.setAttribute('r', '4');
          tooltip.style.display = 'none';
        });
        
        g.appendChild(circle1);
      }
      
      // Tab switches
      if (d.tabSwitches > 0) {
        const circle2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle2.setAttribute('cx', x);
        circle2.setAttribute('cy', yScale(d.tabSwitches));
        circle2.setAttribute('r', '4');
        circle2.setAttribute('fill', '#4ecdc4');
        circle2.setAttribute('cursor', 'pointer');
        circle2.style.transition = 'r 0.2s ease';
        
        circle2.addEventListener('mouseenter', (e) => {
          circle2.setAttribute('r', '6');
          const dateStr = new Date(d.date).toLocaleDateString();
          const hours = convertHeartbeatsToHours(d.heartbeats || 0).toFixed(2);
          tooltip.innerHTML = `
            <strong>${dateStr}</strong><br/>
            Hours: ${hours}<br/>
            Tab Switches: ${d.tabSwitches}<br/>
            Game Plays: ${d.gamePlays || 0}
          `;
          tooltip.style.display = 'block';
        });
        
        circle2.addEventListener('mousemove', (e) => {
          tooltip.style.left = (e.pageX + 10) + 'px';
          tooltip.style.top = (e.pageY - 10) + 'px';
        });
        
        circle2.addEventListener('mouseleave', () => {
          circle2.setAttribute('r', '4');
          tooltip.style.display = 'none';
        });
        
        g.appendChild(circle2);
      }
      
      // Game plays
      if (d.gamePlays > 0) {
        const circle3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle3.setAttribute('cx', x);
        circle3.setAttribute('cy', yScale(d.gamePlays));
        circle3.setAttribute('r', '4');
        circle3.setAttribute('fill', '#45b7d1');
        circle3.setAttribute('cursor', 'pointer');
        circle3.style.transition = 'r 0.2s ease';
        
        circle3.addEventListener('mouseenter', (e) => {
          circle3.setAttribute('r', '6');
          const dateStr = new Date(d.date).toLocaleDateString();
          const hours = convertHeartbeatsToHours(d.heartbeats || 0).toFixed(2);
          tooltip.innerHTML = `
            <strong>${dateStr}</strong><br/>
            Hours: ${hours}<br/>
            Tab Switches: ${d.tabSwitches || 0}<br/>
            Game Plays: ${d.gamePlays}
          `;
          tooltip.style.display = 'block';
        });
        
        circle3.addEventListener('mousemove', (e) => {
          tooltip.style.left = (e.pageX + 10) + 'px';
          tooltip.style.top = (e.pageY - 10) + 'px';
        });
        
        circle3.addEventListener('mouseleave', () => {
          circle3.setAttribute('r', '4');
          tooltip.style.display = 'none';
        });
        
        g.appendChild(circle3);
      }
    });

    // Add axes
    const createAxis = (x1, y1, x2, y2) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#333');
      line.setAttribute('stroke-width', '1');
      return line;
    };

    g.appendChild(createAxis(0, height, width, height)); // X-axis
    g.appendChild(createAxis(0, 0, 0, height)); // Y-axis

    // Add Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxValue / 5) * i);
      const y = height - (i / 5) * height;
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', -10);
      text.setAttribute('y', y + 5);
      text.setAttribute('text-anchor', 'end');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#666');
      text.textContent = value;
      g.appendChild(text);
    }

    // Add X-axis labels (sample dates)
    const sampleDates = data.filter((_, i) => i % Math.ceil(data.length / 5) === 0);
    sampleDates.forEach(d => {
      const x = xScale(d.date);
      const dateStr = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', height + 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', '#666');
      text.textContent = dateStr;
      g.appendChild(text);
    });

    svg.appendChild(g);

    // Add legend
    const legend = document.createElement('div');
    legend.style.cssText = `
      display: flex;
      gap: 20px;
      margin-top: 10px;
      justify-content: center;
      flex-wrap: wrap;
    `;

    const legendItems = [
      { color: '#ff6b6b', label: 'Hours Browsing' },
      { color: '#4ecdc4', label: 'Tab Switches' },
      { color: '#45b7d1', label: 'Game Plays' }
    ];

    legendItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
      
      const colorDiv = document.createElement('div');
      colorDiv.style.cssText = `
        width: 16px;
        height: 16px;
        background-color: ${item.color};
        border-radius: 2px;
      `;
      
      const labelSpan = document.createElement('span');
      labelSpan.textContent = item.label;
      labelSpan.style.fontSize = '14px';
      
      itemDiv.appendChild(colorDiv);
      itemDiv.appendChild(labelSpan);
      legend.appendChild(itemDiv);
    });

    chartRef.current.appendChild(svg);
    chartRef.current.appendChild(legend);

  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        No activity data available
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #e0e0e0', 
      borderRadius: '8px',
      backgroundColor: 'white'
    }}>
      <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Social Site Activity Over Time</h3>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '14px' }}>
        Hours spent browsing the social site per day (4 heartbeats = 1 minute)
      </p>
      <div ref={chartRef} />
      
      {/* Summary stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '16px',
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px'
      }}>
        <div>
          <strong>Total Hours Browsing:</strong> {data.reduce((sum, d) => sum + ((d.heartbeats || 0) / 4 / 60), 0).toFixed(2)}
        </div>
        <div>
          <strong>Total Tab Switches:</strong> {data.reduce((sum, d) => sum + (d.tabSwitches || 0), 0)}
        </div>
        <div>
          <strong>Total Game Plays:</strong> {data.reduce((sum, d) => sum + (d.gamePlays || 0), 0)}
        </div>
        <div>
          <strong>Days with Browsing:</strong> {data.filter(d => (d.heartbeats || 0) > 0).length}
        </div>
      </div>
    </div>
  );
}
