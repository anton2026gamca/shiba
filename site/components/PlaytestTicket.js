import React from 'react';
import dynamic from 'next/dynamic';

const RadarChart = dynamic(() => import('@/components/RadarChart'), { ssr: false });

export default function PlaytestTicket({ playtest, onPlaytestClick }) {
  const handlePlaytest = () => {
    console.log('Playtest clicked for:', playtest.gameName);
    if (onPlaytestClick) {
      onPlaytestClick(playtest);
    }
  };

  return (
    <div
      style={{
        border: '2px solid #ff6fa5',
        borderRadius: 10,
        background: 'rgba(255,255,255,0.8)',
        padding: 16,
        color: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      {/* Left side - Spinning disk */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          className="cd-vinyl"
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '1px solid grey',
            background: playtest.gameThumbnail 
              ? `url(${playtest.gameThumbnail})` 
              : 'radial-gradient(circle at 40% 40%, #f0f0f0 0%, #d9d9d9 40%, #c7c7c7 70%, #bdbdbd 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            animation: 'spin 8s linear infinite',
            position: 'relative',
            boxShadow: `
              0 0 8px rgba(255, 255, 255, 0.15),
              0 0 15px rgba(255, 255, 255, 0.1),
              inset 0 0 5px rgba(255, 255, 255, 0.05)
            `,
          }}
        >
          {/* Vinyl overlay for rainbow effect */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              pointerEvents: 'none',
              opacity: 0.18,
              background: 'conic-gradient(white, white, white, grey, grey, violet, deepskyblue, aqua, palegreen, yellow, orange, red, grey, grey, white, white, white, white, grey, grey, violet, deepskyblue, aqua, palegreen, yellow, orange, red, grey, grey, white)',
              mixBlendMode: 'screen',
            }}
          />
          
          {/* Outer ring */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '30%',
              height: '30%',
              margin: '-15% 0 0 -15%',
              borderRadius: 'inherit',
              background: 'lightgrey',
              backgroundClip: 'padding-box',
              border: '4px solid rgba(0, 0, 0, 0.2)',
              boxShadow: '0 0 1px grey',
              boxSizing: 'border-box',
            }}
          />
          
          {/* Center hole */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '18%',
              height: '18%',
              margin: '-9% 0 0 -9%',
              borderRadius: 'inherit',
              background: '#444444',
              backgroundClip: 'padding-box',
              border: '4px solid rgba(0, 0, 0, 0.1)',
              filter: 'drop-shadow(0 0 1px grey)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Middle - Game info */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h3 style={{ 
          margin: 0, 
          marginBottom: 8, 
          fontSize: 20, 
          fontWeight: 600,
          color: '#000'
        }}>
          {playtest.gameName || 'Unnamed Game'}
        </h3>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{ 
            display: 'inline-block',
            padding: '4px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            background: playtest.status === 'Complete' ? 'rgba(40, 167, 69, 0.2)' : 
                       playtest.status === 'In Progress' ? 'rgba(251, 191, 36, 0.2)' : 
                       'rgba(156, 163, 175, 0.2)',
            color: playtest.status === 'Complete' ? '#28a745' : 
                   playtest.status === 'In Progress' ? '#fbbf24' : 
                   '#9ca3af'
          }}>
            {playtest.status}
          </div>
          
          {/* <span style={{ fontSize: 12, opacity: 0.7, color: '#000' }}>
            ID: {playtest.playtestId}
          </span> */}
        </div>
        
        {playtest.instructions && (
          <p style={{ 
            margin: 0, 
            marginTop: 8,
            fontSize: 14, 
            opacity: 0.9,
            lineHeight: 1.4,
            color: '#000'
          }}>
            {playtest.instructions}
          </p>
        )}
      </div>

      {/* Right side - Button or Skill Tree */}
      <div style={{ flexShrink: 0 }}>
        {playtest.status === 'Complete' ? (
          <div style={{ 
            width: 160, 
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible'
          }}>
            <RadarChart
              data={[
                playtest.funScore || 0,
                playtest.creativityScore || 0,
                playtest.audioScore || 0,
                playtest.artScore || 0,
                playtest.moodScore || 0
              ]}
              labels={['Fun', 'Creativity', 'Audio', 'Art', 'Mood']}
              width={160}
              height={120}
              backgroundColor="rgba(0, 0, 0, 0.1)"
              borderColor="rgba(0, 0, 0, 0.8)"
              pointBackgroundColor="rgba(0, 0, 0, 0.8)"
              pointBorderColor="rgba(0, 0, 0, 0.8)"
              animate={false}
              isMiniature={true}
            />
          </div>
        ) : (
          <button
            onClick={handlePlaytest}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(180deg, #ff8ec3 0%, #ff6fa5 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 120ms ease',
            }}
          >
            Playtest
          </button>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
