import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Simple activity tracker that logs every 5 seconds
 */
export function useActivityTracker(component, token, options = {}) {
  const [isActive, setIsActive] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);
  const [sessionId, setSessionId] = useState(null);
  
  const lastActivityRef = useRef(Date.now());
  const heartbeatRef = useRef(null);
  const sessionStartRef = useRef(null);
  const activityLogRef = useRef([]);

  // Simple activity logging function (works with or without token)
  const logActivity = useCallback(async (activityType = 'session', timeSpent = 0, metadata = {}, gameRecordId = null) => {

    
    try {
      const response = await fetch('/api/LogActivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          activityType,
          timeSpent,
          component,
          sessionId,
          gameRecordId,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`,
            sessionId,
            activityLog: activityLogRef.current.filter(activity => {
              const activityTime = new Date(activity.timestamp).getTime();
              const now = Date.now();
              return (now - activityTime) < 15000; // Only last 15 seconds
            }),
            totalInteractions: activityLogRef.current.length
          }
        })
      });

      if (response.ok) {
        console.log(`✅ Activity logged: ${timeSpent}s in ${component}`);
      } else {
        console.error('❌ Failed to log activity:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error logging activity:', error);
    }
  }, [component, sessionId]);

  // Start session when component mounts (works with or without token)
  useEffect(() => {
    if (!isActive) {
      const newSessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🎯 Starting session:', newSessionId, token ? '(authenticated)' : '(anonymous)');
      
      setSessionId(newSessionId);
      setIsActive(true);
      sessionStartRef.current = Date.now();
    }
  }, [isActive, component]);

  // Track user activity (works with or without token)
  const trackActivity = useCallback((event) => {
    const now = Date.now();
    lastActivityRef.current = now;
    
    // Log detailed activity
    const activityEntry = {
      timestamp: new Date().toISOString(),
      eventType: event?.type || 'unknown',
      target: event?.target?.tagName || 'unknown',
      targetId: event?.target?.id || null,
      targetClass: event?.target?.className || null,
      x: event?.clientX || null,
      y: event?.clientY || null,
      key: event?.key || null,
      button: event?.button || null,
      deltaX: event?.deltaX || null,
      deltaY: event?.deltaY || null,
      deltaZ: event?.deltaZ || null,
      scrollX: window?.scrollX || null,
      scrollY: window?.scrollY || null,
      viewportWidth: window?.innerWidth || null,
      viewportHeight: window?.innerHeight || null
    };
    
    // Add to activity log (keep last 50 interactions)
    activityLogRef.current.push(activityEntry);
    if (activityLogRef.current.length > 50) {
      activityLogRef.current = activityLogRef.current.slice(-50);
    }
    
    if (!isActive) {
      setIsActive(true);
      sessionStartRef.current = now;
    }
  }, [isActive]);

  // Set up comprehensive activity listeners (works with or without token)
  useEffect(() => {
    const events = [
      'mousedown', 'mousemove', 'mouseup', 'click', 'dblclick',
      'keydown', 'keyup', 'keypress',
      'scroll', 'wheel',
      'touchstart', 'touchmove', 'touchend',
      'focus', 'blur',
      'resize'
    ];
    
    const throttledTrackActivity = throttle((event) => {
      trackActivity(event);
    }, 1000);

    events.forEach(event => {
      document.addEventListener(event, throttledTrackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledTrackActivity, true);
      });
    };
  }, [trackActivity]);

  // Log heartbeat every 15 seconds ONLY if there's been recent user activity
  useEffect(() => {
    if (!isActive) return;

    console.log('💓 Setting up activity-based heartbeat for session:', sessionId);
    
    heartbeatRef.current = setInterval(() => {
      if (isActive && sessionStartRef.current) {
        const now = Date.now();
        const timeSinceLastActivity = now - lastActivityRef.current;
        const sessionTime = Math.floor((now - sessionStartRef.current) / 1000);
        
        // Only log heartbeat if there's been activity in the last 15 seconds
        if (timeSinceLastActivity < 15000) {
          console.log(`💓 Logging heartbeat: ${sessionTime}s total (activity within 15s)`);
          
          logActivity('heartbeat', 15, {
            sessionId,
            heartbeatInterval: 15,
            timeSinceLastActivity: Math.floor(timeSinceLastActivity / 1000)
          });
        } else {
          console.log(`💓 Skipping heartbeat: no activity for ${Math.floor(timeSinceLastActivity / 1000)}s`);
        }
      }
    }, 15000); // Every 15 seconds

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [isActive, sessionId, logActivity]);

  // Manual activity logging
  const logSpecificActivity = useCallback((activityType, metadata = {}) => {
    console.log(`🎮 Logging specific activity: ${activityType}`, metadata);
    logActivity(activityType, 0, metadata);
  }, [logActivity]);

  // Game play tracking
  const [isGamePlaying, setIsGamePlaying] = useState(false);
  
  const logGamePlayStart = useCallback((gameData = {}) => {
    if (!isGamePlaying) {
      console.log('🎮 Game play started');
      setIsGamePlaying(true);
      logActivity('game_play_start', 0, {
        ...gameData,
        timestamp: new Date().toISOString()
      }, gameData.gameRecordId);
    }
  }, [isGamePlaying, logActivity]);

  const logGamePlayStop = useCallback((gameData = {}) => {
    if (isGamePlaying) {
      console.log('🛑 Game play stopped');
      setIsGamePlaying(false);
      logActivity('game_play_stop', 0, {
        ...gameData,
        timestamp: new Date().toISOString()
      }, gameData.gameRecordId);
    }
  }, [isGamePlaying, logActivity]);

  return {
    isActive,
    totalTimeSpent,
    sessionId,
    logSpecificActivity,
    trackActivity,
    logGamePlayStart,
    logGamePlayStop,
    isGamePlaying
  };
}

// Throttle utility function
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}