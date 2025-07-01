import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';

const uploadMediaSchema = z.object({
  checklistItemId: z.string().optional(),
  inspectionId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  size: z.number(),
  url: z.string(),
  thumbnailUrl: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  offlineId: z.string().optional(),
});

export const mediaRouter = createTRPCRouter({
  upload: protectedProcedure
    .input(uploadMediaSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify inspection belongs to user's organization
      const inspection = await ctx.prisma.inspection.findUnique({
        where: { id: input.inspectionId },
      });

      if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Inspection not found or access denied',
        });
      }

      // If checklistItemId provided, verify it belongs to the inspection
      if (input.checklistItemId) {
        const item = await ctx.prisma.checklistItem.findUnique({
          where: { id: input.checklistItemId },
        });

        if (!item || item.inspectionId !== input.inspectionId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid checklist item',
          });
        }
      }

      const media = await ctx.prisma.media.create({
        data: {
          ...input,
          uploadedById: ctx.session.user.id,
        },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          inspectionId: input.inspectionId,
          action: 'UPLOADED_MEDIA',
          entityType: 'media',
          entityId: media.id,
          metadata: {
            filename: input.filename,
            mimeType: input.mimeType,
          },
        },
      });

      return media;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify media belongs to user's organization
      const media = await ctx.prisma.media.findUnique({
        where: { id: input.id },
        include: {
          inspection: true,
        },
      });

      if (!media || media.inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Media not found or access denied',
        });
      }

      await ctx.prisma.media.delete({
        where: { id: input.id },
      });

      // Log activity
      await ctx.prisma.activity.create({
        data: {
          userId: ctx.session.user.id,
          inspectionId: media.inspectionId,
          action: 'DELETED_MEDIA',
          entityType: 'media',
          entityId: input.id,
          metadata: {
            filename: media.filename,
          },
        },
      });

      return { success: true };
    }),

  list: protectedProcedure
    .input(
      z.object({
        inspectionId: z.string().optional(),
        checklistItemId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { inspectionId, checklistItemId, limit, cursor } = input;

      const where: any = {};

      if (inspectionId) {
        // Verify inspection belongs to user's organization
        const inspection = await ctx.prisma.inspection.findUnique({
          where: { id: inspectionId },
        });

        if (!inspection || inspection.organizationId !== ctx.session.user.organizationId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Inspection not found or access denied',
          });
        }

        where.inspectionId = inspectionId;
      }

      if (checklistItemId) {
        where.checklistItemId = checklistItemId;
      }

      const media = await ctx.prisma.media.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { uploadedAt: 'desc' },
        include: {
          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (media.length > limit) {
        const nextItem = media.pop();
        nextCursor = nextItem!.id;
      }

      return {
        media,
        nextCursor,
      };
    }),

  updateAiAnalysis: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        aiAnalysis: z.any(),
        aiTags: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Verify media belongs to user's organization
      const media = await ctx.prisma.media.findUnique({
        where: { id },
        include: {
          inspection: true,
        },
      });

      if (!media || media.inspection.organizationId !== ctx.session.user.organizationId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Media not found or access denied',
        });
      }

      const updatedMedia = await ctx.prisma.media.update({
        where: { id },
        data,
      });

      return updatedMedia;
    }),
});