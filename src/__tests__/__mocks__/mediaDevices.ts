/**
 * PROFESSIONAL MEDIA DEVICES MOCK - ZERO TOLERANCE STANDARDS
 * 
 * Comprehensive media devices mock for testing camera and video functionality.
 */

import { vi } from 'vitest';

export const mockMediaDevices = {
  mediaDevices: {
    getUserMedia: vi.fn(() => Promise.resolve({
      getTracks: () => [{ stop: vi.fn() }],
      getVideoTracks: () => [{ stop: vi.fn() }],
      getAudioTracks: () => [{ stop: vi.fn() }],
    })),
    enumerateDevices: vi.fn(() => Promise.resolve([
      { deviceId: 'camera1', kind: 'videoinput', label: 'Back Camera' },
      { deviceId: 'camera2', kind: 'videoinput', label: 'Front Camera' },
    ])),
  },
  
  geolocation: {
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
  
  MediaRecorder: vi.fn().mockImplementation(() => ({
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
  })),
};