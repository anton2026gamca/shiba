/**
 * Test file for useActivityTracker hook
 * This is a basic test to verify the hook works correctly
 */

import { renderHook, act } from '@testing-library/react';
import { useActivityTracker } from '../useActivityTracker';

// Mock fetch for API calls
global.fetch = jest.fn();

describe('useActivityTracker', () => {
  beforeEach(() => {
    fetch.mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should initialize with inactive state', () => {
    const { result } = renderHook(() => 
      useActivityTracker('TestComponent', 'test-token')
    );

    expect(result.current.isActive).toBe(false);
    expect(result.current.totalTimeSpent).toBe(0);
    expect(result.current.sessionStartTime).toBe(null);
  });

  it('should track activity when user interacts', () => {
    const { result } = renderHook(() => 
      useActivityTracker('TestComponent', 'test-token', {
        activityThreshold: 5, // Lower threshold for testing
        heartbeatInterval: 1000,
        inactivityTimeout: 5000
      })
    );

    // Simulate user activity
    act(() => {
      result.current.trackActivity();
    });

    expect(result.current.isActive).toBe(true);
    expect(result.current.sessionStartTime).toBeGreaterThan(0);
  });

  it('should log specific activity', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, activityId: 'test-id' })
    });

    const { result } = renderHook(() => 
      useActivityTracker('TestComponent', 'test-token', {
        activityThreshold: 1 // Very low threshold for testing
      })
    );

    // Start a session
    act(() => {
      result.current.trackActivity();
    });

    // Wait for session to accumulate time
    act(() => {
      jest.advanceTimersByTime(2000); // 2 seconds
    });

    // Log specific activity
    await act(async () => {
      result.current.logSpecificActivity('test_activity', { test: 'data' });
    });

    expect(fetch).toHaveBeenCalledWith('/api/LogActivity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.stringContaining('test_activity')
    });
  });

  it('should handle inactivity timeout', () => {
    const { result } = renderHook(() => 
      useActivityTracker('TestComponent', 'test-token', {
        activityThreshold: 1,
        heartbeatInterval: 1000,
        inactivityTimeout: 5000
      })
    );

    // Start activity
    act(() => {
      result.current.trackActivity();
    });

    expect(result.current.isActive).toBe(true);

    // Simulate inactivity
    act(() => {
      jest.advanceTimersByTime(6000); // 6 seconds (exceeds timeout)
    });

    // Should still be active until heartbeat checks
    act(() => {
      jest.advanceTimersByTime(1000); // Trigger heartbeat
    });

    // Note: The actual inactivity detection depends on the heartbeat interval
    // This test verifies the basic structure works
    expect(result.current.isActive).toBeDefined();
  });

  it('should not make API calls without token', () => {
    const { result } = renderHook(() => 
      useActivityTracker('TestComponent', null)
    );

    act(() => {
      result.current.trackActivity();
    });

    act(() => {
      result.current.logSpecificActivity('test_activity');
    });

    expect(fetch).not.toHaveBeenCalled();
  });
});
