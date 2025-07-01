import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { InspectionStatus, PassStatus } from '@str-certified/database';

const createInspectionSchema = z.object({
  propertyId: z.string(),
  templateId: z.string().optional(),
  scheduledDate: z.date().optional(),
});

const updateInspectionSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(InspectionStatus).optional(),
  score: z.number().min(0).max(100).optional(),
  passStatus: z.nativeEnum(PassStatus).optional(),
  aiInsights: z.any().optional(),
});

export const inspectionRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createInspectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify property belongs to user's organization
      const property = await ctx.prisma.property.findUnique({
        where: { id: input.propertyId },
      });

      if (!property || property.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Property not found or access denied',
        });
      }

      // Get default template if not specified
      let templateId = input.templateId;
      if (!templateId) {
        const defaultTemplate = await ctx.prisma.checklistTemplate.findFirst({
          where: {
            organizationId: ctx.session.user.organizationId,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        });

        if (!defaultTemplate) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No active checklist template found',
          });
        }
        templateId = defaultTemplate.id;
      }

      // Create inspection
      const inspection = await ctx.prisma.inspection.create({
        data: {
          propertyId: input.propertyId,
          inspectorId: ctx.session.user.id,
          organizationId: ctx.session.user.organizationId,
          templateId,
          scheduledDate: input.scheduledDate,
          status: input.scheduledDate ? 'SCHEDULED' : 'IN_PROGRESS',
        },
        include: {
          property: true,
          template: {
            include: {
              categories: {
                include: {
                  templateItems: true,
                },
              },
            },
          },
        },
      });

      // Create checklist items from template
      if (inspection.template) {
        const checklistItems = [];
        for (const category of inspection.template.categories) {
          for (const item of category.templateItems) {
            checklistItems.push({
              inspectionId: inspection.id,
              templateItemId: item.id,
              categoryId: category.id,
              label: item.label,
              evidenceType: item.evidenceType,
            });
          }
        }

        await ctx.prisma.checklistItem.createMany({
          data: checklistItems,
        });
      }

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          inspectionId: inspection.id,
          action: 'CREATED_INSPECTION',
          entityType: 'inspection',
          entityId: inspection.id,
        },
      });

      return inspection;
    }),

  update: protectedProcedure
    .input(updateInspectionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify inspection belongs to user's organization
      const inspection = await ctx.prisma.inspection.findUnique({
        where: { id: input.id },
      });

      if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Inspection not found or access denied',
        });
      }

      const updatedInspection = await ctx.prisma.inspection.update({
        where: { id: input.id },
        data: {
          status: input.status,
          score: input.score,
          passStatus: input.passStatus,
          aiInsights: input.aiInsights,
          ...(input.status === 'COMPLETED' && { completedAt: new Date() }),
          ...(input.status === 'IN_PROGRESS' && !inspection.startedAt && { startedAt: new Date() }),
        },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          inspectionId: inspection.id,
          action: 'UPDATED_INSPECTION',
          entityType: 'inspection',
          entityId: inspection.id,
          metadata: input,
        },
      });

      return updatedInspection;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const inspection = await ctx.prisma.inspection.findUnique({
        where: { id: input.id },
        include: {
          property: true,
          inspector: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          checklistItems: {
            include: {
              category: true,
              media: true,
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: [
              { category: { sortOrder: 'asc' } },
              { createdAt: 'asc' },
            ],
          },
          assignments: {
            include: {
              inspector: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Inspection not found or access denied',
        });
      }

      return inspection;
    }),

  list: protectedProcedure
    .input(
      z.object({
        propertyId: z.string().optional(),
        status: z.nativeEnum(InspectionStatus).optional(),
        inspectorId: z.string().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { propertyId, status, inspectorId, limit, cursor } = input;

      const where = {
        organizationId: ctx.session.user.organizationId,
        ...(propertyId && { propertyId }),
        ...(status && { status }),
        ...(inspectorId && { inspectorId }),
      };

      const inspections = await ctx.prisma.inspection.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
            },
          },
          inspector: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              checklistItems: true,
              media: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (inspections.length > limit) {
        const nextItem = inspections.pop();
        nextCursor = nextItem!.id;
      }

      return {
        inspections,
        nextCursor,
      };
    }),

  getMetrics: protectedProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        organizationId: ctx.session.user.organizationId,
        ...(input.startDate && {
          createdAt: {
            gte: input.startDate,
            ...(input.endDate && { lte: input.endDate }),
          },
        }),
      };

      const [total, completed, avgScore, byStatus] = await Promise.all([
        ctx.prisma.inspection.count({ where }),
        ctx.prisma.inspection.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        ctx.prisma.inspection.aggregate({
          where: { ...where, status: 'COMPLETED', score: { not: null } },
          _avg: { score: true },
        }),
        ctx.prisma.inspection.groupBy({
          by: ['status'],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        completed,
        avgScore: avgScore._avg.score || 0,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),
});