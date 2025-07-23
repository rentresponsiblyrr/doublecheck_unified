/**
 * ENHANCED MEMORY CLEANUP - PRODUCTION-GRADE HOOKS
 *
 * Advanced React hooks for memory leak prevention and cleanup management.
 * Integrates with MemoryLeakDetector for comprehensive leak prevention
 * and provides Netflix/Meta-standard memory management patterns.
 *
 * @author STR Certified Engineering Team
 * @version 1.0 - Production Ready
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { memoryLeakDetector } from "./MemoryLeakDetector";
import { logger } from "@/utils/logger";

/**
 * Enhanced memory cleanup hook with leak detection integration
 */
export const useEnhancedMemoryCleanup = (componentName?: string) => {
  const componentId = useRef(
    `${componentName || "component"}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  );
  const cleanupFunctions = useRef<Array<() => void>>([]);
  const timers = useRef<Set<NodeJS.Timeout | number>>(new Set());
  const observers = useRef<
    Set<IntersectionObserver | MutationObserver | ResizeObserver>
  >(new Set());
  const eventListeners = useRef<
    Map<
      EventTarget,
      Array<{
        event: string;
        listener: EventListener;
        options?: boolean | AddEventListenerOptions;
      }>
    >
  >(new Map());
  const abortControllers = useRef<Set<AbortController>>(new Set());

  // Register cleanup function
  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
    memoryLeakDetector.registerCleanup(componentId.current, cleanup);
  }, []);

  // Safe setTimeout with automatic cleanup
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      timers.current.delete(timer);
      memoryLeakDetector.cleanupTimer(timer);
    }, delay);

    timers.current.add(timer);
    memoryLeakDetector.trackTimer(timer, "timeout");

    return timer;
  }, []);

  // Safe setInterval with automatic cleanup
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const timer = setInterval(callback, delay);

    timers.current.add(timer);
    memoryLeakDetector.trackTimer(timer, "interval");

    return timer;
  }, []);

  // Safe event listener with automatic cleanup
  const safeAddEventListener = useCallback(
    (
      target: EventTarget,
      event: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions,
    ) => {
      target.addEventListener(event, listener, options);

      // Track for cleanup
      if (!eventListeners.current.has(target)) {
        eventListeners.current.set(target, []);
      }
      eventListeners.current.get(target)!.push({ event, listener, options });
      memoryLeakDetector.trackEventListener(target, event, listener, options);
    },
    [],
  );

  // Safe observer with automatic cleanup
  const safeCreateObserver = useCallback(
    <T extends IntersectionObserver | MutationObserver | ResizeObserver>(
      ObserverClass: new (...args: unknown[]) => T,
      ...args: unknown[]
    ): T => {
      const observer = new ObserverClass(...args);

      observers.current.add(observer);
      memoryLeakDetector.trackObserver(observer);

      return observer;
    },
    [],
  );

  // Safe fetch with abort controller
  const safeFetch = useCallback(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const controller = new AbortController();
      abortControllers.current.add(controller);

      const enhancedInit = {
        ...init,
        signal: controller.signal,
      };

      const fetchPromise = fetch(input, enhancedInit);

      // Cleanup controller after request completes
      fetchPromise.finally(() => {
        abortControllers.current.delete(controller);
      });

      return fetchPromise;
    },
    [],
  );

  // Manual cleanup trigger
  const executeCleanup = useCallback(() => {
    // Clear all timers
    timers.current.forEach((timer) => {
      if (typeof timer === "number") {
        clearTimeout(timer);
      } else {
        clearTimeout(timer);
      }
      memoryLeakDetector.cleanupTimer(timer);
    });
    timers.current.clear();

    // Disconnect all observers
    observers.current.forEach((observer) => {
      observer.disconnect();
      memoryLeakDetector.cleanupObserver(observer);
    });
    observers.current.clear();

    // Remove all event listeners
    eventListeners.current.forEach((listeners, target) => {
      listeners.forEach(({ event, listener, options }) => {
        target.removeEventListener(event, listener, options);
        memoryLeakDetector.cleanupEventListener(target, event, listener);
      });
    });
    eventListeners.current.clear();

    // Abort all ongoing requests
    abortControllers.current.forEach((controller) => {
      controller.abort();
    });
    abortControllers.current.clear();

    // Execute custom cleanup functions
    cleanupFunctions.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        logger.error("Custom cleanup function failed", {
          componentId: componentId.current,
          error,
        });
      }
    });
    cleanupFunctions.current = [];

    // Notify detector
    memoryLeakDetector.executeCleanup(componentId.current);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      executeCleanup();
    };
  }, [executeCleanup]);

  return {
    registerCleanup,
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    safeCreateObserver,
    safeFetch,
    executeCleanup,
    componentId: componentId.current,
  };
};

/**
 * Hook for monitoring component memory usage
 */
export const useMemoryMonitor = (componentName: string) => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usage: number;
    peak: number;
    leaks: number;
  }>({
    usage: 0,
    peak: 0,
    leaks: 0,
  });

  useEffect(() => {
    const updateMemoryInfo = () => {
      const stats = memoryLeakDetector.getMemoryStats();
      setMemoryInfo({
        usage: stats.currentUsage,
        peak: stats.peakUsage,
        leaks: stats.leaksDetected.length,
      });
    };

    // Update immediately
    updateMemoryInfo();

    // Update periodically
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  return memoryInfo;
};

/**
 * Hook for safe DOM references that prevent memory leaks
 */
export const useSafeDOMRef = <T extends HTMLElement = HTMLElement>() => {
  const elementRef = useRef<T | null>(null);
  const { registerCleanup } = useEnhancedMemoryCleanup();

  const setElement = useCallback((element: T | null) => {
    elementRef.current = element;
  }, []);

  // Register cleanup to nullify ref
  useEffect(() => {
    registerCleanup(() => {
      elementRef.current = null;
    });
  }, [registerCleanup]);

  return [elementRef, setElement] as const;
};

/**
 * Hook for safe closure management
 */
export const useSafeClosure = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  dependencies: React.DependencyList,
): T => {
  const callbackRef = useRef<T>(callback);
  const { registerCleanup } = useEnhancedMemoryCleanup();

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  });

  // Create stable callback that won't hold onto old closures
  const stableCallback = useCallback((...args: Parameters<T>) => {
    return callbackRef.current(...args);
  }, dependencies) as T;

  // Register cleanup to nullify callback ref
  useEffect(() => {
    registerCleanup(() => {
      callbackRef.current = null as any;
    });
  }, [registerCleanup]);

  return stableCallback;
};

/**
 * Hook for safe WebSocket management
 */
export const useSafeWebSocket = (
  url: string | null,
  options?: {
    onOpen?: (event: Event) => void;
    onMessage?: (event: MessageEvent) => void;
    onError?: (event: Event) => void;
    onClose?: (event: CloseEvent) => void;
  },
) => {
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<
    WebSocket["readyState"]
  >(WebSocket.CLOSED);
  const { registerCleanup, safeAddEventListener } =
    useEnhancedMemoryCleanup("WebSocket");

  useEffect(() => {
    if (!url) {
      setWebSocket(null);
      setConnectionState(WebSocket.CLOSED);
      return;
    }

    const ws = new WebSocket(url);
    setWebSocket(ws);

    // Add event listeners safely
    if (options?.onOpen) {
      safeAddEventListener(ws, "open", (event) => {
        setConnectionState(ws.readyState);
        options.onOpen!(event);
      });
    }

    if (options?.onMessage) {
      safeAddEventListener(ws, "message", options.onMessage);
    }

    if (options?.onError) {
      safeAddEventListener(ws, "error", (event) => {
        setConnectionState(ws.readyState);
        options.onError!(event);
      });
    }

    if (options?.onClose) {
      safeAddEventListener(ws, "close", (event) => {
        setConnectionState(ws.readyState);
        options.onClose!(event);
      });
    }

    // Register WebSocket cleanup
    registerCleanup(() => {
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
      setWebSocket(null);
      setConnectionState(WebSocket.CLOSED);
    });

    return () => {
      if (
        ws.readyState === WebSocket.CONNECTING ||
        ws.readyState === WebSocket.OPEN
      ) {
        ws.close();
      }
    };
  }, [url, registerCleanup, safeAddEventListener]);

  const sendMessage = useCallback(
    (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
      if (webSocket && webSocket.readyState === WebSocket.OPEN) {
        webSocket.send(data);
      } else {
        logger.warn("Attempted to send message on closed WebSocket");
      }
    },
    [webSocket],
  );

  return {
    webSocket,
    connectionState,
    sendMessage,
    isConnecting: connectionState === WebSocket.CONNECTING,
    isOpen: connectionState === WebSocket.OPEN,
    isClosing: connectionState === WebSocket.CLOSING,
    isClosed: connectionState === WebSocket.CLOSED,
  };
};

/**
 * Hook for safe media stream management (camera, microphone)
 */
export const useSafeMediaStream = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { registerCleanup } = useEnhancedMemoryCleanup("MediaStream");

  const startStream = useCallback(
    async (constraints: MediaStreamConstraints) => {
      try {
        setError(null);
        const mediaStream =
          await navigator.mediaDevices.getUserMedia(constraints);
        setStream(mediaStream);

        // Register cleanup for media stream
        registerCleanup(() => {
          mediaStream.getTracks().forEach((track) => {
            track.stop();
          });
          setStream(null);
        });

        return mediaStream;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to access media stream";
        setError(errorMessage);
        logger.error("Media stream error", { error: err, constraints });
        throw err;
      }
    },
    [registerCleanup],
  );

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
  }, [stream]);

  return {
    stream,
    error,
    startStream,
    stopStream,
    isActive:
      stream !== null &&
      stream.getTracks().some((track) => track.readyState === "live"),
  };
};

/**
 * Hook for performance monitoring with memory leak detection
 */
export const usePerformanceMonitor = (componentName: string) => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    reRenderCount: 0,
  });

  const renderCount = useRef(0);
  const { registerCleanup } = useEnhancedMemoryCleanup("PerformanceMonitor");

  useEffect(() => {
    renderCount.current += 1;

    const startTime = performance.now();

    // Use requestAnimationFrame to measure render time
    const measureRender = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Get memory usage if available
      const memoryUsage = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024
        : 0;

      setMetrics({
        renderTime,
        memoryUsage,
        reRenderCount: renderCount.current,
      });

      // Log performance warnings
      if (renderTime > 16) {
        // More than one frame at 60fps
        logger.warn(`Component ${componentName} render time exceeded 16ms`, {
          renderTime,
          component: componentName,
          renderCount: renderCount.current,
        });
      }
    };

    const rafId = requestAnimationFrame(measureRender);

    registerCleanup(() => {
      cancelAnimationFrame(rafId);
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  });

  return metrics;
};
