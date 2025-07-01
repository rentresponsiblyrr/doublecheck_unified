import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { inspectionRouter } from '@/server/api/routers/inspection';
import { createMockContext } from '../../utils/trpc-test-utils';
import { TRPCError } from '@trpc/server';
import { InspectionStatus, PassStatus } from '~/lib/database';

describe('inspectionRouter', () => {
  const mockPrisma = {
    property: {
      findUnique: jest.fn(),
    },
    checklistTemplate: {
      findFirst: jest.fn(),
    },
    inspection: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
    checklistItem: {
      createMany: jest.fn(),
    },
    activity: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new inspection', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockProperty = {
        id: 'prop-1',
        organizationId: 'test-org-id',
      };

      const mockTemplate = {
        id: 'template-1',
        categories: [
          {
            id: 'cat-1',
            templateItems: [
              { id: 'item-1', label: 'Smoke Detector', evidenceType: 'PHOTO' },
              { id: 'item-2', label: 'Fire Extinguisher', evidenceType: 'PHOTO' },
            ],
          },
        ],
      };

      const mockInspection = {
        id: 'inspection-1',
        propertyId: 'prop-1',
        inspectorId: 'test-user-id',
        organizationId: 'test-org-id',
        templateId: 'template-1',
        status: 'IN_PROGRESS',
        property: mockProperty,
        template: mockTemplate,
      };

      mockPrisma.property.findUnique.mockResolvedValue(mockProperty);
      mockPrisma.checklistTemplate.findFirst.mockResolvedValue(mockTemplate);
      mockPrisma.inspection.create.mockResolvedValue(mockInspection);
      mockPrisma.checklistItem.createMany.mockResolvedValue({ count: 2 });
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = inspectionRouter.createCaller(ctx);
      const result = await caller.create({
        propertyId: 'prop-1',
      });

      expect(result).toEqual(mockInspection);
      expect(mockPrisma.checklistItem.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            inspectionId: 'inspection-1',
            templateItemId: 'item-1',
            label: 'Smoke Detector',
          }),
          expect.objectContaining({
            inspectionId: 'inspection-1',
            templateItemId: 'item-2',
            label: 'Fire Extinguisher',
          }),
        ]),
      });
    });

    it('should throw error if property not found', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      mockPrisma.property.findUnique.mockResolvedValue(null);

      const caller = inspectionRouter.createCaller(ctx);
      
      await expect(
        caller.create({ propertyId: 'invalid-prop' })
      ).rejects.toThrow(TRPCError);
    });

    it('should throw error if no template found', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      mockPrisma.property.findUnique.mockResolvedValue({
        id: 'prop-1',
        organizationId: 'test-org-id',
      });
      mockPrisma.checklistTemplate.findFirst.mockResolvedValue(null);

      const caller = inspectionRouter.createCaller(ctx);
      
      await expect(
        caller.create({ propertyId: 'prop-1' })
      ).rejects.toThrow('No active checklist template found');
    });
  });

  describe('update', () => {
    it('should update inspection status', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockInspection = {
        id: 'inspection-1',
        organizationId: 'test-org-id',
        status: 'IN_PROGRESS',
      };

      mockPrisma.inspection.findUnique.mockResolvedValue(mockInspection);
      mockPrisma.inspection.update.mockResolvedValue({
        ...mockInspection,
        status: 'COMPLETED',
        completedAt: new Date(),
      });
      mockPrisma.activity.create.mockResolvedValue({});

      const caller = inspectionRouter.createCaller(ctx);
      const result = await caller.update({
        id: 'inspection-1',
        status: InspectionStatus.COMPLETED,
        score: 95,
        passStatus: PassStatus.PASSED,
      });

      expect(result.status).toBe('COMPLETED');
      expect(mockPrisma.inspection.update).toHaveBeenCalledWith({
        where: { id: 'inspection-1' },
        data: expect.objectContaining({
          status: InspectionStatus.COMPLETED,
          score: 95,
          passStatus: PassStatus.PASSED,
          completedAt: expect.any(Date),
        }),
      });
    });
  });

  describe('get', () => {
    it('should return inspection with all related data', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockInspection = {
        id: 'inspection-1',
        organizationId: 'test-org-id',
        property: { name: 'Test Property' },
        inspector: { name: 'Test Inspector' },
        checklistItems: [
          { id: 'item-1', label: 'Test Item', status: 'PENDING' },
        ],
      };

      mockPrisma.inspection.findUnique.mockResolvedValue(mockInspection);

      const caller = inspectionRouter.createCaller(ctx);
      const result = await caller.get({ id: 'inspection-1' });

      expect(result).toEqual(mockInspection);
      expect(mockPrisma.inspection.findUnique).toHaveBeenCalledWith({
        where: { id: 'inspection-1' },
        include: expect.objectContaining({
          property: true,
          inspector: expect.any(Object),
          checklistItems: expect.any(Object),
        }),
      });
    });
  });

  describe('list', () => {
    it('should list inspections with filters', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      const mockInspections = [
        { id: 'inspection-1', status: 'IN_PROGRESS' },
        { id: 'inspection-2', status: 'IN_PROGRESS' },
      ];

      mockPrisma.inspection.findMany.mockResolvedValue(mockInspections);

      const caller = inspectionRouter.createCaller(ctx);
      const result = await caller.list({
        status: InspectionStatus.IN_PROGRESS,
        limit: 10,
      });

      expect(result.inspections).toEqual(mockInspections);
      expect(mockPrisma.inspection.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          organizationId: 'test-org-id',
          status: InspectionStatus.IN_PROGRESS,
        }),
        take: 11,
        orderBy: { createdAt: 'desc' },
        include: expect.any(Object),
      });
    });
  });

  describe('getMetrics', () => {
    it('should return inspection metrics', async () => {
      const ctx = createMockContext();
      ctx.prisma = mockPrisma as any;

      mockPrisma.inspection.count.mockResolvedValueOnce(100); // total
      mockPrisma.inspection.count.mockResolvedValueOnce(75); // completed
      mockPrisma.inspection.aggregate.mockResolvedValue({
        _avg: { score: 92.5 },
      });
      mockPrisma.inspection.groupBy.mockResolvedValue([
        { status: 'COMPLETED', _count: 75 },
        { status: 'IN_PROGRESS', _count: 20 },
        { status: 'SCHEDULED', _count: 5 },
      ]);

      const caller = inspectionRouter.createCaller(ctx);
      const result = await caller.getMetrics({});

      expect(result).toEqual({
        total: 100,
        completed: 75,
        avgScore: 92.5,
        completionRate: 75,
        byStatus: {
          COMPLETED: 75,
          IN_PROGRESS: 20,
          SCHEDULED: 5,
        },
      });
    });
  });
});