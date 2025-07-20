/**
 * Memory Cleanup Hook
 * Prevents memory leaks and ensures proper resource cleanup
 */

import { useEffect, useRef, useCallback } from 'react';

interface CleanupFunction {
  (): void;
}

interface ResourceManager {
  addCleanup: (cleanup: CleanupFunction) => void;
  cleanup: () => void;
  isCleanedUp: boolean;
}

export function useMemoryCleanup(): ResourceManager {
  const cleanupFunctions = useRef<Set<CleanupFunction>>(new Set());
  const isCleanedUp = useRef(false);
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const intervals = useRef<Set<NodeJS.Timeout>>(new Set());
  const eventListeners = useRef<Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }>>([]);

  const addCleanup = useCallback((cleanup: CleanupFunction) => {
    if (!isCleanedUp.current) {
      cleanupFunctions.current.add(cleanup);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (isCleanedUp.current) return;

    // Execute all cleanup functions
    cleanupFunctions.current.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        // REMOVED: console.error('Cleanup function failed:', error);
      }
    });

    // Clear all timers
    timers.current.forEach(timer => clearTimeout(timer));
    timers.current.clear();

    // Clear all intervals
    intervals.current.forEach(interval => clearInterval(interval));
    intervals.current.clear();

    // Remove all event listeners
    eventListeners.current.forEach(({ element, event, handler }) => {
      try {
        element.removeEventListener(event, handler);
      } catch (error) {
        // REMOVED: console.error('Failed to remove event listener:', error);
      }
    });
    eventListeners.current.length = 0;

    cleanupFunctions.current.clear();
    isCleanedUp.current = true;
  }, []);

  // Automatic cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    addCleanup,
    cleanup,
    isCleanedUp: isCleanedUp.current,
  };
}

// Enhanced timeout/interval hooks with automatic cleanup
export function useSafeTimeout(
  callback: () => void,
  delay: number | null,
  deps?: React.DependencyList
) {
  const memoryManager = useMemoryCleanup();
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => {
        if (!memoryManager.isCleanedUp) {
          callbackRef.current();
        }
      }, delay);

      memoryManager.addCleanup(() => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      });
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, memoryManager, ...(deps || [])]);
}

export function useSafeInterval(
  callback: () => void,
  delay: number | null,
  deps?: React.DependencyList
) {
  const memoryManager = useMemoryCleanup();
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      intervalRef.current = setInterval(() => {
        if (!memoryManager.isCleanedUp) {
          callbackRef.current();
        }
      }, delay);

      memoryManager.addCleanup(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      });
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [delay, memoryManager, ...(deps || [])]);
}

// Enhanced event listener hook with automatic cleanup
export function useSafeEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: EventTarget | null,
  options?: boolean | AddEventListenerOptions
) {
  const memoryManager = useMemoryCleanup();
  const handlerRef = useRef(handler);

  // Update handler ref
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const targetElement = element || window;
    
    const wrappedHandler = (event: Event) => {
      if (!memoryManager.isCleanedUp) {
        handlerRef.current(event as WindowEventMap[K]);
      }
    };

    targetElement.addEventListener(eventName, wrappedHandler, options);

    memoryManager.addCleanup(() => {
      targetElement.removeEventListener(eventName, wrappedHandler, options);
    });

    return () => {
      targetElement.removeEventListener(eventName, wrappedHandler, options);
    };
  }, [eventName, element, memoryManager, options]);
}

// Enhanced fetch hook with automatic abort
export function useSafeFetch() {
  const memoryManager = useMemoryCleanup();
  const abortControllersRef = useRef<Set<AbortController>>(new Set());

  const safeFetch = useCallback(async (
    url: string,
    options?: RequestInit
  ): Promise<Response> => {
    if (memoryManager.isCleanedUp) {
      throw new Error('Component is unmounted');
    }

    const abortController = new AbortController();
    abortControllersRef.current.add(abortController);

    const fetchOptions: RequestInit = {
      ...options,
      signal: abortController.signal,
    };

    try {
      const response = await fetch(url, fetchOptions);
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // REMOVED: console.log('Fetch aborted');
      }
      throw error;
    } finally {
      abortControllersRef.current.delete(abortController);
    }
  }, [memoryManager]);

  // Cleanup all pending requests
  useEffect(() => {
    memoryManager.addCleanup(() => {
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    });
  }, [memoryManager]);

  return safeFetch;
}

