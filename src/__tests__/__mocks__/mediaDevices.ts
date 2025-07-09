import { vi } from 'vitest';

export const mockMediaDevices = {
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => [
        {
          kind: 'video',
          stop: vi.fn(),
          getSettings: vi.fn(() => ({
            width: 1920,
            height: 1080,
            facingMode: 'environment',
          })),
        },
      ]),
      getVideoTracks: vi.fn(() => [
        {
          stop: vi.fn(),
          getSettings: vi.fn(() => ({
            width: 1920,
            height: 1080,
          })),
        },
      ]),
      getAudioTracks: vi.fn(() => [
        {
          stop: vi.fn(),
        },
      ]),
    }),
    enumerateDevices: vi.fn().mockResolvedValue([
      {
        deviceId: 'camera-1',
        kind: 'videoinput',
        label: 'Back Camera',
      },
      {
        deviceId: 'camera-2',
        kind: 'videoinput',
        label: 'Front Camera',
      },
      {
        deviceId: 'mic-1',
        kind: 'audioinput',
        label: 'Default Microphone',
      },
    ]),
    getDisplayMedia: vi.fn().mockResolvedValue({
      getTracks: vi.fn(() => [
        {
          kind: 'video',
          stop: vi.fn(),
        },
      ]),
    }),
  },
  
  MediaRecorder: vi.fn().mockImplementation((stream, options) => ({
    state: 'inactive',
    start: vi.fn().mockImplementation(function() {
      this.state = 'recording';
      if (this.onstart) this.onstart();
    }),
    stop: vi.fn().mockImplementation(function() {
      this.state = 'inactive';
      if (this.onstop) this.onstop();
      if (this.ondataavailable) {
        this.ondataavailable({
          data: new Blob(['mock video data'], { type: 'video/webm' }),
        });
      }
    }),
    pause: vi.fn().mockImplementation(function() {
      this.state = 'paused';
      if (this.onpause) this.onpause();
    }),
    resume: vi.fn().mockImplementation(function() {
      this.state = 'recording';
      if (this.onresume) this.onresume();
    }),
    requestData: vi.fn(),
    onstart: null,
    onstop: null,
    onpause: null,
    onresume: null,
    ondataavailable: null,
    onerror: null,
  })),
  
  geolocation: {
    getCurrentPosition: vi.fn().mockImplementation((success, error, options) => {
      setTimeout(() => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
      }, 100);
    }),
    watchPosition: vi.fn().mockReturnValue(1),
    clearWatch: vi.fn(),
  },
};

// Mock static methods
(mockMediaDevices.MediaRecorder as any).isTypeSupported = vi.fn((type: string) => {
  const supportedTypes = [
    'video/webm',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/mp4',
  ];
  return supportedTypes.includes(type);
});