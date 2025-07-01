import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { scraperRouter } from '@/server/api/routers/scraper';
import { createMockContext } from '../../utils/trpc-test-utils';
import { TRPCError } from '@trpc/server';
import { Platform } from '@str-certified/database';

// Mock playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newContext: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
          goto: jest.fn(),
          waitForTimeout: jest.fn(),
          $$eval: jest.fn().mockResolvedValue([
            'https://images.vrbo.com/property1.jpg',
            'https://images.vrbo.com/property2.jpg',
            'https://images.vrbo.com/property3.jpg',
          ]),
        }),
      }),
      close: jest.fn(),
    }),
  },
}));

describe('scraperRouter', () => {
  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    scraperJob: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scrapeImages', () => {
    it('should scrape images from VRBO URL', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockJob = { id: 'job-1', propertyId: 'prop-1' };
      mockPrisma.scraperJob.create.mockResolvedValue(mockJob);
      mockPrisma.scraperJob.update.mockResolvedValue({ ...mockJob, status: 'COMPLETED' });

      const caller = scraperRouter.createCaller(ctx);
      const result = await caller.scrapeImages({
        vrboId: '123456',
        platform: Platform.VRBO,
      });

      expect(result.success).toBe(true);
      expect(result.imageUrls).toHaveLength(3);
      expect(result.count).toBe(3);
      expect(mockPrisma.scraperJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          platform: Platform.VRBO,
          status: 'RUNNING',
        }),
      });
    });

    it('should scrape images for existing property', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockProperty = {
        id: 'prop-1',
        organizationId: 'test-org-id',
        vrboUrl: 'https://www.vrbo.com/123456',
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.scraperJob.create.mockResolvedValue({ id: 'job-1' });
      mockPrisma.scraperJob.update.mockResolvedValue({ id: 'job-1', status: 'COMPLETED' });
      mockPrisma.property.update.mockResolvedValue(mockProperty);

      const caller = scraperRouter.createCaller(ctx);
      const result = await caller.scrapeImages({
        propertyId: 'prop-1',
        platform: Platform.VRBO,
      });

      expect(result.success).toBe(true);
      expect(mockPrisma.property.update).toHaveBeenCalledWith({
        where: { id: 'prop-1' },
        data: expect.objectContaining({
          photos: expect.any(Array),
          scrapedData: expect.objectContaining({
            lastScrapedAt: expect.any(Date),
            imageCount: 3,
          }),
        }),
      });
    });

    it('should throw error if no valid input provided', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const caller = scraperRouter.createCaller(ctx);
      
      await expect(
        caller.scrapeImages({ platform: Platform.VRBO })
      ).rejects.toThrow(TRPCError);
    });

    it('should throw error for unauthorized property access', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        organizationId: 'different-org-id',
      });

      const caller = scraperRouter.createCaller(ctx);
      
      await expect(
        caller.scrapeImages({ propertyId: 'prop-1', platform: Platform.VRBO })
      ).rejects.toThrow(TRPCError);
    });

    it('should handle scraper failures', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const chromium = require('playwright').chromium;
      chromium.launch.mockRejectedValue(new Error('Browser launch failed'));

      mockPrisma.scraperJob.create.mockResolvedValue({ id: 'job-1' });
      mockPrisma.scraperJob.update.mockResolvedValue({ id: 'job-1', status: 'FAILED' });

      const caller = scraperRouter.createCaller(ctx);
      
      await expect(
        caller.scrapeImages({ vrboId: '123456', platform: Platform.VRBO })
      ).rejects.toThrow('Failed to scrape images');

      expect(mockPrisma.scraperJob.update).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: expect.objectContaining({
          status: 'FAILED',
          error: 'Browser launch failed',
        }),
      });
    });
  });

  describe('getScraperJob', () => {
    it('should return job details', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockJob = {
        id: 'job-1',
        property: {
          organizationId: 'test-org-id',
        },
      };

      mockPrisma.scraperJob.findUnique.mockResolvedValue(mockJob);

      const caller = scraperRouter.createCaller(ctx);
      const result = await caller.getScraperJob({ jobId: 'job-1' });

      expect(result).toEqual(mockJob);
    });

    it('should throw error for unauthorized job access', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      mockPrisma.scraperJob.findUnique.mockResolvedValue({
        id: 'job-1',
        property: {
          organizationId: 'different-org-id',
        },
      });

      const caller = scraperRouter.createCaller(ctx);
      
      await expect(
        caller.getScraperJob({ jobId: 'job-1' })
      ).rejects.toThrow(TRPCError);
    });
  });

  describe('listScraperJobs', () => {
    it('should list jobs for organization', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockJobs = [
        { id: 'job-1', propertyId: 'prop-1' },
        { id: 'job-2', propertyId: 'prop-2' },
      ];

      mockPrisma.scraperJob.findMany.mockResolvedValue(mockJobs);

      const caller = scraperRouter.createCaller(ctx);
      const result = await caller.listScraperJobs({
        limit: 10,
      });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.nextCursor).toBeUndefined();
    });

    it('should paginate results', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockJobs = Array.from({ length: 21 }, (_, i) => ({
        id: `job-${i}`,
        propertyId: `prop-${i}`,
      }));

      mockPrisma.scraperJob.findMany.mockResolvedValue(mockJobs);

      const caller = scraperRouter.createCaller(ctx);
      const result = await caller.listScraperJobs({
        limit: 20,
      });

      expect(result.jobs).toHaveLength(20);
      expect(result.nextCursor).toBe('job-19');
    });
  });
});