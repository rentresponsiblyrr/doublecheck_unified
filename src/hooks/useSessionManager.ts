import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SessionConfig {
  inactivityTimeoutMs: number; // Time before warning (default: 110 minutes)
  warningDurationMs: number;   // Warning countdown duration (default: 10 minutes)
  maxSessionDurationMs: number; // Maximum session length (default: 12 hours)
  rememberMeDurationMs: number; // Remember me duration (default: 7 days)
  enableRememberMe: boolean;    // Whether remember me is enabled
}

export interface SessionState {
  isActive: boolean;
  showWarning: boolean;
  timeUntilLogout: number; // seconds
  timeUntilExpiry: number; // seconds
  lastActivity: Date | null;
  sessionStartTime: Date | null;
}

const DEFAULT_CONFIG: SessionConfig = {
  inactivityTimeoutMs: 110 * 60 * 1000, // 110 minutes (warning at 110, logout at 120)
  warningDurationMs: 10 * 60 * 1000,    // 10 minutes warning
  maxSessionDurationMs: 12 * 60 * 60 * 1000, // 12 hours
  rememberMeDurationMs: 7 * 24 * 60 * 60 * 1000, // 7 days
  enableRememberMe: true
};

// Activity events to monitor
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keypress',
  'scroll',
  'touchstart',
  'click'
];

export const useSessionManager = (config: Partial<SessionConfig> = {}) => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const [sessionState, setSessionState] = useState<SessionState>({
    isActive: true,
    showWarning: false,
    timeUntilLogout: 0,
    timeUntilExpiry: 0,
    lastActivity: null,
    sessionStartTime: null
  });

  const lastActivityRef = useRef<Date>(new Date());
  const sessionStartRef = useRef<Date>(new Date());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update activity timestamp
  const updateActivity = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;
    
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      showWarning: false
    }));

    // Session activity updated (log removed to prevent console spam)
    
    // Reset timers if warning was shown
    if (sessionState.showWarning) {
      clearWarningTimers();
      scheduleWarning();
    }
  }, [sessionState.showWarning]);

  // Clear all timers
  const clearWarningTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  // Force logout
  const forceLogout = useCallback(async (reason: string) => {
    console.log('🚪 Session timeout - forcing logout:', reason);
    
    clearWarningTimers();
    
    try {
      await supabase.auth.signOut();
      
      setSessionState(prev => ({
        ...prev,
        isActive: false,
        showWarning: false
      }));
      
      // Show user-friendly logout message
      alert(`Your session has expired due to ${reason}. Please log in again.`);
      window.location.reload();
    } catch (error) {
      console.error('❌ Error during forced logout:', error);
      window.location.reload(); // Force reload as fallback
    }
  }, [clearWarningTimers]);

  // Start countdown timer
  const startCountdown = useCallback(() => {
    let secondsLeft = Math.floor(fullConfig.warningDurationMs / 1000);
    
    setSessionState(prev => ({
      ...prev,
      timeUntilLogout: secondsLeft
    }));

    countdownTimerRef.current = setInterval(() => {
      secondsLeft -= 1;
      
      setSessionState(prev => ({
        ...prev,
        timeUntilLogout: secondsLeft
      }));

      if (secondsLeft <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      }
    }, 1000);
  }, [fullConfig.warningDurationMs]);

  // Show warning and schedule logout
  const showInactivityWarning = useCallback(() => {
    console.log('⚠️ Showing inactivity warning');
    
    setSessionState(prev => ({
      ...prev,
      showWarning: true
    }));

    startCountdown();

    // Schedule logout after warning period
    logoutTimerRef.current = setTimeout(() => {
      forceLogout('inactivity');
    }, fullConfig.warningDurationMs);
  }, [forceLogout, fullConfig.warningDurationMs, startCountdown]);

  // Schedule warning timer
  const scheduleWarning = useCallback(() => {
    clearWarningTimers();
    
    warningTimerRef.current = setTimeout(() => {
      showInactivityWarning();
    }, fullConfig.inactivityTimeoutMs);
    
    console.log(`📅 Session warning scheduled for ${new Date(Date.now() + fullConfig.inactivityTimeoutMs).toLocaleTimeString()}`);
  }, [clearWarningTimers, showInactivityWarning, fullConfig.inactivityTimeoutMs]);

  // Check maximum session duration
  const checkMaxSessionDuration = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartRef.current.getTime();
    
    if (sessionDuration >= fullConfig.maxSessionDurationMs) {
      forceLogout('maximum session duration exceeded');
      return true;
    }
    
    const timeUntilExpiry = Math.floor((fullConfig.maxSessionDurationMs - sessionDuration) / 1000);
    setSessionState(prev => ({
      ...prev,
      timeUntilExpiry
    }));
    
    return false;
  }, [forceLogout, fullConfig.maxSessionDurationMs]);

  // Extend session (called when user interacts during warning)
  const extendSession = useCallback(() => {
    console.log('🔄 Session extended by user action');
    updateActivity();
  }, [updateActivity]);

  // Manual logout
  const logout = useCallback(async () => {
    console.log('👋 Manual logout initiated');
    clearWarningTimers();
    
    try {
      await supabase.auth.signOut();
      setSessionState(prev => ({
        ...prev,
        isActive: false,
        showWarning: false
      }));
    } catch (error) {
      console.error('❌ Error during manual logout:', error);
    }
  }, [clearWarningTimers]);

  // Set up activity listeners
  useEffect(() => {
    console.log('🔒 Session manager initialized with config:', {
      inactivityTimeout: Math.floor(fullConfig.inactivityTimeoutMs / 60000) + ' minutes',
      warningDuration: Math.floor(fullConfig.warningDurationMs / 60000) + ' minutes',
      maxSessionDuration: Math.floor(fullConfig.maxSessionDurationMs / 3600000) + ' hours'
    });

    // Initialize session
    const now = new Date();
    lastActivityRef.current = now;
    sessionStartRef.current = now;
    
    setSessionState(prev => ({
      ...prev,
      lastActivity: now,
      sessionStartTime: now,
      isActive: true
    }));

    // Add activity event listeners
    const handleActivity = () => updateActivity();
    
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Schedule initial warning
    scheduleWarning();

    // Set up max session duration check
    const maxSessionTimer = setTimeout(() => {
      forceLogout('maximum session duration exceeded');
    }, fullConfig.maxSessionDurationMs);

    // Periodic session duration check (every 5 minutes)
    const sessionCheckInterval = setInterval(() => {
      checkMaxSessionDuration();
    }, 5 * 60 * 1000);

    return () => {
      // Cleanup
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      clearWarningTimers();
      clearTimeout(maxSessionTimer);
      clearInterval(sessionCheckInterval);
    };
  }, [fullConfig, updateActivity, scheduleWarning, forceLogout, checkMaxSessionDuration, clearWarningTimers]);

  return {
    sessionState,
    extendSession,
    logout,
    config: fullConfig
  };
};