// Database types and enums
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  INSPECTOR = 'INSPECTOR',
  REVIEWER = 'REVIEWER',
  API_USER = 'API_USER'
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PassStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CONDITIONAL = 'CONDITIONAL'
}

export enum PropertyType {
  HOUSE = 'HOUSE',
  APARTMENT = 'APARTMENT',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  CABIN = 'CABIN',
  VILLA = 'VILLA',
  OTHER = 'OTHER'
}

export enum PropertyStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  CERTIFIED = 'CERTIFIED',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED'
}

export enum Platform {
  VRBO = 'VRBO',
  AIRBNB = 'AIRBNB',
  BOOKING = 'BOOKING'
}

export enum ItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  NA = 'NA'
}

export enum AiStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  ERROR = 'ERROR'
}

export { PrismaClient } from '@prisma/client';
export type { Prisma, User, Organization, Property, Inspection, ChecklistItem } from '@prisma/client';