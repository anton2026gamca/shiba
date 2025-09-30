/**
 * Utility functions for activity tracking and analytics
 */

/**
 * Format time spent in a human-readable format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTimeSpent(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
}

/**
 * Calculate session duration from start and end timestamps
 * @param {number} startTime - Start timestamp in milliseconds
 * @param {number} endTime - End timestamp in milliseconds (optional, defaults to now)
 * @returns {number} Duration in seconds
 */
export function calculateSessionDuration(startTime, endTime = Date.now()) {
  return Math.floor((endTime - startTime) / 1000);
}

/**
 * Check if a session meets the minimum activity threshold
 * @param {number} duration - Session duration in seconds
 * @param {number} threshold - Minimum threshold in seconds (default: 30)
 * @returns {boolean} Whether the session meets the threshold
 */
export function meetsActivityThreshold(duration, threshold = 30) {
  return duration >= threshold;
}

/**
 * Generate activity metadata with common fields
 * @param {Object} customMetadata - Custom metadata to include
 * @returns {Object} Complete metadata object
 */
export function generateActivityMetadata(customMetadata = {}) {
  return {
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
    screenResolution: typeof window !== 'undefined' ? 
      `${window.screen.width}x${window.screen.height}` : '',
    viewportSize: typeof window !== 'undefined' ? 
      `${window.innerWidth}x${window.innerHeight}` : '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...customMetadata
  };
}

/**
 * Debounce function for activity tracking
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounceActivity(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for activity tracking
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttleActivity(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Activity types and their descriptions
 */
export const ACTIVITY_TYPES = {
  SESSION: 'session',
  TAB_SWITCH: 'tab_switch',
  LOAD_MORE: 'load_more_posts',
  GAME_PLAY_START: 'game_play_started',
  GAME_FULLSCREEN_START: 'game_fullscreen_start',
  CREATOR_PROFILE_CLICK: 'creator_profile_click',
  COMPONENT_MOUNT: 'component_mount',
  COMPONENT_UNMOUNT: 'component_unmount'
};

/**
 * Get activity type description
 * @param {string} activityType - Activity type
 * @returns {string} Human-readable description
 */
export function getActivityDescription(activityType) {
  const descriptions = {
    [ACTIVITY_TYPES.SESSION]: 'User session',
    [ACTIVITY_TYPES.TAB_SWITCH]: 'Tab navigation',
    [ACTIVITY_TYPES.LOAD_MORE]: 'Loaded more content',
    [ACTIVITY_TYPES.GAME_PLAY_START]: 'Started playing a game',
    [ACTIVITY_TYPES.GAME_FULLSCREEN_START]: 'Started game in fullscreen',
    [ACTIVITY_TYPES.CREATOR_PROFILE_CLICK]: 'Clicked creator profile',
    [ACTIVITY_TYPES.COMPONENT_MOUNT]: 'Component mounted',
    [ACTIVITY_TYPES.COMPONENT_UNMOUNT]: 'Component unmounted'
  };
  
  return descriptions[activityType] || 'Unknown activity';
}
