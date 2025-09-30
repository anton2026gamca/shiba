/**
 * Simple in-memory rate limiting utility
 * Note: In production, use Redis or a proper rate limiting service
 */

const rateLimitStore = new Map();

/**
 * Rate limiter function
 * @param {string} key - Unique identifier for the rate limit (e.g., IP, user ID)
 * @param {number} maxRequests - Maximum number of requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} - Whether the request is allowed
 */
export function checkRateLimit(key, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const requests = rateLimitStore.get(key);
  
  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  // Add current request
  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  
  return true;
}

/**
 * Get rate limit info for a key
 * @param {string} key - Unique identifier
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} - Rate limit information
 */
export function getRateLimitInfo(key, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    return { remaining: 100, resetTime: now + windowMs };
  }
  
  const requests = rateLimitStore.get(key);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  return {
    remaining: Math.max(0, 100 - validRequests.length),
    resetTime: windowStart + windowMs
  };
}

/**
 * Clean up old rate limit entries (call periodically)
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  
  for (const [key, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
    if (validRequests.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, validRequests);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
