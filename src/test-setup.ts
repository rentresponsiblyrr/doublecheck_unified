// Test setup file for vitest
import { vi } from "vitest";

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
process.env.VITE_SUPABASE_ANON_KEY = "test-anon-key";

// Mock global fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Mock window.location
Object.defineProperty(window, "location", {
  value: {
    href: "http://localhost:3000",
    origin: "http://localhost:3000",
    hostname: "localhost",
    pathname: "/",
    search: "",
    hash: "",
  },
  writable: true,
});

// Mock navigator
Object.defineProperty(navigator, "onLine", {
  value: true,
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

// Mock MediaDevices
Object.defineProperty(navigator, "mediaDevices", {
  value: {
    getUserMedia: vi.fn(),
  },
  writable: true,
});

// Mock geolocation
Object.defineProperty(navigator, "geolocation", {
  value: {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  },
  writable: true,
});

// Mock Worker for web worker testing
global.Worker = class MockWorker {
  constructor(scriptURL: string) {
    // Mock worker implementation
  }

  postMessage(data: unknown) {
    // Mock postMessage
  }

  terminate() {
    // Mock terminate
  }

  addEventListener(type: string, listener: EventListener) {
    // Mock addEventListener
  }

  removeEventListener(type: string, listener: EventListener) {
    // Mock removeEventListener
  }
};

// Mock indexedDB for offline storage testing
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
  readyState: "done",
};

const mockIDBDatabase = {
  name: "test-db",
  version: 1,
  objectStoreNames: [],
  transaction: vi.fn(() => mockIDBTransaction),
  close: vi.fn(),
  createObjectStore: vi.fn(() => mockIDBObjectStore),
  deleteObjectStore: vi.fn(),
};

const mockIDBTransaction = {
  objectStore: vi.fn(() => mockIDBObjectStore),
  abort: vi.fn(),
  oncomplete: null,
  onerror: null,
  onabort: null,
};

const mockIDBObjectStore = {
  add: vi.fn(() => mockIDBRequest),
  put: vi.fn(() => mockIDBRequest),
  get: vi.fn(() => mockIDBRequest),
  delete: vi.fn(() => mockIDBRequest),
  clear: vi.fn(() => mockIDBRequest),
  count: vi.fn(() => mockIDBRequest),
  createIndex: vi.fn(),
  deleteIndex: vi.fn(),
  index: vi.fn(),
};

global.indexedDB = {
  open: vi.fn(() => ({
    ...mockIDBRequest,
    result: mockIDBDatabase,
    onupgradeneeded: null,
    onblocked: null,
    onversionchange: null,
  })),
  deleteDatabase: vi.fn(() => mockIDBRequest),
  databases: vi.fn(() => Promise.resolve([])),
  cmp: vi.fn(),
};

// Mock hooks that components use
vi.mock("@/hooks/useCamera", () => ({
  useCamera: vi.fn(() => ({
    stream: null,
    error: null,
    isLoading: false,
    startCamera: vi.fn(),
    stopCamera: vi.fn(),
    capturePhoto: vi.fn(() => Promise.resolve(new File([], "test.jpg"))),
  })),
}));

vi.mock("@/hooks/useMediaUpload", () => ({
  useMediaUpload: vi.fn(() => ({
    uploadMedia: vi.fn(() =>
      Promise.resolve({ success: true, url: "test-url" }),
    ),
    isUploading: false,
    uploadProgress: 0,
    error: null,
  })),
}));

vi.mock("@/hooks/usePhotoGuidance", () => ({
  usePhotoGuidance: vi.fn(() => ({
    guidance: null,
    isAnalyzing: false,
    analyzePhoto: vi.fn(),
    error: null,
  })),
}));

// Accessibility testing setup
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";
import "@testing-library/jest-dom/vitest";

// Extend expect with accessibility matchers
expect.extend(toHaveNoViolations);

// Mock screen reader announcements for testing
global.screenReaderAnnouncements = [];
const originalCreateElement = document.createElement;
document.createElement = function (tagName: string) {
  const element = originalCreateElement.call(this, tagName);

  // Track screen reader announcements for testing
  if (element.setAttribute) {
    const originalSetAttribute = element.setAttribute;
    element.setAttribute = function (name: string, value: string) {
      if (name === "aria-live" && element.textContent) {
        global.screenReaderAnnouncements.push({
          message: element.textContent,
          priority: value,
          timestamp: Date.now(),
        });
      }
      return originalSetAttribute.call(this, name, value);
    };
  }

  return element;
};

// Mock performance.memory for memory leak testing
Object.defineProperty(performance, "memory", {
  value: {
    usedJSHeapSize: 10000000, // 10MB baseline
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 100000000,
  },
  writable: true,
});

// Mock window.getComputedStyle for touch target testing
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = function (element: Element) {
  // Create a proper CSSStyleDeclaration mock
  const mockStyle = {
    height: "48px",
    width: "48px",
    minHeight: "44px",
    minWidth: "44px",
    display: "block",
    visibility: "visible",
    opacity: "1",
    getPropertyValue: function (prop: string) {
      return this[prop as keyof typeof this] || "";
    },
    getPropertyPriority: () => "",
    item: () => "",
    removeProperty: () => "",
    setProperty: () => {},
    length: 0,
    cssText: "",
    parentRule: null,
    [Symbol.iterator]: function* () {
      // Mock iterator
    },
  };

  // Add enumerable properties for standard CSS properties
  Object.defineProperties(mockStyle, {
    height: { value: "48px", enumerable: true },
    width: { value: "48px", enumerable: true },
    minHeight: { value: "44px", enumerable: true },
    minWidth: { value: "44px", enumerable: true },
    display: { value: "block", enumerable: true },
    visibility: { value: "visible", enumerable: true },
    opacity: { value: "1", enumerable: true },
  });

  return mockStyle as CSSStyleDeclaration;
};

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  global.screenReaderAnnouncements = [];
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
});
