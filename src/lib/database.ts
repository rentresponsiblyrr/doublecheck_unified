// Database types and enums
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export enum UserRole {
  ADMIN = 'ADMIN',
  INSPECTOR = 'INSPECTOR',
  VIEWER = 'VIEWER'
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PassStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  CONDITIONAL = 'CONDITIONAL'
}

export enum PropertyType {
  SINGLE_FAMILY = 'SINGLE_FAMILY',
  CONDO = 'CONDO',
  APARTMENT = 'APARTMENT',
  TOWNHOUSE = 'TOWNHOUSE',
  OTHER = 'OTHER'
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  ARCHIVED = 'ARCHIVED'
}

export enum Platform {
  MANUAL = 'MANUAL',
  AIRBNB = 'AIRBNB',
  VRBO = 'VRBO',
  BOOKING = 'BOOKING'
}

export enum ItemStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING'
}

export enum AiStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export { PrismaClient } from '@prisma/client';
export type { Prisma, User, Organization, Property, Inspection, ChecklistItem } from '@prisma/client';