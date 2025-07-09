import { vi } from 'vitest';

export const mockSupabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: { session: { user: { id: 'test-user-1' } } },
      error: null,
    }),
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-1', email: 'test@example.com' } },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-1' } },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: { id: 'test-user-1' } },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 'test-1', name: 'Test Item' },
      error: null,
    }),
    then: vi.fn().mockResolvedValue({
      data: [{ id: 'test-1', name: 'Test Item' }],
      error: null,
    }),
  })),
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn().mockResolvedValue({
        data: { path: 'test-file.jpg' },
        error: null,
      }),
      download: vi.fn().mockResolvedValue({
        data: new Blob(['test data']),
        error: null,
      }),
      remove: vi.fn().mockResolvedValue({
        data: null,
        error: null,
      }),
      list: vi.fn().mockResolvedValue({
        data: [{ name: 'test-file.jpg' }],
        error: null,
      }),
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://test.com/test-file.jpg' },
      }),
    })),
    listBuckets: vi.fn().mockResolvedValue({
      data: [
        { name: 'property-photos' },
        { name: 'inspection-videos' },
      ],
      error: null,
    }),
  },
  rpc: vi.fn().mockResolvedValue({
    data: { result: 'success' },
    error: null,
  }),
};