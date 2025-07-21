/**
 * PROFESSIONAL TEST SETUP - ZERO TOLERANCE STANDARDS
 * 
 * Global test configuration for professional testing environment.
 * Sets up DOM environment, mocks, and testing utilities.
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Type definitions for test mocks
type MockFileContent = string | ArrayBuffer | Uint8Array;
type MockFileOptions = {
  type?: string;
  lastModified?: number;
  [key: string]: unknown;
};

type MockEventHandler = ((event: Event) => void) | null;

type MockFileReaderResult = string | ArrayBuffer | null;

interface MockFile {
  content: MockFileContent[];
  name: string;
  options: MockFileOptions;
  size: number;
  type: string;
}

interface MockFileReader {
  onload: MockEventHandler;
  onerror: MockEventHandler;
  onabort: MockEventHandler;
  result: MockFileReaderResult;
  readAsDataURL(file: MockFile): void;
  readAsText(file: MockFile): void;
}

interface MockMediaRecorder {
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
  state: string;
  ondataavailable: MockEventHandler;
  onstop: MockEventHandler;
  onerror: MockEventHandler;
  onstart: MockEventHandler;
  onpause: MockEventHandler;
  onresume: MockEventHandler;
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.mark and performance.measure
global.performance.mark = vi.fn();
global.performance.measure = vi.fn();
global.performance.getEntriesByType = vi.fn(() => []);
global.performance.getEntriesByName = vi.fn(() => []);

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock File and FileReader
global.File = class MockFileImpl implements MockFile {
  constructor(public content: MockFileContent[], public name: string, public options: MockFileOptions = {}) {}
  get size() { return this.content.length; }
  get type() { return this.options.type || ''; }
} as unknown as typeof File;

global.FileReader = class MockFileReaderImpl implements MockFileReader {
  onload: MockEventHandler = null;
  onerror: MockEventHandler = null;
  onabort: MockEventHandler = null;
  result: MockFileReaderResult = null;
  
  readAsDataURL(file: MockFile) {
    setTimeout(() => {
      this.result = `data:${file.type};base64,mock-data`;
      if (this.onload) this.onload({ target: this } as Event);
    }, 0);
  }
  
  readAsText(file: MockFile) {
    setTimeout(() => {
      this.result = 'mock file content';
      if (this.onload) this.onload({ target: this } as Event);
    }, 0);
  }
} as unknown as typeof FileReader;

// Mock canvas for photo capture testing
global.HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
}));

global.HTMLCanvasElement.prototype.toBlob = vi.fn((callback) => {
  callback(new Blob(['mock-canvas-data'], { type: 'image/png' }));
});

global.HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 
  'data:image/png;base64,mock-canvas-data'
);

// Mock HTMLVideoElement for video recording testing
global.HTMLVideoElement.prototype.play = vi.fn(() => Promise.resolve());
global.HTMLVideoElement.prototype.pause = vi.fn();
global.HTMLVideoElement.prototype.load = vi.fn();

// Mock MediaRecorder for video testing
global.MediaRecorder = vi.fn().mockImplementation((): MockMediaRecorder => ({
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  state: 'inactive',
  ondataavailable: null,
  onstop: null,
  onerror: null,
  onstart: null,
  onpause: null,
  onresume: null,
})) as unknown as typeof MediaRecorder;

// Mock getUserMedia for camera testing
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [{ stop: vi.fn() }],
    })),
    enumerateDevices: vi.fn(() => Promise.resolve([
      { deviceId: 'camera1', kind: 'videoinput', label: 'Camera 1' },
      { deviceId: 'camera2', kind: 'videoinput', label: 'Camera 2' },
    ])),
  },
});

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn((success) => {
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      });
    }),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
});

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
});

// Mock window.scrollTo
window.scrollTo = vi.fn();

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // 60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});