// File reader cleanup hook
export function useFileReader() {
  const memoryManager = useMemoryCleanup();
  const readersRef = useRef<Set<FileReader>>(new Set());

  const createReader = useCallback(() => {
    if (memoryManager.isCleanedUp) {
      throw new Error('Component is unmounted');
    }

    const reader = new FileReader();
    readersRef.current.add(reader);

    // Auto-cleanup when read completes or errors
    const cleanup = () => {
      readersRef.current.delete(reader);
    };

    reader.addEventListener('load', cleanup);
    reader.addEventListener('error', cleanup);
    reader.addEventListener('abort', cleanup);

    return reader;
  }, [memoryManager]);

  useEffect(() => {
    memoryManager.addCleanup(() => {
      readersRef.current.forEach(reader => {
        if (reader.readyState === FileReader.LOADING) {
          reader.abort();
        }
      });
      readersRef.current.clear();
    });
  }, [memoryManager]);

  return createReader;
}

// Media stream cleanup hook
export function useMediaStream() {
  const memoryManager = useMemoryCleanup();
  const streamsRef = useRef<Set<MediaStream>>(new Set());

  const addStream = useCallback((stream: MediaStream) => {
    if (memoryManager.isCleanedUp) {
      console.warn('Attempting to add stream to unmounted component');
      return;
    }

    streamsRef.current.add(stream);

    memoryManager.addCleanup(() => {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    });
  }, [memoryManager]);

  const stopStream = useCallback((stream: MediaStream) => {
    stream.getTracks().forEach(track => {
      track.stop();
    });
    streamsRef.current.delete(stream);
  }, []);

  useEffect(() => {
    memoryManager.addCleanup(() => {
      streamsRef.current.forEach(stream => {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      });
      streamsRef.current.clear();
    });
  }, [memoryManager]);

  return { addStream, stopStream };
}

// WebSocket cleanup hook
export function useWebSocket(url: string | null) {
  const memoryManager = useMemoryCleanup();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!url || memoryManager.isCleanedUp) return;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    memoryManager.addCleanup(() => {
      if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    });

    return () => {
      if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [url, memoryManager]);

  return socketRef.current;
}

// Observer cleanup hook (for Intersection, Mutation, Resize observers)
export function useObserver<T extends {
  disconnect(): void;
  observe(target: Element): void;
  unobserve(target: Element): void;
}>(createObserver: () => T) {
  const memoryManager = useMemoryCleanup();
  const observerRef = useRef<T | null>(null);
  const observedElementsRef = useRef<Set<Element>>(new Set());

  const getObserver = useCallback(() => {
    if (!observerRef.current && !memoryManager.isCleanedUp) {
      observerRef.current = createObserver();
      
      memoryManager.addCleanup(() => {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
        observedElementsRef.current.clear();
      });
    }
    return observerRef.current;
  }, [createObserver, memoryManager]);

  const observe = useCallback((element: Element) => {
    const observer = getObserver();
    if (observer && !memoryManager.isCleanedUp) {
      observer.observe(element);
      observedElementsRef.current.add(element);
    }
  }, [getObserver, memoryManager]);

  const unobserve = useCallback((element: Element) => {
    const observer = getObserver();
    if (observer) {
      observer.unobserve(element);
      observedElementsRef.current.delete(element);
    }
  }, [getObserver]);

  return { observe, unobserve };
}

// Animation frame cleanup
export function useAnimationFrame(callback: (timestamp: number) => void) {
  const memoryManager = useMemoryCleanup();
  const callbackRef = useRef(callback);
  const requestRef = useRef<number>();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const animate = useCallback((timestamp: number) => {
    if (!memoryManager.isCleanedUp) {
      callbackRef.current(timestamp);
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [memoryManager]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);

    memoryManager.addCleanup(() => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    });

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [animate, memoryManager]);
}