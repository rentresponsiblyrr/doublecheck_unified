/**
 * PROFESSIONAL SUPABASE MOCK - ZERO TOLERANCE STANDARDS
 * 
 * Comprehensive Supabase client mock for testing.
 * Provides realistic API responses and error scenarios.
 */

import { vi } from 'vitest';

export const supabase = {
  auth: {
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
  
  from: vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
        order: vi.fn(() => ({ data: [], error: null })),
      })),
      in: vi.fn(() => ({ data: [], error: null })),
      order: vi.fn(() => ({ data: [], error: null })),
      limit: vi.fn(() => ({ data: [], error: null })),
      range: vi.fn(() => ({ data: [], error: null })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
      match: vi.fn(() => ({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
      match: vi.fn(() => ({ data: null, error: null })),
    })),
    upsert: vi.fn(() => ({ data: null, error: null })),
  })),
  
  storage: {
    from: vi.fn((bucket: string) => ({
      upload: vi.fn(),
      download: vi.fn(),
      getPublicUrl: vi.fn(),
      remove: vi.fn(),
      list: vi.fn(),
      createSignedUrl: vi.fn(),
    })),
  },
  
  rpc: vi.fn(),
  
  channel: vi.fn(() => ({
    on: vi.fn(() => ({ subscribe: vi.fn() })),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  })),
  
  removeChannel: vi.fn(),
};