export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  Organization,
  Property,
  Inspection,
  ChecklistItem,
  Media,
  Category,
  ChecklistTemplate,
  TemplateItem,
} from '@prisma/client';

// Create a global prisma instance
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;