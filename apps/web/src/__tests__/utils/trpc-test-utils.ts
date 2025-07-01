import { createTRPCMsw } from 'msw-trpc';
import { type AppRouter } from '@/server/api/root';
import superjson from 'superjson';

export const trpcMsw = createTRPCMsw<AppRouter>({
  transformer: superjson,
});

export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'INSPECTOR',
    organizationId: 'test-org-id',
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

export const createMockContext = (session = createMockSession()) => ({
  session,
  prisma: {
    // Mock Prisma client methods as needed
  },
});

export const mockTRPCResponse = <T>(data: T) => ({
  data,
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
  refetch: jest.fn(),
});